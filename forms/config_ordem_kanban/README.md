# Publicação do formulário

Publique este formulário manualmente no Fluig como formulário independente e informe exatamente:

- Nome do dataset: `ds_config_ordem_kanban`
- Modelo de armazenamento: tabelas múltiplas
- Permissão de leitura: usuários que acessam a Central de tarefas

Depois da publicação, crie um registro ativo com o perfil `DEFAULT` e preencha a tabela de colunas. O dataset composto `ds_kanban_ordem_colunas` seleciona o registro ativo mais recente desse perfil.

Exemplo de preenchimento:

| Ordem | Chave | Nome | Nomes alternativos | Processo |
|---:|---|---|---|---|
| 10 | PROPOR | Propor | Propose\|Proponer | vazio |
| 20 | VALIDAR | Validar | Validate | vazio |
| 15 | VALIDAR_ESPECIAL | Validar | Validate | ID de um processo específico |

A linha específica do processo tem precedência sobre a linha global. Colunas não cadastradas continuam visíveis depois das colunas configuradas.

Ordem sugerida de publicação:

1. Formulário `config_ordem_kanban`.
2. Dataset `ds_kanban_ordem_colunas`.
3. Widget `Central_de_tarefas`.
