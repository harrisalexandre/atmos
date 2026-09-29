-- Public meteorological read access for the public dashboard.
-- No write access is granted to anon or authenticated clients.
drop policy if exists "public read aerodromes" on public.redemet_aerodromos;
create policy "public read aerodromes" on public.redemet_aerodromos
  for select to anon, authenticated using (true);

drop policy if exists "public read messages" on public.redemet_mensagens;
create policy "public read messages" on public.redemet_mensagens
  for select to anon, authenticated using (true);

drop policy if exists "public read radar" on public.redemet_radar;
create policy "public read radar" on public.redemet_radar
  for select to anon, authenticated using (true);

drop policy if exists "public read logs" on public.redemet_logs;
create policy "public read logs" on public.redemet_logs
  for select to authenticated using (true);
