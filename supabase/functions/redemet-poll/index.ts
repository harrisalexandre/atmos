import { withSupabase } from "npm:@supabase/server@1.8.1";

type JsonObject = Record<string, unknown>;
type Scope = "messages" | "imagery" | "all";
type RedemetEnvelope = JsonObject & { status?: boolean; message?: unknown; data?: unknown };
type ApiMessage = { id_localidade?: string; id_fir?: string; validade_inicial?: string; validade_final?: string; mens?: string; recebimento?: string };
type AerodromeApi = { cod?: string; nome?: string; cidade?: string; lat_dec?: string; lon_dec?: string; [key: string]: unknown };

const BASE = "https://api-redemet.decea.mil.br";
const SANTIAGO = { lat: -29.1897, lon: -54.8667 };
const CANDIDATES = ["SBSM", "SBNM", "SBUG", "SBPA"];
const MAX_RETRIES = 3;
const ATTEMPT_TIMEOUT_MS = 8000;
const GLOBAL_TIMEOUT_MS = 25000;
const AERODROME_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let aerodromeCache: { expiresAt: number; selected: Array<{ icao: string; name: string; city: string | null; latitude: number; longitude: number; distance_km: number }> } | null = null;

function objectOf(value: unknown): JsonObject {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) return value as JsonObject;
  return {};
}
function text(value: unknown): string | undefined { return typeof value === "string" ? value : undefined; }
function nestedData(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const data = objectOf(value).data;
  if (Array.isArray(data)) return data;
  const paged = objectOf(data).data;
  return Array.isArray(paged) ? paged : [];
}
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371, p = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * p / 2) ** 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin((lon2 - lon1) * p / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}
function utcHour(date = new Date()): string { return date.toISOString().slice(0, 13).replace(/[-T:]/g, ""); }
function utcMinute(date = new Date()): string { return date.toISOString().slice(0, 16).replace(/[-T:]/g, ""); }
function parseDate(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(normalized) ? normalized : normalized + "Z");
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function parseMetar(raw: string): JsonObject {
  const clean = raw.replace(/=$/, "").trim();
  const tokens = clean.split(/\s+/);
  const cut = tokens.findIndex((x) => x === "TEMPO" || x === "BECMG" || x === "RMK");
  const main = cut >= 0 ? tokens.slice(0, cut) : tokens;
  const out: JsonObject = { raw };
  const wind = main.find((x) => /^\d{3}\d{2,3}(?:G\d{2,3})?KT$/.test(x) || /^VRB\d{2,3}(?:G\d{2,3})?KT$/.test(x));
  if (wind) {
    out.wind = wind;
    out.wind_direction = wind.startsWith("VRB") ? "VRB" : wind.slice(0, 3);
    const speed = wind.match(/^(?:\d{3}|VRB)(\d{2,3})KT/)?.[1];
    const gust = wind.match(/G(\d{2,3})KT/)?.[1];
    if (speed) out.wind_speed_kt = Number(speed);
    if (gust) out.wind_gust_kt = Number(gust);
  }
  if (main.includes("CAVOK")) {
    out.cavok = true;
    out.visibility = "9999";
    out.vis_m = 10000;
  } else {
    const vis = main.find((x) => /^\d{4}$/.test(x) || /^\d{4}[NESW]{1,2}$/.test(x));
    if (vis) {
      out.visibility = vis;
      const digits = Number(vis.slice(0, 4));
      out.vis_m = Number.isFinite(digits) ? digits : undefined;
    }
  }
  const cloud = main.filter((x) => /^(FEW|SCT|BKN|OVC|VV|NSC)\d{3}$/.test(x) || /^(FEW|SCT|BKN|OVC|VV)\d{3}(CB|TCU)$/.test(x));
  out.clouds = cloud;
  const significant = main.filter((x) => /^(?:[-+]?)(?:TS|SH|RA|SN|DZ|GR|GS|FG|BR|HZ)/.test(x));
  out.precipitation = significant;
  out.thunderstorm = main.some((x) => x.includes("TS"));
  out.cb = main.some((x) => x.includes("CB"));
  out.tcu = main.some((x) => x.includes("TCU"));
  const ceilings = cloud.filter((x) => /^(BKN|OVC|VV)\d{3}/.test(x)).map((x) => Number(x.slice(3, 6)) * 100).filter(Number.isFinite);
  if (ceilings.length) out.ceiling_ft = Math.min(...ceilings);
  const td = main.find((x) => /^M?\d{2}\/M?\d{2}$/.test(x));
  if (td) {
    const [v, d] = td.split("/");
    out.temperature_c = v.startsWith("M") ? -Number(v.slice(1)) : Number(v);
    out.dewpoint_c = d.startsWith("M") ? -Number(d.slice(1)) : Number(d);
  }
  const q = main.find((x) => /^Q\d{4}$/.test(x));
  if (q) out.qnh_hpa = Number(q.slice(1));
  const flightVisibility = Number(out.vis_m);
  const ceiling = Number(out.ceiling_ft);
  out.flight_category = Number.isFinite(flightVisibility) && flightVisibility < 1600 || Number.isFinite(ceiling) && ceiling < 500 ? "LIFR"
    : Number.isFinite(flightVisibility) && flightVisibility < 5000 || Number.isFinite(ceiling) && ceiling < 1000 ? "IFR"
    : Number.isFinite(flightVisibility) && flightVisibility < 8000 || Number.isFinite(ceiling) && ceiling < 3000 ? "MVFR"
    : "VFR";
  return out;
}
async function sleep(ms: number): Promise<void> { await new Promise<void>((resolve) => setTimeout(resolve, ms)); }

