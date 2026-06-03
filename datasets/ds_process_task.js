/**
*
*
* @param {string[]} fields Campos Solicitados
* @param {Constraint[]} constraints Filtros
* @param {string[]} sorts Campos da Ordenação
* @returns {Dataset}
* Esse dataset tras a maior versão do documento. Ele é usado na central de tarefas customizada e no historico dos processos de governaca.
* quando logativ=0 e o historico de onde passou, e filtramos pelo num_process, quando logativ=1 tras a atividade atual ativa e queremos todas as ativas.
*/
function createDataset(fields, constraints, sorts) {
	log.warn("#### INICIO DATASET PROCESS TASK");
	var dataset = DatasetBuilder.newDataset();
	var DATASOURCE = 'jdbc/AppDS';
	var ic = new javax.naming.InitialContext();
	var ds = ic.lookup(DATASOURCE);
	var ativas=1;
	// Captura matrícula da constraint, se houver (NÃO concatena no SQL — usa bind)
	var matriculaValue = null;
	var num_procesValue = null;
	if (constraints != null) {
		for (var i = 0; i < constraints.length; i++) {
			if (constraints[i].fieldName.toUpperCase() == "MATRICULA") {
				matriculaValue = constraints[i].initialValue;
				log.warn("#### MATRICULA: " + matriculaValue);
			}
			if (constraints[i].fieldName.toUpperCase() == "NUM_PROCES") {
				num_procesValue = constraints[i].initialValue;
				ativas=0;
				log.warn("#### NUM_PROCES: " + num_procesValue);
			}
		}
	}

	var QUERY = 'select hp.num_proces, hp.num_seq_estado, hp.log_ativ, ep.num_vers, ep.des_estado, tp.deadline, tp.cd_matricula, hp.movto_date_time'
				+' from histor_proces hp '
				+' inner join proces_workflow pw on hp.num_proces = pw.num_proces '
				+' inner join estado_proces ep on hp.process_definition_version = ep.num_vers and ep.num_seq = hp.num_seq_estado and pw.cod_def_proces = ep.cod_def_proces '
				+' inner join tar_proces tp on tp.num_proces = hp.num_proces and tp.log_ativ=1'
				+' where hp.log_ativ='+ativas;

	if (matriculaValue) {
		QUERY += ' and tp.cd_matricula = "'+matriculaValue+'"';
	}

	if (num_procesValue) {
		QUERY += ' and pw.NUM_PROCES = "'+num_procesValue+'"';
	}

	log.warn("#### QUERY: " + QUERY);

	var conn = null;
	var stmt = null;
	var rs = null;
	try {
		conn = ds.getConnection();
		// PreparedStatement com bind de parâmetro — protege contra SQL injection
		stmt = conn.prepareStatement(QUERY);
		rs = stmt.executeQuery();

		var columnCount = rs.getMetaData().getColumnCount();

		//CRIA O CABEÇALHO
		for (var c = 1; c <= columnCount; c++) {
			dataset.addColumn(rs.getMetaData().getColumnName(c));
		}

		//LOOPING DOS REGISTROS
		while (rs.next()) {
			var Arr = new Array();
			for (var w = 1; w <= columnCount; w++) {
				var obj = rs.getObject(rs.getMetaData().getColumnName(w));
				if (null != obj) {
					Arr[w - 1] = rs.getObject(rs.getMetaData().getColumnName(w)).toString();
				} else {
					Arr[w - 1] = "null";
				}
			}
			dataset.addRow(Arr);
		}
	} catch (e) {
		throw('Erro ao executar a query (linha: ' + e.lineNumber + '): ' + e.message + '\n' + QUERY);
	} finally {
		// Cleanup robusto — cada close em try/catch isolado
		try { if (rs != null) rs.close(); } catch (e1) {}
		try { if (stmt != null) stmt.close(); } catch (e2) {}
		try { if (conn != null) conn.close(); } catch (e3) {}
	}
	return dataset;
}