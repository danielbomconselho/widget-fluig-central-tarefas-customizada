# 📌 Estrutura do Projeto

## Arquivo principal (HTML)

O arquivo principal do projeto é:

- `view.ftl`

Ele é o ponto de entrada da aplicação e contém as principais estruturas HTML (layout base, div root, etc.).

## Arquivo de estilo (CSS)

O arquivo de estilos é:

- `\src\main\webapp\resources\css\Central_de_tarefas.css`

## Arquivo de comportamento (JavaScript)

O arquivo de comportamento é:

- `\src\main\webapp\resources\js\Central_de_tarefas.js`

## Estrutura basica do js

O código é estruturado como uma classe JavaScript chamada `Central_de_tarefas` que herda de `SuperWidget`.

### Construtor

O construtor é responsável por inicializar as propriedades da classe:

- `variavelNumerica`: número (inicializado com `null`)
- `variavelCaracter`: caractere (inicializado com `null`)

### Método `init()`

O método `init()` é chamado quando a widget é carregada e é responsável por inicializar a widget. No momento, ele está vazio.

### Bindings

Os bindings são responsáveis por vincular eventos a métodos da classe. No momento, o único binding é o evento `execute` que é vinculado ao método `executeAction`.