async function fetchRedemet(path: string, apiKey: string, log: (payload: JsonObject) => Promise<void>, deadline: number): Promise<RedemetEnvelope> {
  let last = "unknown";
  for (let attempt = 1; attempt <= MAX_RETRIES && Date.now() < deadline; attempt++) {
    const remaining = Math.max(1, deadline - Date.now());
    const timeoutMs = Math.min(ATTEMPT_TIMEOUT_MS, remaining);
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs), started = Date.now();
    try {
      await log({ level: "info", event: "step_start", path, attempt });
      const response = await fetch(BASE + path, { signal: controller.signal, headers: { Accept: "application/json", "User-Agent": "Atmos/0.1 REDEMET monitor", "X-Api-Key": apiKey } });
      const body = await response.text(); last = response.status + " " + body.slice(0, 180);
      await log({ level: response.ok ? "info" : "warn", event: "step_done", path, status: response.status, attempt, duration_ms: Date.now() - started });
      if (response.ok) return objectOf(JSON.parse(body)) as RedemetEnvelope;
      if (response.status !== 429 && response.status < 500) break;
    } catch (error: unknown) {
      last = error instanceof Error ? error.message : "request failed";
      await log({ level: "warn", event: "step_failed", path, attempt, error: last, duration_ms: Date.now() - started });
    } finally { clearTimeout(timer); }
    if (attempt < MAX_RETRIES && Date.now() < deadline) await sleep(Math.min(1000 * 2 ** (attempt - 1), Math.max(0, deadline - Date.now())));
  }
  throw new Error("REDEMET request failed after " + MAX_RETRIES + " attempts: " + last);
}

async function syncAerodromes(admin: any, apiKey: string, log: (p: JsonObject) => Promise<void>, deadline: number) {
  if (aerodromeCache && aerodromeCache.expiresAt > Date.now()) return aerodromeCache.selected;
  const response = await fetchRedemet("/aerodromos/?pais=Brasil", apiKey, log, deadline);
  const candidates = nestedData(response).map(objectOf).filter((x) => CANDIDATES.includes(text(x.cod) ?? ""));
  const ranked = candidates.map((x: AerodromeApi) => {
    const lat = Number(x.lat_dec), lon = Number(x.lon_dec);
    return { icao: text(x.cod) ?? "", name: text(x.nome) ?? "", city: text(x.cidade) ?? null, latitude: lat, longitude: lon, distance_km: haversineKm(SANTIAGO.lat, SANTIAGO.lon, lat, lon) };
  }).filter((x) => Number.isFinite(x.distance_km)).sort((a, b) => a.distance_km - b.distance_km);
  if (!ranked.length) throw new Error("Nenhum aeródromo candidato foi validado pela REDEMET.");
  const selected = ranked.slice(0, 3);
  await admin.from("redemet_aerodromos").upsert([
    ...selected.map((x, i) => ({ ...x, role: i === 0 ? "principal" : "apoio", enabled: true, validated_at: new Date().toISOString() })),
    ...CANDIDATES.filter((icao) => !selected.some((x) => x.icao === icao)).map((icao) => ({ icao, enabled: false, validated_at: new Date().toISOString() }))
  ], { onConflict: "icao" });
  aerodromeCache = { expiresAt: Date.now() + AERODROME_CACHE_TTL_MS, selected };
  return selected;
}

