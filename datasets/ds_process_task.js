/**
 *
*
* @param {string[]} fields Campos Solicitados
* @param {Constraint[]} constraints Filtros
* @param {string[]} sorts Campos da Ordenação
* @returns {Dataset}
* Esse dataset tras a maior versão do documento.
*/
function createDataset(fields, constraints, sorts) {
	log.warn("#### INICIO DATASET PROCESS TASK");
	var dataset = DatasetBuilder.newDataset();
	var DATASOURCE = 'jdbc/AppDS';
	var ic = new javax.naming.InitialContext();
	var ds = ic.lookup(DATASOURCE);

	// Captura matrícula da constraint, se houver (NÃO concatena no SQL — usa bind)
	var matriculaValue = null;
	if (constraints != null) {
		for (var i = 0; i < constraints.length; i++) {
			if (constraints[i].fieldName.toUpperCase() == "MATRICULA") {
				matriculaValue = constraints[i].initialValue;
				log.warn("#### MATRICULA: " + matriculaValue);
			}
		}
	}

	var QUERY = 'select hp.num_proces, hp.num_seq_estado, hp.log_ativ, ep.num_vers, ep.des_estado, tp.deadline, tp.cd_matricula'
				+' from histor_proces hp '
				+' inner join proces_workflow pw on hp.num_proces = pw.num_proces '
				+' inner join estado_proces ep on hp.process_definition_version = ep.num_vers and ep.num_seq = hp.num_seq_estado and pw.cod_def_proces = ep.cod_def_proces '
				+' inner join tar_proces tp on tp.num_proces = hp.num_proces and tp.log_ativ=1 '
				+' where hp.log_ativ=1';

	if (matriculaValue) {
		QUERY += ' and tp.cd_matricula = ?';
	}

	log.warn("#### QUERY: " + QUERY);

	var conn = null;
	var stmt = null;
	var rs = null;
	try {
		conn = ds.getConnection();
		// PreparedStatement com bind de parâmetro — protege contra SQL injection
		stmt = conn.prepareStatement(QUERY);
		if (matriculaValue) {
			stmt.setString(1, matriculaValue);
		}
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