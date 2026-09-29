# Atmos — Regras funcionais

## Atualidade

Um dado meteorológico não deve ser apresentado como atual quando estiver além da janela de validade definida pelo produto.

## METAR

A idade do METAR deve usar `observado_em`, não somente `fetched_at`.

## Radar

Todo frame deve possuir timestamp próprio.

A UI deve distinguir:

- horário do frame;
- horário em que o Atmos buscou o frame.

## LIVE

LIVE significa que o produto está acompanhando o fluxo atual de dados.

Não significa que o frame mostrado seja necessariamente deste segundo.

## Alertas

Alertas devem exibir:

- tipo;
- localidade;
- conteúdo;
- validade quando disponível;
- horário de observação quando disponível.

## Fontes

A origem dos dados deve permanecer identificável.

## Falhas

Quando uma fonte estiver indisponível, o sistema deve comunicar a falha sem apagar silenciosamente o último dado válido.

## Visualização

Não usar animação que prejudique:

- leitura;
- contraste;
- navegação;
- acessibilidade.

## Futuro

Qualquer cálculo de nowcasting ou previsão deve indicar claramente quando é:

- dado observado;
- processamento derivado;
- previsão.