async function upsertMessages(admin: any, type: string, rows: ApiMessage[]) {
  const byKey = new Map<string, JsonObject>();
  for (const row of rows) {
    const raw = text(row.mens);
    if (!raw) continue;
    const localidade = text(row.id_localidade) ?? text(row.id_fir) ?? "BRASIL";
    const observado_em = parseDate(text(row.validade_inicial) ?? text(row.recebimento)) ?? new Date().toISOString();
    const key = localidade + "|" + type + "|" + observado_em;
    byKey.set(key, {
      tipo: type,
      localidade,
      raw,
      decoded: type === "METAR" ? parseMetar(raw) : { raw, source: "REDEMET" },
      observado_em,
      fetched_at: new Date().toISOString(),
      valid_until: parseDate(text(row.validade_final))
    });
  }
  const payload = [...byKey.values()];
  if (!payload.length) return 0;
  const result = await admin.from("redemet_mensagens").upsert(payload, { onConflict: "localidade,tipo,observado_em" });
  if (result.error) throw new Error("Falha ao salvar " + type + ": " + result.error.message);
  return payload.length;
}

async function pollMessages(admin: any, apiKey: string, log: (p: JsonObject) => Promise<void>, deadline: number) {
  const stations = await syncAerodromes(admin, apiKey, log, deadline);
  const icaos = stations.map((x: any) => x.icao).join(",");
  const calls = [
    ["METAR", "/mensagens/metar/" + icaos + "?data_ini=" + utcHour(new Date(Date.now() - 2 * 3600000)) + "&data_fim=" + utcHour(), apiKey],
    ["TAF", "/mensagens/taf/" + icaos + "?data_ini=" + utcHour(new Date(Date.now() - 12 * 3600000)) + "&data_fim=" + utcHour(), apiKey],
    ["AVISO", "/mensagens/aviso/" + icaos + "?data_ini=" + utcHour(new Date(Date.now() - 6 * 3600000)) + "&data_fim=" + utcHour(), apiKey],
    ["SIGMET", "/mensagens/sigmet?pais=Brasil&data_ini=" + utcMinute(new Date(Date.now() - 6 * 3600000)) + "&data_fim=" + utcMinute(), apiKey]
  ] as const;
  const results = await Promise.allSettled(calls.map(([type, path, key]) =>
    fetchRedemet(path, key, log, deadline).then(async (response) => {
      const count = await upsertMessages(admin, type, nestedData(response).map((x) => objectOf(x) as ApiMessage));
      return { type, count };
    })
  ));
  let successes = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      successes++;
      await log({ level: "info", event: "step_done", scope: "messages", path: result.value.type, status: 200, error: result.value.count + " registros salvos" });
    } else {
      const error = result.reason instanceof Error ? result.reason.message : "message poll failed";
      await log({ level: "error", event: "step_failed", scope: "messages", error });
    }
  }
  if (successes === 0) throw new Error("Todas as consultas de mensagens falharam.");
}

