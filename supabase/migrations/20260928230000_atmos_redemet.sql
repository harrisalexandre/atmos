create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

create table if not exists public.redemet_aerodromos (
  icao text primary key,
  name text not null,
  city text,
  role text not null check (role in ('principal','apoio')),
  latitude double precision not null,
  longitude double precision not null,
  distance_km numeric(8,2),
  enabled boolean not null default true,
  validated_at timestamptz,
  updated_at timestamptz not null default now()
);
create table if not exists public.redemet_mensagens (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('METAR','TAF','AVISO','SIGMET')),
  localidade text not null,
  raw text not null,
  decoded jsonb not null default '{}'::jsonb,
  observado_em timestamptz not null,
  fetched_at timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  unique(localidade,tipo,observado_em)
);
create table if not exists public.redemet_radar (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  tipo text not null,
  frame_url text not null,
  frame_timestamp timestamptz not null,
  fetched_at timestamptz not null default now(),
  unique(area,tipo,frame_timestamp)
);
create table if not exists public.redemet_logs (
  id bigint generated always as identity primary key,
  level text not null,
  event text not null,
  path text,
  status integer,
  attempt integer,
  duration_ms integer,
  error text,
  scope text,
  created_at timestamptz not null default now()
);
create index if not exists redemet_mensagens_localidade_observado_idx on public.redemet_mensagens(localidade,observado_em desc);
create index if not exists redemet_mensagens_tipo_observado_idx on public.redemet_mensagens(tipo,observado_em desc);
create index if not exists redemet_radar_area_timestamp_idx on public.redemet_radar(area,frame_timestamp desc);

alter table public.redemet_aerodromos enable row level security;
alter table public.redemet_mensagens enable row level security;
alter table public.redemet_radar enable row level security;
alter table public.redemet_logs enable row level security;

drop policy if exists "authenticated read aerodromes" on public.redemet_aerodromos;
create policy "authenticated read aerodromes" on public.redemet_aerodromos for select to authenticated using (true);
drop policy if exists "authenticated read messages" on public.redemet_mensagens;
create policy "authenticated read messages" on public.redemet_mensagens for select to authenticated using (true);
drop policy if exists "authenticated read radar" on public.redemet_radar;
create policy "authenticated read radar" on public.redemet_radar for select to authenticated using (true);
drop policy if exists "authenticated read logs" on public.redemet_logs;
create policy "authenticated read logs" on public.redemet_logs for select to authenticated using (true);

revoke insert,update,delete on public.redemet_aerodromos from anon,authenticated;
revoke insert,update,delete on public.redemet_mensagens from anon,authenticated;
revoke insert,update,delete on public.redemet_radar from anon,authenticated;
revoke insert,update,delete on public.redemet_logs from anon,authenticated;

alter publication supabase_realtime add table public.redemet_mensagens;
alter publication supabase_realtime add table public.redemet_radar;

insert into public.redemet_aerodromos(icao,name,city,role,latitude,longitude,enabled)
values
('SBSM','A validar pela REDEMET','Santa Maria/RS','principal',-29.7114,-53.6882,true),
('SBNM','A validar pela REDEMET','Santo Ângelo/RS','apoio',-28.2817,-54.1691,true),
('SBUG','A validar pela REDEMET','Uruguaiana/RS','apoio',-29.7822,-57.0382,true),
('SBPA','A validar pela REDEMET','Porto Alegre/RS','apoio',-29.9939,-51.1711,true)
on conflict (icao) do nothing;

select cron.unschedule(jobid) from cron.job where jobname in ('atmos-redemet-messages','atmos-redemet-imagery');
select cron.schedule('atmos-redemet-messages','*/5 * * * *',$$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='atmos_project_url') || '/functions/v1/redemet-poll?scope=messages',
    headers := jsonb_build_object('Content-Type','application/json','apikey',(select decrypted_secret from vault.decrypted_secrets where name='atmos_secret_key')),
    body := '{}'::jsonb
  );
$$);
select cron.schedule('atmos-redemet-imagery','*/10 * * * *',$$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='atmos_project_url') || '/functions/v1/redemet-poll?scope=imagery',
    headers := jsonb_build_object('Content-Type','application/json','apikey',(select decrypted_secret from vault.decrypted_secrets where name='atmos_secret_key')),
    body := '{}'::jsonb
  );
$$);
