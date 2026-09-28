/**
 * Retorna as traducoes de um processo no idioma solicitado.
 *
 * @param {string[]} fields Campos solicitados
 * @param {Constraint[]} constraints Filtros PROCESSID e IDIOMA
 * @param {string[]} sortFields Campos de ordenacao
 * @returns {Dataset}
 */
function createDataset(fields, constraints, sortFields) {
	var dataset = DatasetBuilder.newDataset();
	var dataSourceName = "jdbc/AppDS";
	var processId = null;
	var language = "pt-BR";

	if (constraints != null && constraints.length > 0) {
		for (var i = 0; i < constraints.length; i++) {
			var fieldName = String(constraints[i].fieldName || "").toUpperCase();
			if (fieldName == "PROCESSID") {
				processId = constraints[i].initialValue;
			} else if (fieldName == "IDIOMA") {
				language = constraints[i].initialValue;
			}
		}
	}

	if (processId == null || String(processId).trim() == "") {
		dataset.addColumn("msgErro");
		dataset.addRow(new Array("Constraint PROCESSID nao informada."));
		return dataset;
	}

	var query = "select * from process_definition_translate where PROCESS_ID = ?";
	var conn = null;
	var stmt = null;
	var rs = null;
	var columnsAdded = false;

	try {
		var initialContext = new javax.naming.InitialContext();
		var dataSource = initialContext.lookup(dataSourceName);
		conn = dataSource.getConnection();
		stmt = conn.prepareStatement(query);
		stmt.setString(1, String(processId));
		rs = stmt.executeQuery();

		var metadata = rs.getMetaData();
		var columnCount = metadata.getColumnCount();
		var columnNames = new Array();
		var languageColumn = null;

		for (var c = 1; c <= columnCount; c++) {
			var columnName = metadata.getColumnName(c);
			var upperColumnName = String(columnName).toUpperCase();
			columnNames[c - 1] = columnName;
			dataset.addColumn(columnName);

			if (upperColumnName == "IDIOMA"
				|| upperColumnName == "LANGUAGE"
				|| upperColumnName == "LANGUAGE_ID"
				|| upperColumnName == "LOCALE"
				|| upperColumnName == "LANG") {
				languageColumn = columnName;
			}
		}
		columnsAdded = true;

		while (rs.next()) {
			if (languageColumn != null) {
				var rowLanguageObject = rs.getObject(languageColumn);
				var rowLanguage = rowLanguageObject == null ? "" : String(rowLanguageObject);
				if (normalizeLocale(rowLanguage) != normalizeLocale(language)) continue;
			}

			var rowValues = new Array();
			for (var w = 1; w <= columnCount; w++) {
				var value = rs.getObject(columnNames[w - 1]);
				rowValues[w - 1] = value == null ? "null" : value.toString();
			}
			dataset.addRow(rowValues);
		}
	} catch (e) {
		var errorMessage = "Erro ao consultar traducao do processo: " + e.message;
		log.error("[ds_traducao_dos_processos] " + errorMessage);
		if (!columnsAdded) {
			dataset.addColumn("msgErro");
			dataset.addRow(new Array(errorMessage));
		}
	} finally {
		try { if (rs != null) rs.close(); } catch (e1) {}
		try { if (stmt != null) stmt.close(); } catch (e2) {}
		try { if (conn != null) conn.close(); } catch (e3) {}
	}

	return dataset;
}

function normalizeLocale(value) {
	return String(value || "").replace(/_/g, "-").toLowerCase();
}
