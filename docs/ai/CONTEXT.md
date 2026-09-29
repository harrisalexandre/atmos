# Atmos — Contexto

Atmos é uma plataforma de monitoramento meteorológico focada inicialmente em Santiago/RS, com dados aeronáuticos da REDEMET/DECEA e evolução planejada para uma experiência integrada de radar, satélite, estações, alertas, nowcasting e modelagem.

## Objetivo do produto

Reunir em uma única interface operacional:

- radar meteorológico;
- imagens de satélite;
- condições atuais de estações/aeródromos;
- METAR, TAF e SIGMET;
- avisos meteorológicos;
- histórico e animação temporal;
- previsão e, posteriormente, WRF de alta resolução;
- recursos de nowcasting e acompanhamento de células.

A experiência desejada é de uma plataforma meteorológica operacional, inspirada em produtos modernos do mesmo segmento, sem copiar identidade visual ou implementação de terceiros.

## Plataforma atual

- Frontend: React + TypeScript + Vite.
- Ícones: lucide-react.
- Backend/BaaS: Supabase.
- Banco: PostgreSQL.
- Edge Functions: Supabase Edge Functions.
- Deploy frontend: GitHub Pages.
- Coleta REDEMET: Edge Function `redemet-poll`.
- Atualização: pg_cron + Realtime.
- Branch canônica: `main`.

## Fonte de dados

Fluxo atual:

```
REDEMET / DECEA
      ↓
redemet-poll
      ↓
Supabase PostgreSQL
      ↓
Realtime
      ↓
Atmos Web
```

O frontend não deve acessar diretamente credenciais privadas da REDEMET.

## Dados atuais

O banco já possui:

- `redemet_aerodromos`;
- `redemet_mensagens`;
- `redemet_radar`;
- `redemet_logs`.

A tabela `redemet_radar` já armazena frames de radar e satélite com URL, timestamp do frame e horário de coleta.

## Direção de produto

A evolução será incremental:

1. fundação visual e sistema de animações;
2. Radar Player temporal;
3. dashboard meteorológico;
4. central de dados e alertas;
5. player de satélite;
6. nowcasting;
7. WRF e produtos de previsão.

A camada de backend REDEMET atualmente estabilizada deve ser preservada enquanto a interface é evoluída.
