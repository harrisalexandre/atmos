# Atmos — Estado atual

**Atualizado em:** 29/09/2026  
**Branch canônica:** `main`

## 1. Onde estamos

O pipeline REDEMET está funcional e validado. A interface entrou na **FASE 1 — Visual Engine + início do Radar Player**.

## 2. Backend — consolidado

- Edge Function `redemet-poll` ativa e publicada;
- timeout global de 25s e timeout por tentativa de 8s;
- até 3 tentativas;
- processamento independente dos blocos;
- logging operacional;
- cache de aeródromos;
- persistência de METAR, TAF, SIGMET e AVISO;
- persistência de frames de radar e satélite;
- cron de mensagens a cada 5 minutos;
- cron de imagens a cada 10 minutos;
- leitura pública controlada dos dados necessários ao frontend.

O backend estabilizado não foi alterado nesta etapa visual.

## 3. Frontend — estado atual

O frontend:

- carrega aeródromos;
- calcula VFR/MVFR/IFR/LIFR;
- exibe METAR e TAF;
- exibe AVISO/SIGMET;
- exibe radar e satélite;
- usa Realtime;
- considera `observado_em` para stale;
- possui atualização manual.

### Visual Engine implementado

- background atmosférico com profundidade;
- grid sutil de ambiente;
- tipografia operacional;
- tokens visuais centralizados no CSS;
- entrada animada do shell;
- stagger dos cards;
- hover/focus states;
- indicador LIVE pulsante;
- refresh com animação;
- skeleton/shimmer de loading;
- transição de frames;
- microinterações dos cards e métricas;
- suporte a `prefers-reduced-motion`.

### Radar Player inicial implementado

O painel de radar agora:

- busca até 12 frames MaxCAPPI mais recentes;
- exibe uma sequência temporal;
- possui play/pause;
- possui frame anterior/próximo;
- possui timeline;
- exibe posição atual;
- exibe timestamp;
- faz transição visual entre frames;
- pausa automaticamente ao navegar manualmente.

## 4. Critérios da Fase 1

- [x] header responsivo;
- [x] fundo e identidade visual;
- [x] entrada de página animada;
- [x] cards com stagger;
- [x] LIVE com pulso;
- [x] atualização visual;
- [x] loading com skeleton/shimmer;
- [x] hover/focus states;
- [x] radar com transição;
- [x] timeline funcional;
- [x] play/pause;
- [ ] build validado após esta alteração;
- [x] backend REDEMET preservado.

## 5. Próxima etapa

1. validar build/deploy;
2. refinar Radar Player com velocidades e preload;
3. criar shell de navegação operacional;
4. elevar o radar para elemento principal do dashboard;
5. depois iniciar player temporal de satélite.

## 6. Regra de segurança

Não alterar credenciais, secrets, cron, RLS ou contrato da Edge Function apenas para resolver questões visuais.
