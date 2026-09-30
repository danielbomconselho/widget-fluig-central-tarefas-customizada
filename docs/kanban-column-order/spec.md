# Ordem configurável das colunas do Kanban

## Contexto e problema

A Central de tarefas atende cerca de 60 processos que reutilizam os mesmos nomes de atividades. Hoje a ordem das colunas é herdada de `processStatePK.sequence`, que pertence a cada processo e versão e não representa uma ordem visual compartilhada.

## Objetivo

Permitir que administradores definam uma ordem visual central para as colunas do Kanban sem alterar os diagramas BPM e sem manter nomes de atividades fixos no JavaScript da widget.

## Escopo

- Criar um formulário independente `config_ordem_kanban` com perfil e tabela pai-filho de colunas.
- Publicar esse formulário, por ação humana, com o nome de dataset interno `ds_config_ordem_kanban`.
- Criar o dataset composto `ds_kanban_ordem_colunas` para expor somente a configuração ativa.
- Consultar o dataset uma vez por instância da widget.
- Aplicar a ordem depois da consolidação das atividades retornadas por `processState`.
- Manter `Rascunho` na primeira posição e `Finalizadas` na última.
- Preservar a ordem natural para colunas não configuradas.

Fora do escopo:

- Alterar os 60 diagramas BPM.
- Publicar formulário, dataset ou widget no servidor.
- Consultar diretamente os arquivos de literais dos processos; quando um alias corresponde ao `processState.stateName`, o nome principal da configuração passa a ser o rótulo canônico exibido.

## Modelo de configuração

Cabeçalho:

- `perfil`: identifica uma configuração; valor inicial `DEFAULT`.
- `descricao`: descrição administrativa.
- `ativo`: define se o registro de configuração pode ser consumido.

Tabela `tb_colunas_kanban`:

- `ordem_coluna`: posição numérica.
- `chave_etapa`: identificador administrativo estável.
- `nome_atividade`: nome principal da atividade.
- `aliases_atividade`: nomes alternativos separados por `|` para outros idiomas.
- `process_id`: vazio para regra global; preenchido para exceção de um processo.
- `ativo_coluna`: habilita a linha.

## Regras de precedência

1. Regra específica para `process_id`.
2. Regra global, com `process_id` vazio ou `*`.
3. Ordem natural do `processState` para atividade sem configuração.
4. Empate mantém a ordem natural.
5. Atividade inicial e final continuam sendo posicionadas pela regra funcional existente.

## Tratamento de erro

- Dataset de configuração ausente ou indisponível: a widget continua operando com a ordem natural.
- Configuração vazia: retorno legítimo; a widget mantém a ordem natural.
- Linha inválida ou sem ordem/nome: ignorada sem remover a coluna do Kanban.
- Exceção no dataset composto: retorna uma linha com `msgErro` e registra `log.error`.

## Critérios de aceite

- Uma configuração global ordena atividades de processos diferentes pelo mesmo nome.
- Uma configuração específica de processo sobrepõe a global.
- Aliases permitem associar traduções diferentes à mesma posição.
- Colunas desconhecidas continuam visíveis e aparecem depois das configuradas.
- `Rascunho` permanece primeiro e `Finalizadas` permanece por último.
- Ausência ou erro do dataset não impede o carregamento da Central de tarefas.
- Scripts server-side permanecem compatíveis com ES5/Rhino.

## Impacto e rollback

- Formulário: novos arquivos em `forms/config_ordem_kanban`.
- Dataset: novo `datasets/ds_kanban_ordem_colunas.js`.
- Widget: JavaScript e versão do `application.info`; novo WAR gerado localmente.
- Workflow, eventos e instâncias ativas: sem alteração.

Rollback: remover a chamada de carregamento/ordenação da widget ou deixar o dataset sem registros ativos; em ambos os casos, a ordem natural volta a ser utilizada.

## Assunções e incertezas

- O formulário será publicado manualmente com dataset `ds_config_ordem_kanban` e permissão de leitura compatível com os usuários da Central.
- Os nomes compartilhados pelos processos são suficientemente padronizados; aliases cobrem idiomas ou grafias alternativas.
- A existência e a publicação real dos datasets não podem ser testadas localmente sem um servidor Fluig conectado.
