# Documentação do Atmos

Esta pasta reúne as orientações necessárias para entender, configurar e manter o Atmos.

A documentação deve explicar **o que fazer**, e não publicar informações que permitam acessar serviços ou contas.

## Princípios

- Nunca colocar chaves, tokens, senhas ou credenciais nos arquivos do projeto.
- Nunca publicar valores de secrets em documentação, código ou exemplos reais.
- Quando uma configuração depender de um valor privado, documentar apenas o **nome da configuração**, sua finalidade e onde ela deve ser cadastrada.
- Usar exemplos fictícios quando for necessário demonstrar um formato.
- Dados meteorológicos devem ser tratados como informações provenientes da fonte oficial utilizada pelo projeto.

## Documentos

### Configuração

Use esta seção para registrar os passos necessários para preparar um ambiente.

Ao documentar uma configuração sensível, informe:

1. Nome da configuração.
2. Para que ela serve.
3. Em qual serviço ela deve ser cadastrada.
4. Quem precisa ter acesso.
5. Como validar se está funcionando.

Não informe o valor real da configuração.

### Operação

Use esta seção para explicar como verificar:

- atualização dos dados;
- funcionamento das integrações;
- mensagens de erro;
- atualização do site;
- execução das rotinas automáticas.

### Manutenção

Alterações na integração com serviços externos devem ser testadas antes da publicação.

Sempre que uma mudança afetar dados, segurança ou automações, registrar o que foi alterado e como validar o resultado.

## Regra principal

> A documentação deve permitir que outra pessoa saiba **como configurar e operar o Atmos sem precisar receber nenhuma chave ou segredo pelo repositório**.
