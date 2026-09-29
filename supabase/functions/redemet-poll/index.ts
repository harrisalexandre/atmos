import { withSupabase } from "npm:@supabase/server";

type JsonObject = Record<string, unknown>;
type Scope = "messages" | "imagery" | "all";
type RedemetEnvelope = JsonObject & { status?: boolean; message?: unknown; data?: unknown };
type ApiMessage = { id_localidade?: string; id_fir?: string; validade_inicial?: string; validade_final?: string; mens?: string; recebimento?: string };
type AerodromeApi = { cod?: string; nome?: string; cidade?: string; lat_dec?: string; lon_dec?: string; [key: string]: unknown };

const BASE = "https://api-redemet.decea.mil.br";
const SANTIAGO = { lat: -29.1897, lon: -54.8667 };
const CANDIDATES = ["SBSM", "SBNM", "SBUG", "SBPA"];
const MAX_RETRIES = 5;

function objectOf(value: unknown): JsonObject {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) return value as JsonObject;
  return {};
}
function text(value: unknown): string | undefined { return typeof value === "string" ? value : undefined; }
function nestedData(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const data = objectOf(value).data;
  return Array.isArray(data) ? data : [];
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
  const d = new Date(value.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function parseMetar(raw: string): JsonObject {
  const tokens = raw.replace("=", "").trim().split(/\s+/), out: JsonObject = { raw };
  const wind = tokens.find((x) => /^\d{3}\d{2,3}KT$/.test(x) || /^VRB\d{2,3}KT$/.test(x));
  if (wind) {
    out.wind = wind; out.wind_direction = wind.slice(0, 3); out.wind_speed_kt = Number(wind.match(/(\d{2,3})KT/)?.[1] ?? 0);
    const gust = wind.match(/G(\d{2,3})KT/); if (gust) out.wind_gust_kt = Number(gust[1]);
  }
  const vis = tokens.find((x) => /^\d{4}$/.test(x) || /^\d{4}[NESW]{1,2}$/.test(x)); if (vis) out.visibility = vis;
  const cloud = tokens.filter((x) => /^(FEW|SCT|BKN|OVC|VV)\d{3}$/.test(x)); out.clouds = cloud;
  const ceiling = cloud.filter((x) => x.startsWith("BKN") || x.startsWith("OVC") || x.startsWith("VV")).map((x) => Number(x.slice(3)) * 100);
  if (ceiling.length) out.ceiling_ft = Math.min(...ceiling);
  const td = tokens.find((x) => /^M?\d{2}\/M?\d{2}$/.test(x));
  if (td) { const [v, d] = td.split("/"); out.temperature_c = v.startsWith("M") ? -Number(v.slice(1)) : Number(v); out.dewpoint_c = d.startsWith("M") ? -Number(d.slice(1)) : Number(d); }
  const q = tokens.find((x) => /^Q\d{4}$/.test(x)); if (q) out.qnh_hpa = Number(q.slice(1));
  out.cavok = tokens.includes("CAVOK"); out.thunderstorm = tokens.some((x) => x.includes("TS")); out.precipitation = tokens.filter((x) => /^(?:[-+]?)(RA|SN|DZ|GR|GS|SH)/.test(x));
  return out;
}
async function sleep(ms: number): Promise<void> { await new Promise<void>((resolve) => setTimeout(resolve, ms)); }

async function fetchRedemet(path: string, apiKey: string, log: (payload: JsonObject) => Promise<void>): Promise<RedemetEnvelope> {
  let last = "unknown";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000), started = Date.now();
    try {
      const separator = path.includes("?") ? "&" : "?";
      const response = await fetch(BASE + path, { signal: controller.signal, headers: { Accept: "application/json", "User-Agent": "Atmos/0.1 REDEMET monitor", "X-Api-Key": apiKey } });
      const body = await response.text(); last = response.status + " " + body.slice(0, 180);
      await log({ level: response.ok ? "info" : "warn", event: "redemet_request", path, status: response.status, attempt, duration_ms: Date.now() - started });
      if (response.ok) return objectOf(JSON.parse(body)) as RedemetEnvelope;
      if (response.status !== 429 && response.status < 500) break;
    } catch (error: unknown) {
      last = error instanceof Error ? error.message : "request failed";
      await log({ level: "warn", event: "redemet_request_error", path, attempt, error: last, duration_ms: Date.now() - started });
    } finally { clearTimeout(timer); }
    if (attempt < MAX_RETRIES) await sleep(Math.min(1000 * 2 ** (attempt - 1), 16000));
  }
  throw new Error("REDEMET request failed after " + MAX_RETRIES + " attempts: " + last);
}

