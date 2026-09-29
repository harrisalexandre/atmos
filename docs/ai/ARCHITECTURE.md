# Atmos — Arquitetura

## Visão geral

```
REDEMET / DECEA
       │
       ▼
Supabase Edge Function
redemet-poll
       │
       ├── mensagens
       │      ├── METAR
       │      ├── TAF
       │      ├── SIGMET
       │      └── AVISO
       │
       └── imagery
              ├── Radar MaxCAPPI
              └── Satélite
       │
       ▼
PostgreSQL / Supabase
       │
       ▼
Postgres Realtime
       │
       ▼
React / Vite
       │
       ├── Dashboard
       ├── Radar
       ├── Dados
       ├── Alertas
       └── Satélite
```

## Frontend

O frontend usa React + TypeScript + Vite.

O cliente Supabase é criado em `src/lib/supabase.ts`.

O componente principal atual está em `src/App.tsx`.

A evolução visual deve separar progressivamente:

- layout;
- componentes;
- serviços;
- domínio meteorológico;
- estilos;
- animações.

## Backend

A função `supabase/functions/redemet-poll/index.ts` é responsável pela ingestão REDEMET.

Ela deve permanecer como fronteira de segurança para qualquer credencial privada da REDEMET.

## Banco

### redemet_aerodromos

Cadastro dos aeródromos monitorados.

### redemet_mensagens

Mensagens meteorológicas normalizadas.

Campos relevantes:

- `tipo`;
- `localidade`;
- `raw`;
- `decoded`;
- `observado_em`;
- `valid_until`;
- `fetched_at`.

### redemet_radar

Frames de imagens.

Campos relevantes:

- `area`;
- `tipo`;
- `frame_url`;
- `frame_timestamp`;
- `fetched_at`.

## Realtime

O frontend acompanha alterações nas tabelas meteorológicas e dispara nova leitura quando existem mudanças.

A evolução para um player temporal deve evitar recarregar a aplicação inteira para cada frame. O componente do player deve trabalhar com uma coleção temporal de frames.

## Futuro

A arquitetura deve permitir adicionar novas fontes sem acoplar a UI diretamente ao fornecedor.

Exemplo:

```
Source Adapter
      ↓
Normalized Weather Data
      ↓
Repository / Cache
      ↓
UI Component
```

Isso será especialmente importante para WRF, satélite e nowcasting.
