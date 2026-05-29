function createDataset(fields, constraints, sortFields) {
	
	//log.info('## ds_usuario_integrador ##');
	
	//Cria dataset de retorno
	var dsRetorno = DatasetBuilder.newDataset();
	
	try{
		//Adiciona colunas
		dsRetorno.addColumn("user");
		dsRetorno.addColumn("password");
				
		//Preenche dataset com os registros
		dsRetorno.addRow(['daniel_sales	', '']);

		
		return dsRetorno;	
		
	} catch (exception){
		dsRetorno.addColumn('erro');
		dsRetorno.addRow([exception.message + ' (' + exception.lineNumber + ')']);
		return dsRetorno;
	}
}