async function syncAerodromes(admin: { from: (table: string) => { upsert: (value: JsonObject[], options: JsonObject) => Promise<{ error: unknown }> } }, apiKey: string, log: (p: JsonObject) => Promise<void>) {
  const response = await fetchRedemet("/aerodromos/?pais=Brasil", apiKey, log);
  const candidates = nestedData(response).map(objectOf).filter((x) => CANDIDATES.includes(text(x.cod) ?? ""));
  const ranked = candidates.map((x: AerodromeApi) => {
    const lat = Number(x.lat_dec), lon = Number(x.lon_dec);
    return { icao: text(x.cod) ?? "", name: text(x.nome) ?? "", city: text(x.cidade) ?? null, latitude: lat, longitude: lon, distance_km: haversineKm(SANTIAGO.lat, SANTIAGO.lon, lat, lon) };
  }).filter((x) => Number.isFinite(x.distance_km)).sort((a, b) => a.distance_km - b.distance_km);
  if (!ranked.length) throw new Error("Nenhum aeródromo candidato foi validado pela REDEMET.");
  const selected = ranked.slice(0, 3).map((x, i) => ({ ...x, role: i === 0 ? "principal" : "apoio", enabled: true, validated_at: new Date().toISOString() }));
  const disabled = CANDIDATES.filter((icao) => !selected.some((x) => x.icao === icao)).map((icao) => ({ icao, enabled: false, validated_at: new Date().toISOString() }));
  const result = await admin.from("redemet_aerodromos").upsert([...selected, ...disabled], { onConflict: "icao" });
  if (result.error) throw new Error("Falha ao salvar aeródromos.");
  return selected;
}

async function upsertMessages(admin: { from: (table: string) => { upsert: (value: JsonObject[], options: JsonObject) => Promise<{ error: unknown }> } }, type: string, rows: ApiMessage[]) {
  const payload = rows.filter((x) => text(x.mens)).map((x) => ({
    tipo: type, localidade: x.id_localidade ?? x.id_fir ?? "BRASIL", raw: x.mens ?? "",
    decoded: type === "METAR" ? parseMetar(x.mens ?? "") : { raw: x.mens ?? "", source: "REDEMET" },
    observado_em: parseDate(x.validade_inicial ?? x.recebimento) ?? new Date().toISOString(),
    fetched_at: new Date().toISOString(), valid_until: parseDate(x.validade_final)
  }));
  if (payload.length) {
    const result = await admin.from("redemet_mensagens").upsert(payload, { onConflict: "localidade,tipo,observado_em" });
    if (result.error) throw new Error("Falha ao salvar " + type + ".");
  }
}

