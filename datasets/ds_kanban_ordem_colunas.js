var KANBAN_CONFIG_DATASET = "ds_config_ordem_kanban";
var KANBAN_CONFIG_TABLE = "tb_colunas_kanban";

function createDataset(fields, constraints, sortFields) {
    var result = DatasetBuilder.newDataset();
    addResultColumns(result);

    var profile = getConstraintValue(constraints, "perfil", "DEFAULT");
    var requestedProcessId = getConstraintValue(constraints, "processId", "");

    try {
        var parentConstraints = new Array();
        parentConstraints.push(DatasetFactory.createConstraint(
            "metadata#active", "true", "true", ConstraintType.MUST
        ));
        parentConstraints.push(DatasetFactory.createConstraint(
            "ativo", "true", "true", ConstraintType.MUST
        ));
        parentConstraints.push(DatasetFactory.createConstraint(
            "perfil", profile, profile, ConstraintType.MUST
        ));

        var parentDataset = DatasetFactory.getDataset(
            KANBAN_CONFIG_DATASET,
            null,
            parentConstraints,
            null
        );

        if (parentDataset == null || parentDataset.rowsCount === 0) {
            return result;
        }

        var parentIndex = findLatestParentIndex(parentDataset);
        var documentId = parentDataset.getValue(parentIndex, "metadata#id");
        var documentVersion = parentDataset.getValue(parentIndex, "metadata#version");

        var childConstraints = new Array();
        childConstraints.push(DatasetFactory.createConstraint(
            "tablename", KANBAN_CONFIG_TABLE, KANBAN_CONFIG_TABLE, ConstraintType.MUST
        ));
        childConstraints.push(DatasetFactory.createConstraint(
            "metadata#id", documentId, documentId, ConstraintType.MUST
        ));
        childConstraints.push(DatasetFactory.createConstraint(
            "metadata#version", documentVersion, documentVersion, ConstraintType.MUST
        ));

        var childDataset = DatasetFactory.getDataset(
            KANBAN_CONFIG_DATASET,
            null,
            childConstraints,
            null
        );

        if (childDataset == null || childDataset.rowsCount === 0) {
            return result;
        }

        for (var i = 0; i < childDataset.rowsCount; i++) {
            var active = childDataset.getValue(i, "ativo_coluna");
            var processId = trimValue(childDataset.getValue(i, "process_id"));
            var activityName = trimValue(childDataset.getValue(i, "nome_atividade"));
            var order = parseInt(childDataset.getValue(i, "ordem_coluna"), 10);

            if (!isTruthy(active) || activityName === "" || isNaN(order) || order < 0) {
                continue;
            }

            if (requestedProcessId !== ""
                && processId !== ""
                && processId !== "*"
                && processId !== requestedProcessId) {
                continue;
            }

            result.addRow(new Array(
                profile,
                processId,
                trimValue(childDataset.getValue(i, "chave_etapa")),
                activityName,
                trimValue(childDataset.getValue(i, "aliases_atividade")),
                String(order),
                "true",
                ""
            ));
        }
    } catch (e) {
        var message = e != null && e.message != null ? String(e.message) : String(e);
        log.error("[ds_kanban_ordem_colunas] Erro ao carregar configuracao: " + message);
        result.addRow(new Array("", "", "", "", "", "", "false", message));
    }

    return result;
}

function addResultColumns(dataset) {
    dataset.addColumn("perfil");
    dataset.addColumn("processId");
    dataset.addColumn("chaveEtapa");
    dataset.addColumn("nomeAtividade");
    dataset.addColumn("aliases");
    dataset.addColumn("ordem");
    dataset.addColumn("ativo");
    dataset.addColumn("msgErro");
}

function getConstraintValue(constraints, fieldName, defaultValue) {
    if (constraints != null && constraints.length > 0) {
        for (var i = 0; i < constraints.length; i++) {
            if (constraints[i] != null
                && String(constraints[i].fieldName).toLowerCase() === fieldName.toLowerCase()) {
                return trimValue(constraints[i].initialValue);
            }
        }
    }
    return defaultValue;
}

function findLatestParentIndex(dataset) {
    var latestIndex = 0;
    var latestDocumentId = parseInt(dataset.getValue(0, "metadata#id"), 10) || 0;

    for (var i = 1; i < dataset.rowsCount; i++) {
        var documentId = parseInt(dataset.getValue(i, "metadata#id"), 10) || 0;
        if (documentId > latestDocumentId) {
            latestDocumentId = documentId;
            latestIndex = i;
        }
    }

    return latestIndex;
}

function trimValue(value) {
    return value == null ? "" : String(value).replace(/^\s+|\s+$/g, "");
}

function isTruthy(value) {
    var normalized = trimValue(value).toLowerCase();
    return value === true || value === 1
        || normalized === "true"
        || normalized === "1"
        || normalized === "sim"
        || normalized === "yes";
}
