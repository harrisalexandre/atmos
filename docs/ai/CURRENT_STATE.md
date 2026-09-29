# Atmos — Estado atual

**Atualizado em:** 29/09/2026  
**Branch canônica:** `main`

## 1. Onde estamos

O pipeline REDEMET está funcional e validado. A próxima etapa é transformar a interface atual em uma plataforma meteorológica operacional, com linguagem visual próxima da experiência observada nos prints de referência e com animações orientadas a dados.

## 2. Backend — consolidado

### REDEMET

A Edge Function `redemet-poll` está ativa e publicada.

Estado atual:

- timeout global de 25s;
- timeout por tentativa de 8s;
- até 3 tentativas;
- processamento independente dos blocos;
- logging operacional;
- cache de aeródromos;
- persistência de METAR, TAF, SIGMET e AVISO;
- persistência de frames de radar;
- persistência de satélite;
- modo `scope=ping`;
- modo `scope=messages`;
- modo `scope=imagery`.

### Cron

- mensagens: a cada 5 minutos;
- imagens: a cada 10 minutos;
- chamadas usam timeout de 30s;
- secrets são obtidos pelo Vault.

### Banco

`redemet_radar` possui índice por área/timestamp e leitura pública controlada.

O frontend recebe:

- radar MaxCAPPI de `area=sg`;
- satélite realçado de `area=brasil`.

## 3. Frontend — estado atual

O frontend já:

- carrega aeródromos;
- calcula condição VFR/MVFR/IFR/LIFR;
- exibe métricas METAR;
- exibe TAF;
- exibe avisos/SIGMET;
- exibe radar;
- exibe satélite;
- usa Realtime para recarregar dados;
- considera o horário observado do METAR para determinar stale;
- possui botão de atualização manual.

### Problema atual

A aplicação está funcional, porém ainda tem aparência de dashboard técnico simples.

As principais lacunas são:

- ausência de sistema visual consistente para animações;
- radar tratado como imagem isolada;
- ausência de timeline de frames;
- ausência de play/pause;
- ausência de histórico visual;
- navegação ainda simples;
- falta de hierarquia entre radar, situação atual, alertas e dados;
- loading e atualização sem microinterações suficientes;
- falta de uma linguagem visual de plataforma meteorológica operacional.

## 4. Etapa atual

**FASE 1 — Visual Engine + início do Radar Player**

Objetivo:

> Fazer o Atmos parecer e se comportar como uma plataforma meteorológica operacional antes de ampliar o escopo funcional.

### Entregas da fase

- novo shell visual;
- header operacional;
- identidade visual;
- background atmosférico;
- cards e painéis;
- sistema de animações;
- estados loading/error;
- indicador LIVE;
- microinterações;
- RadarViewer;
- timeline inicial;
- transição entre frames.

## 5. Próxima etapa imediata

1. criar/organizar o sistema de documentação;
2. revisar `styles.css` atual;
3. criar tokens visuais;
4. criar `animations.css`;
5. reorganizar o shell da aplicação;
6. criar o Radar Player usando os frames já existentes no Supabase;
7. validar build;
8. publicar na `main`;
9. somente depois avançar para satélite/nowcasting.

## 6. Critérios de conclusão da Fase 1

- [ ] header responsivo;
- [ ] fundo e identidade visual consolidados;
- [ ] entrada de página animada;
- [ ] cards com stagger;
- [ ] LIVE com pulso;
- [ ] atualização visual de dados;
- [ ] loading com skeleton/shimmer;
- [ ] hover/focus states;
- [ ] radar com transição;
- [ ] timeline funcional;
- [ ] play/pause funcional;
- [ ] build sem erro;
- [ ] backend REDEMET preservado.

## 7. Regra de segurança da etapa

Não alterar credenciais, secrets, cron, RLS ou contrato da Edge Function apenas para resolver questões visuais.

Alterações de backend devem ser justificadas por uma necessidade funcional explícita.
