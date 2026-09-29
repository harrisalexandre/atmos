# Atmos — Decisões

## 1. Branch oficial

**Decisão:** todo desenvolvimento ocorre em `main`.

**Motivo:** manter uma única linha oficial de desenvolvimento e publicação.

## 2. Backend REDEMET como fronteira de segurança

**Decisão:** chaves privadas da REDEMET ficam somente na Edge Function.

**Motivo:** o frontend é público e não pode transportar credenciais privadas.

## 3. Supabase como camada intermediária

**Decisão:** o frontend consome dados persistidos no Supabase em vez de consultar diretamente a REDEMET.

**Motivos:**

- segurança;
- cache;
- estabilidade;
- normalização;
- histórico;
- desacoplamento da fonte.

## 4. Radar como player temporal

**Decisão:** o radar deve evoluir de uma imagem isolada para uma sequência temporal.

**Motivo:** uma plataforma meteorológica precisa permitir perceber deslocamento e evolução das células.

## 5. Animações orientadas a dados

**Decisão:** animações devem representar estado, atualização ou interação.

Exemplos:

- LIVE pulsando;
- novo frame entrando;
- card atualizado;
- timeline avançando;
- loading shimmer.

Evitar animações decorativas que dificultem a leitura.

## 6. Preservação do backend estabilizado

**Decisão:** a reconstrução visual não deve alterar o pipeline REDEMET sem necessidade.

**Motivo:** o pipeline atual já possui coleta, persistência, cron, logging e testes funcionais.

## 7. Identidade própria

**Decisão:** usar referências de experiência de plataformas meteorológicas profissionais, sem copiar identidade, textos, assets ou implementação proprietária de terceiros.

## 8. Documentação

Toda a memória técnica e operacional deve permanecer em `/docs`.

`docs/ai/CURRENT_STATE.md` é a fonte principal para saber em que etapa o projeto está.
