# Atmos

Monitoramento meteorológico em tempo real para Santiago/RS usando a API-REDEMET (DECEA), Supabase Edge Functions, PostgreSQL Realtime e pg_cron.

## Arquitetura

- Frontend: React + Vite + TypeScript estrito.
- Edge Function: supabase/functions/redemet-poll.
- REDEMET_API_KEY: somente secret da Edge Function.
- METAR/SPECI, TAF, Avisos e SIGMET: a cada 5 minutos.
- MaxCAPPI e satélite: a cada 10 minutos.
- Realtime: o client assina redemet_mensagens e redemet_radar; não existe polling automático no browser.
- RLS: leitura para authenticated; escrita apenas pelo contexto privilegiado da Edge Function.
- Retry: até 5 tentativas com backoff exponencial e timeout de 15 segundos.
- Logs: redemet_logs.

## Aeródromos

A função valida via endpoint oficial /aerodromos os candidatos SBSM, SBNM, SBUG e SBPA e calcula a distância geodésica até Santiago. Os três mais próximos são mantidos habilitados, com o mais próximo como principal e os dois seguintes como apoio. A configuração fica em redemet_aerodromos.

## Supabase

1. Aplicar supabase/migrations/20260928230000_atmos_redemet.sql no projeto correto.
2. No Vault do projeto, criar atmos_project_url e atmos_secret_key. O segundo deve ser a Secret Key do projeto, usada apenas pelo pg_cron para chamar a Edge Function.
3. Configurar REDEMET_API_KEY como secret da Edge Function.
4. Fazer deploy da função redemet-poll.
5. Configurar VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no frontend.

A chave da REDEMET nunca deve entrar no client, no Git ou em variáveis VITE_*.

> Deploy: alterações na `main` acionam o GitHub Actions para reconstruir e publicar o frontend no GitHub Pages.

## Desenvolvimento

npm install
npm run lint
npm run build
npm run dev

A API-REDEMET exige cadastro/chave e possui limite de uso. Mantenha a frequência dentro dos termos do DECEA.
