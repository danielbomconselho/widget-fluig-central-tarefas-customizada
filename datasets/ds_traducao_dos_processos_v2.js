function createDataset(fields, constraints, sortFields) {

    var newDataset = DatasetBuilder.newDataset();

    var myQuery = '';
    var dataSource = '';
    dataSource = "/jdbc/AppDS";
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);

    log.info("base 64 antes coversao " + myQuery)
    var myQuery =
        "SELECT" +
        "    ep.COD_EMPRESA                         AS CODIGO_EMPRESA," +
        "    ep.COD_DEF_PROCES                      AS CODIGO_PROCESSO," +
        "    ep.NUM_VERS                            AS VERSAO_PROCESSO," +
        "    dp.DES_DEF_PROCES                      AS NOME_PROCESSO_ORIGINAL," +
        "    MAX(" +
        "        CASE" +
        "            WHEN UPPER(REPLACE(pdt.`LANGUAGE`, '_', '-')) = 'PT-BR'" +
        "            THEN pdt.DESCRIPTION" +
        "        END" +
        "    ) AS NOME_PROCESSO_PT_BR," +
        "    MAX(" +
        "        CASE" +
        "            WHEN UPPER(REPLACE(pdt.`LANGUAGE`, '_', '-')) IN ('EN', 'EN-US')" +
        "            THEN pdt.DESCRIPTION" +
        "        END" +
        "    ) AS NOME_PROCESSO_EN_US," +
        "    MAX(" +
        "        CASE" +
        "            WHEN UPPER(REPLACE(pdt.`LANGUAGE`, '_', '-')) LIKE 'ES%'" +
        "            THEN pdt.DESCRIPTION" +
        "        END" +
        "    ) AS NOME_PROCESSO_ES," +
        "    ep.NUM_SEQ                             AS CODIGO_ATIVIDADE," +
        "    ep.IDI_TIP_BPMN                        AS TIPO_BPMN," +
        "    ep.IDI_TIP_ESTADO                      AS TIPO_ESTADO," +
        "    COALESCE(ep.NOM_ESTADO, ep.DES_ESTADO) AS NOME_ATIVIDADE_ORIGINAL," +
        "    MAX(" +
        "        CASE" +
        "            WHEN UPPER(REPLACE(pet.`LANGUAGE`, '_', '-')) = 'PT-BR'" +
        "            THEN pet.`NAME`" +
        "        END" +
        "    ) AS NOME_ATIVIDADE_PT_BR," +
        "    MAX(" +
        "        CASE" +
        "            WHEN UPPER(REPLACE(pet.`LANGUAGE`, '_', '-')) IN ('EN', 'EN-US') " +
        "            THEN pet.`NAME` " +
        "        END " +
        "    ) AS NOME_ATIVIDADE_EN_US, " +
        "    MAX( " +
        "        CASE " +
        "            WHEN UPPER(REPLACE(pet.`LANGUAGE`, '_', '-')) LIKE 'ES%' " +
        "            THEN pet.`NAME` " +
        "        END " +
        "    ) AS NOME_ATIVIDADE_ES " +
        "FROM estado_proces ep " +
        "INNER JOIN ( " +
        "    SELECT " +
        "        COD_EMPRESA, " +
        "        COD_DEF_PROCES, " +
        "        MAX(NUM_VERS) AS NUM_VERS " +
        "    FROM estado_proces " +
        "    GROUP BY " +
        "        COD_EMPRESA," +
        "        COD_DEF_PROCES " +
        ") ultima_versao " +
        "    ON ultima_versao.COD_EMPRESA    = ep.COD_EMPRESA " +
        "   AND ultima_versao.COD_DEF_PROCES = ep.COD_DEF_PROCES " +
        "   AND ultima_versao.NUM_VERS       = ep.NUM_VERS " +
        "LEFT JOIN def_proces dp " +
        "    ON dp.COD_EMPRESA    = ep.COD_EMPRESA " +
        "   AND dp.COD_DEF_PROCES = ep.COD_DEF_PROCES " +
        "LEFT JOIN process_element_translate pet " +
        "    ON pet.TENANT_ID    = ep.COD_EMPRESA " +
        "   AND pet.PROCESS_ID   = ep.COD_DEF_PROCES " +
        "   AND pet.`VERSION`    = ep.NUM_VERS " +
        "   AND pet.`SEQUENCE`   = ep.NUM_SEQ " +
        "LEFT JOIN process_definition_translate pdt " +
        "    ON pdt.TENANT_ID  = ep.COD_EMPRESA " +
        "   AND pdt.PROCESS_ID = ep.COD_DEF_PROCES " +
        "WHERE COALESCE( " +
        "          NULLIF(TRIM(ep.NOM_ESTADO), ''), " +
        "          NULLIF(TRIM(ep.DES_ESTADO), '') " +
        "      ) IS NOT NULL " +
        "GROUP BY" +
        "    ep.COD_EMPRESA, " +
        "    ep.COD_DEF_PROCES, " +
        "    ep.NUM_VERS, " +
        "    dp.DES_DEF_PROCES, " +
        "    ep.NUM_SEQ, " +
        "    ep.IDI_TIP_BPMN, " +
        "    ep.IDI_TIP_ESTADO, " +
        "    ep.NOM_ESTADO, " +
        "    ep.DES_ESTADO " +
        "ORDER BY" +
        "    ep.COD_EMPRESA, " +
        "    ep.COD_DEF_PROCES, " +
        "    ep.NUM_SEQ; "

    try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        var rs = stmt.executeQuery(myQuery);
        var columnCount = rs.getMetaData().getColumnCount();

        //CRIA O CABEÇALHO
        for (var i = 1; i <= columnCount; i++) {
            newDataset.addColumn(rs.getMetaData().getColumnLabel(i));
        }
        //LOOPING DOS REGISTROS
        while (rs.next()) {

            var Arr = new Array();
            for (var w = 1; w <= columnCount; w++) {
                var obj = rs.getObject(rs.getMetaData().getColumnLabel(w));

                if (null != obj) {
                    Arr[w - 1] = rs.getObject(rs.getMetaData().getColumnLabel(w)).toString();
                } else {
                    Arr[w - 1] = "null";
                }
            }

            newDataset.addRow(Arr);

        }

    } catch (e) {
        log.error("ERRO==============> " + e.message);
        newDataset.addColumn("erro");
        newDataset.addRow([e.message]);
    } finally {
        if (rs != null) {
            rs.close();
        }
        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }

    return newDataset;
}