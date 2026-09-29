# Atmos — Segurança

## Segredos

Nunca versionar:

- chave REDEMET;
- service role key do Supabase;
- tokens de CI/CD;
- credenciais do Vault;
- tokens de serviços externos.

## Frontend

Somente valores públicos necessários ao cliente Supabase podem ser disponibilizados no bundle.

Nunca adicionar ao frontend:

- `service_role`;
- chaves administrativas;
- chave privada REDEMET.

## Edge Function

A Edge Function `redemet-poll` é a fronteira para a chave REDEMET.

A chave deve ser lida por variável de ambiente/secret configurado no Supabase.

## Banco

Leitura pública de dados meteorológicos deve ser explicitamente autorizada por RLS/policies.

Qualquer nova tabela deve ser analisada antes de ser exposta ao cliente.

## Logs

Logs não devem registrar:

- API keys;
- tokens;
- service role;
- conteúdo secreto de headers;
- credenciais.

Logs podem registrar:

- etapa;
- duração;
- quantidade de registros;
- status;
- erro sanitizado.

## Imagens

URLs públicas de frames meteorológicos podem ser armazenadas quando forem destinadas à visualização pública.

Não transformar URLs públicas em mecanismo de exposição de secrets.

## Regra de desenvolvimento

Se uma correção visual não exigir backend, não tocar no backend.