async function pollMessages(admin: { from: (table: string) => { upsert: (value: JsonObject[], options: JsonObject) => Promise<{ error: unknown }> } }, apiKey: string, log: (p: JsonObject) => Promise<void>) {
  const stations = await syncAerodromes(admin, apiKey, log), icaos = stations.map((x) => x.icao).join(",");
  const [metar, taf, avisos, sigmet] = await Promise.all([
    fetchRedemet("/mensagens/metar/" + icaos + "?data_ini=" + utcHour(new Date(Date.now() - 2 * 3600000)) + "&data_fim=" + utcHour(), apiKey, log),
    fetchRedemet("/mensagens/taf/" + icaos + "?data_ini=" + utcHour(new Date(Date.now() - 12 * 3600000)) + "&data_fim=" + utcHour(), apiKey, log),
    fetchRedemet("/mensagens/aviso/" + icaos + "?data_ini=" + utcHour(new Date(Date.now() - 6 * 3600000)) + "&data_fim=" + utcHour(), apiKey, log),
    fetchRedemet("/mensagens/sigmet?pais=Brasil&data_ini=" + utcMinute(new Date(Date.now() - 6 * 3600000)) + "&data_fim=" + utcMinute(), apiKey, log)
  ]);
  for (const [type, response] of [["METAR", metar], ["TAF", taf], ["AVISO", avisos], ["SIGMET", sigmet]] as const) await upsertMessages(admin, type, nestedData(response).map((x) => objectOf(x) as ApiMessage));
}

async function pollImagery(admin: { from: (table: string) => { upsert: (value: JsonObject[], options: JsonObject) => Promise<{ error: unknown }> } }, apiKey: string, log: (p: JsonObject) => Promise<void>) {
  const [radar, sat] = await Promise.all([fetchRedemet("/produtos/radar/maxcappi?area=sg", apiKey, log), fetchRedemet("/produtos/satelite/realcada", apiKey, log)]);
  const radarData = objectOf(radar.data), radarItems = (Array.isArray(radarData.radar) ? radarData.radar : []).flatMap((x) => Array.isArray(x) ? x.map(objectOf) : []).filter((x) => text(x.localidade) === "sg" && text(x.path));
  const latest = radarItems.sort((a, b) => String(b.data ?? "").localeCompare(String(a.data ?? "")))[0];
  if (latest) {
    const result = await admin.from("redemet_radar").upsert([{ area: "sg", tipo: "maxcappi", frame_url: text(latest.path) ?? "", frame_timestamp: parseDate(text(latest.data)) ?? new Date().toISOString(), fetched_at: new Date().toISOString() }], { onConflict: "area,tipo,frame_timestamp" });
    if (result.error) throw new Error("Falha ao salvar radar.");
  }
  const satData = objectOf(sat.data), satItems = (Array.isArray(satData.satelite) ? satData.satelite : []).map(objectOf).filter((x) => text(x.path));
  const satLatest = satItems.sort((a, b) => String(b.data ?? "").localeCompare(String(a.data ?? "")))[0];
  if (satLatest) {
    const result = await admin.from("redemet_radar").upsert([{ area: "brasil", tipo: "satelite-realcada", frame_url: text(satLatest.path) ?? "", frame_timestamp: parseDate(text(satLatest.data)) ?? new Date().toISOString(), fetched_at: new Date().toISOString() }], { onConflict: "area,tipo,frame_timestamp" });
    if (result.error) throw new Error("Falha ao salvar satélite.");
  }
}

export default withSupabase({ auth: "secret" }, async (req, ctx) => {
  const started = Date.now(), apiKey = Deno.env.get("REDEMET_API_KEY");
  if (!apiKey) return Response.json({ ok: false, error: "REDEMET_API_KEY não configurada." }, { status: 500 });
  const scopeRaw = new URL(req.url).searchParams.get("scope") ?? "all";
  const scope: Scope = scopeRaw === "messages" || scopeRaw === "imagery" || scopeRaw === "all" ? scopeRaw : "all";
  const log = async (payload: JsonObject): Promise<void> => { try { await ctx.supabaseAdmin.from("redemet_logs").insert(payload); } catch { /* observability must not break polling */ } };
  try {
    if (scope === "messages" || scope === "all") await pollMessages(ctx.supabaseAdmin, apiKey, log);
    if (scope === "imagery" || scope === "all") await pollImagery(ctx.supabaseAdmin, apiKey, log);
    await log({ level: "info", event: "poll_success", scope, duration_ms: Date.now() - started });
    return Response.json({ ok: true, scope });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "poll failed";
    await log({ level: "error", event: "poll_failed", scope, error: message, duration_ms: Date.now() - started });
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
});
