# Atmos — Roadmap do produto

## Visão

Evoluir o Atmos de um painel de monitoramento para uma plataforma de inteligência meteorológica.

## Fase 1 — Visual Engine

**Status: EM ANDAMENTO**

- [ ] shell operacional;
- [ ] header;
- [ ] navegação;
- [ ] design tokens;
- [ ] background atmosférico;
- [ ] animações;
- [ ] loading states;
- [ ] microinterações;
- [ ] responsividade;
- [ ] estados de erro/vazio.

## Fase 2 — Radar Player

**Status: PRÓXIMA**

- [ ] histórico de frames;
- [ ] timeline;
- [ ] play/pause;
- [ ] anterior/próximo;
- [ ] velocidades 1x/2x/4x;
- [ ] timestamp;
- [ ] indicador LIVE;
- [ ] preload;
- [ ] cache de frames;
- [ ] transição suave;
- [ ] legenda;
- [ ] marcador da localização.

## Fase 3 — Dashboard meteorológico

**Status: PLANEJADA**

- [ ] radar como elemento principal;
- [ ] tempo atual;
- [ ] estações próximas;
- [ ] alertas;
- [ ] monitoramento;
- [ ] resumo de previsão;
- [ ] indicadores de atualização.

## Fase 4 — Dados

**Status: PLANEJADA**

- [ ] METAR;
- [ ] TAF;
- [ ] SIGMET;
- [ ] AVISOS;
- [ ] estações;
- [ ] filtros;
- [ ] busca;
- [ ] histórico.

## Fase 5 — Satélite

**Status: PLANEJADA**

- [ ] player temporal;
- [ ] loop;
- [ ] produtos;
- [ ] timestamp;
- [ ] velocidade;
- [ ] histórico.

## Fase 6 — Nowcasting

**Status: PLANEJADA**

- [ ] identificação de células;
- [ ] intensidade;
- [ ] direção;
- [ ] velocidade;
- [ ] trajetória;
- [ ] ETA;
- [ ] municípios impactados;
- [ ] histórico de movimento.

## Fase 7 — WRF

**Status: PLANEJADA**

Somente após existir fonte/modelo confiável.

- [ ] ingestão;
- [ ] processamento;
- [ ] mapas;
- [ ] timeline;
- [ ] temperatura;
- [ ] chuva;
- [ ] vento;
- [ ] CAPE;
- [ ] CIN;
- [ ] shear;
- [ ] outros parâmetros convectivos.

## Princípio

Nenhum módulo será considerado pronto apenas por possuir uma tela.

Um recurso meteorológico deve ter:

1. fonte;
2. ingestão;
3. persistência/cache quando necessário;
4. visualização;
5. atualização;
6. estado de erro;
7. timestamp;
8. comportamento verificável.
