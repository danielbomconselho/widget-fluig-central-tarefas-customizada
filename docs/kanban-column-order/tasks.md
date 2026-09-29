# Tarefas — ordem configurável do Kanban

## T01 — Formulário administrativo

Status: completed
Depends on: none
Scope: `forms/config_ordem_kanban/*`
What: formulário independente com cabeçalho e tabela pai-filho de colunas.
Why: permitir manutenção da ordem sem editar código.
Tests: HTML balanceado, IDs únicos, campos com até 30 caracteres, Style Guide e tabela pai-filho válidos.
Gate: formulário passa no checklist manual de formulário Fluig.
Rollback: remover a pasta do formulário antes da publicação.

## T02 — Dataset composto

Status: completed
Depends on: T01
Scope: `datasets/ds_kanban_ordem_colunas.js`
What: ler a versão ativa de `ds_config_ordem_kanban` e expor linhas ativas da tabela filha.
Why: isolar detalhes de armazenamento e entregar contrato simples para a widget.
Tests: ES5/Rhino, constraints nulas, configuração vazia, filtro de perfil, retorno de erro e contagem de colunas por linha.
Gate: dataset passa no checklist manual e nos testes locais com stubs.
Rollback: remover o dataset; a widget mantém fallback natural.

## T03 — Integração da widget

Status: completed
Depends on: T02
Scope: JS da Central de tarefas e `application.info`.
What: carregar configuração uma vez, indexar aliases e ordenar atividades com precedência específica/global.
Why: aplicar uma única configuração aos processos sem alterar os nomes nativos do Fluig.
Tests: ordem global, override por processo, alias, desconhecidos, inicial/final e dataset indisponível.
Gate: testes JavaScript passam e não há regressão na consulta de `processState`.
Rollback: remover os helpers e a chamada de ordenação.

## T04 — Pacote e evidência

Status: completed
Depends on: T01, T02, T03
Scope: `target/Central de tarefas.war` e documentação.
What: reconstruir o WAR e registrar validações.
Why: entregar artefato coerente com a fonte.
Tests: `node --check`, `git diff --check`, paridade i18n e hash do JS fonte/WAR.
Gate: WAR contém a nova versão e o mesmo JavaScript validado.
Rollback: restaurar o WAR anterior antes do deploy.

## Evidências locais

- Sintaxe validada para o dataset, `custom.js` do formulário e JavaScript da widget.
- Formulário validado quanto a imports, wrapper Style Guide, IDs, tamanho dos campos, grid e balanceamento estrutural.
- Dataset testado com configuração global, específica, linha inativa, seleção do registro mais recente e exceção da origem.
- Widget testada com ordem global, override por processo, aliases, colunas desconhecidas e fallback sem dataset.
- WAR `0.8.0` validado por versão, presença dos helpers e hash SHA-256 do JavaScript igual ao fonte.
