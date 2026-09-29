# Atmos — Diário de trabalho

## 29/09/2026 — Início da evolução para plataforma operacional

### Contexto

O pipeline REDEMET foi estabilizado e validado.

O frontend voltou a carregar corretamente radar, satélite, mensagens e estações, porém a experiência visual ainda estava distante do objetivo de uma plataforma meteorológica operacional.

### Direção definida

A nova experiência será construída em etapas, com referência funcional em plataformas modernas de meteorologia:

1. sistema visual;
2. animações;
3. Radar Player;
4. dashboard;
5. dados;
6. satélite;
7. nowcasting;
8. WRF.

### Documentação

Criada a árvore:

- `docs/FEATURES.md`;
- `docs/DAILY_WORK.md`;
- `docs/ai/CONTEXT.md`;
- `docs/ai/CURRENT_STATE.md`;
- `docs/ai/ROADMAP.md`;
- `docs/ai/ARCHITECTURE.md`;
- `docs/ai/DECISIONS.md`;
- `docs/ai/SECURITY.md`.

### Próximo trabalho

- revisar estilos atuais;
- criar tokens;
- criar sistema de animações;
- reconstruir o shell;
- iniciar Radar Player;
- validar sem quebrar o pipeline REDEMET.