async function pollImagery(admin: any, apiKey: string, log: (p: JsonObject) => Promise<void>, deadline: number) {
  const results = await Promise.allSettled([
    fetchRedemet("/produtos/radar/maxcappi?area=sg", apiKey, log, deadline),
    fetchRedemet("/produtos/satelite/realcada", apiKey, log, deadline)
  ]);
  let successes = 0;
  for (const result of results) {
    if (result.status === "rejected") { await log({ level: "warn", event: "step_failed", error: result.reason instanceof Error ? result.reason.message : "imagery poll failed" }); continue; }
    successes++;
    const data = objectOf(result.value.data);
    if (Array.isArray(data.radar)) {
      const radarItems = data.radar.flatMap((item) => Array.isArray(item) ? item : [item]).map(objectOf).filter((x) => text(x.localidade)?.toLowerCase() === "sg" && text(x.path));
      const latest = radarItems.sort((a, b) => String(b.data ?? "").localeCompare(String(a.data ?? "")))[0];
      if (latest) {
        const save = await admin.from("redemet_radar").upsert([{ area: "sg", tipo: "maxcappi", frame_url: text(latest.path)!, frame_timestamp: parseDate(text(latest.data)) ?? new Date().toISOString(), fetched_at: new Date().toISOString() }], { onConflict: "area,tipo,frame_timestamp" });
        if (save.error) await log({ level: "error", event: "step_failed", error: "Falha ao salvar radar: " + save.error.message });
      }
    }
    if (Array.isArray(data.satelite)) {
      const satItems = data.satelite.map(objectOf).filter((x) => text(x.path));
      const latest = satItems.sort((a, b) => String(b.data ?? "").localeCompare(String(a.data ?? "")))[0];
      if (latest) {
        const save = await admin.from("redemet_radar").upsert([{ area: "brasil", tipo: "satelite-realcada", frame_url: text(latest.path)!, frame_timestamp: parseDate(text(latest.data)) ?? new Date().toISOString(), fetched_at: new Date().toISOString() }], { onConflict: "area,tipo,frame_timestamp" });
        if (save.error) await log({ level: "error", event: "step_failed", error: "Falha ao salvar satélite: " + save.error.message });
      }
    }
  }
  if (successes === 0) throw new Error("Radar e satélite falharam.");
}

const handler = withSupabase({ auth: "secret" }, async (req, ctx) => {
  const url = new URL(req.url);
  if (url.searchParams.get("scope") === "ping") return Response.json({ ok: true, ping: true, has_key: Boolean(Deno.env.get("REDEMET_API_KEY")) });
  const started = Date.now(), deadline = started + GLOBAL_TIMEOUT_MS, apiKey = Deno.env.get("REDEMET_API_KEY");
  if (!apiKey) return Response.json({ ok: false, error: "REDEMET_API_KEY não configurada." }, { status: 500 });
  const scopeRaw = url.searchParams.get("scope") ?? "all";
  const scope: Scope = scopeRaw === "messages" || scopeRaw === "imagery" || scopeRaw === "all" ? scopeRaw : "all";
  const log = async (payload: JsonObject): Promise<void> => {
    try {
      const { error } = await ctx.supabaseAdmin.from("redemet_logs").insert(payload);
      if (error) console.error("redemet_logs insert failed", error);
    } catch (error) { console.error("redemet_logs insert exception", error); }
  };
  const work = (async () => {
    await log({ level: "info", event: "poll_start", scope });
    try {
      const steps: Promise<unknown>[] = [];
      if (scope === "messages" || scope === "all") steps.push(pollMessages(ctx.supabaseAdmin, apiKey, log, deadline));
      if (scope === "imagery" || scope === "all") steps.push(pollImagery(ctx.supabaseAdmin, apiKey, log, deadline));
      const results = await Promise.allSettled(steps);
      const okCount = results.filter((x) => x.status === "fulfilled").length;
      if (okCount === 0) throw new Error("Todas as etapas do poll falharam.");
      await log({ level: "info", event: "poll_success", scope, duration_ms: Date.now() - started });
      return { ok: true, scope };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "poll failed";
      await log({ level: "error", event: "poll_failed", scope, error: message, duration_ms: Date.now() - started });
      throw error;
    }
  })();

  const runtime = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (url.searchParams.get("wait") !== "1" && runtime?.waitUntil) {
    runtime.waitUntil(work);
    return Response.json({ ok: true, accepted: true }, { status: 202 });
  }
  try { return Response.json(await work); }
  catch (error: unknown) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "poll failed" }, { status: 502 });
  }
});

export default { fetch: handler };
