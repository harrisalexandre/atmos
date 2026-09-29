# Atmos

## Monitoramento meteorológico de Santiago/RS

O **Atmos** é um sistema de acompanhamento das condições meteorológicas da região de Santiago/RS.

A ideia é simples: reunir em um único lugar informações importantes sobre o tempo e as condições dos aeródromos, mostrando os dados de forma clara e atualizada.

### O que o Atmos mostra?

- Condições meteorológicas dos aeródromos acompanhados;
- Vento, visibilidade, temperatura e pressão;
- Condição de voo, quando disponível;
- Previsões meteorológicas;
- Avisos e alertas meteorológicos;
- Informações de radar;
- Imagens de satélite;
- Horário da última atualização dos dados.

### De onde vêm os dados?

Os dados meteorológicos são obtidos da **REDEMET, do DECEA**, e processados pelo sistema antes de serem apresentados na tela.

O Atmos possui uma camada intermediária responsável por buscar, organizar e armazenar essas informações. Dessa forma, dados de acesso restrito não ficam expostos para quem acessa o site.

### Como funciona?

De forma simplificada:

**REDEMET → Atmos → Banco de dados → Site**

O sistema busca os dados periodicamente, guarda as informações necessárias e atualiza o site automaticamente.

Quando uma nova informação chega ao banco de dados, o site pode receber essa atualização sem precisar ficar fazendo consultas repetidas.

### Atualização dos dados

As informações meteorológicas são atualizadas automaticamente em intervalos definidos pelo sistema.

Se uma informação estiver muito antiga, o Atmos pode identificá-la como desatualizada para evitar que o usuário interprete um dado antigo como atual.

### Segurança

Informações de acesso e chaves utilizadas para consultar os serviços externos **não fazem parte do site, do código público ou da documentação**.

As configurações sensíveis ficam armazenadas nos serviços responsáveis pelo funcionamento do sistema.

A documentação explica **o que precisa ser configurado e como o sistema funciona**, mas nunca publica valores secretos.

### Publicação

O projeto utiliza o GitHub para armazenar o código e realizar automaticamente a publicação do site.

Alterações aprovadas na versão principal do projeto podem iniciar o processo de validação, construção e publicação.

### Para quem quiser trabalhar no projeto

A documentação técnica está disponível na pasta:

`docs/`

Ela contém orientações para configuração, manutenção e funcionamento do sistema sem expor informações sensíveis.

### Desenvolvimento

Para trabalhar localmente, é necessário ter **Node.js** instalado.

Depois:

```bash
npm install
npm run dev
```

Para validar o projeto:

```bash
npm run lint
npm run build
```

Consulte a documentação em `docs/` antes de alterar a infraestrutura ou as integrações externas.
