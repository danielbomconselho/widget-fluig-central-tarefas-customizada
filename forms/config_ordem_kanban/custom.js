function adicionarColuna() {
    var indice = wdkAddChild('tb_colunas_kanban');
    $('#ativo_coluna___' + indice).val('true');
    return indice;
}

function removerColuna(elemento) {
    fnWdkRemoveChild(elemento);
}
