/**
 * Expande usuarios herdados de grupos e papeis aninhados em grupos Fluig.
 * O dataset e somente leitura; a inclusao e feita pela API publica de grupos.
 */
function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    addColumns(dataset);
    var input = readInput(constraints);
    var tenantId = String(getValue("WKCompany") || "");
    var conn = null;

    if (!/^\d+$/.test(tenantId)) {
        addResult(dataset, "ERROR", input.action, "", "", "", "", "", "", "", "", "0", "0", "0", "0", "0", "Tenant do Fluig nao identificado.", "", "");
        return dataset;
    }

    try {
        var context = new javax.naming.InitialContext();
        conn = context.lookup("jdbc/AppDS").getConnection();
        if (input.action == "LIST_GROUPS") {
            listGroups(dataset, conn, tenantId);
        } else if (input.action == "RESOLVE" && input.rootGroups.length > 0) {
            resolveGroups(dataset, conn, tenantId, input.rootGroups);
        } else {
            addResult(dataset, "ERROR", input.action, "", "", "", "", "", "", "", "", "0", "0", "0", "0", "0", "Acao invalida ou nenhum grupo informado.", "", "");
        }
    } catch (e) {
        log.error("[ds_corrigir_grupos] " + e.message, e);
        addResult(dataset, "ERROR", input.action, "", "", "", "", "", "", "", "", "0", "0", "0", "0", "0", "Erro ao consultar grupos: " + e.message, "", "");
    } finally {
        closeQuietly(conn);
    }
    return dataset;
}

function addColumns(dataset) {
    var columns = new Array("STATUS", "ACTION", "ROOT_GROUP_CODE", "ROOT_GROUP_DESCRIPTION", "LOGIN", "USER_CODE", "FULL_NAME", "USER_STATE", "SOURCE_TYPES", "SOURCE_CODES", "ALREADY_DIRECT", "GROUPS_VISITED", "ROLES_VISITED", "CYCLE_DETECTED", "CANDIDATE_COUNT", "MESSAGE", "GROUP_TYPE", "INTERNAL");
    for (var i = 0; i < columns.length; i++) {
        dataset.addColumn(columns[i]);
    }
}

function addResult(dataset, status, action, rootCode, rootDescription, login, userCode, fullName, userState, sourceTypes, sourceCodes, alreadyDirect, groupsVisited, rolesVisited, cycleDetected, candidateCount, message, groupType, internal) {
    var values = new Array(status, action, rootCode, rootDescription, login, userCode, fullName, userState, sourceTypes, sourceCodes, alreadyDirect, groupsVisited, rolesVisited, cycleDetected, candidateCount, message, groupType, internal);
    for (var i = 0; i < values.length; i++) {
        values[i] = stringValue(values[i]);
    }
    dataset.addRow(values);
}

function readInput(constraints) {
    var input = { action: "LIST_GROUPS", rootGroups: new Array() };
    var seen = {};
    if (constraints == null) {
        return input;
    }
    for (var i = 0; i < constraints.length; i++) {
        var name = String(constraints[i].fieldName || "").toUpperCase();
        var value = String(constraints[i].initialValue || "").replace(/^\s+|\s+$/g, "");
        if (name == "ACTION" && value !== "") {
            input.action = value.toUpperCase();
        } else if (name == "ROOT_GROUP_CODE" && value !== "" && value.length <= 50 && !seen[value]) {
            seen[value] = true;
            input.rootGroups.push(value);
        }
    }
    return input;
}

function listGroups(dataset, conn, tenantId) {
    var stmt = null;
    var rs = null;
    try {
        stmt = conn.prepareStatement("SELECT GROUP_CODE, DESCRIPTION, GROUP_TYPE, INTERNAL FROM fdn_group WHERE TENANT_ID = ? AND GROUP_CODE IS NOT NULL ORDER BY DESCRIPTION, GROUP_CODE");
        stmt.setLong(1, java.lang.Long.valueOf(tenantId));
        rs = stmt.executeQuery();
        while (rs.next()) {
            addResult(dataset, "OK", "LIST_GROUPS", rsString(rs, "GROUP_CODE"), rsString(rs, "DESCRIPTION"), "", "", "", "", "", "", "0", "0", "0", "0", "0", "", rsString(rs, "GROUP_TYPE"), rsString(rs, "INTERNAL"));
        }
    } finally {
        closeQuietly(rs);
        closeQuietly(stmt);
    }
}

function resolveGroups(dataset, conn, tenantId, rootGroups) {
    for (var i = 0; i < rootGroups.length; i++) {
        try {
            resolveRootGroup(dataset, conn, tenantId, rootGroups[i]);
        } catch (e) {
            log.error("[ds_corrigir_grupos] Grupo " + rootGroups[i] + ": " + e.message, e);
            addResult(dataset, "ERROR", "RESOLVE", rootGroups[i], "", "", "", "", "", "", "", "0", "0", "0", "0", "0", e.message, "", "");
        }
    }
}

function resolveRootGroup(dataset, conn, tenantId, rootCode) {
    var root = findGroup(conn, tenantId, rootCode);
    if (root == null) {
        throw new Error("Grupo nao encontrado: " + rootCode);
    }

    var directUsers = {};
    var candidates = {};
    var visitedGroups = {};
    var queuedGroups = {};
    var visitedRoles = {};
    var cycleDetected = false;
    var rootPath = {};
    rootPath[rootCode] = true;
    var queue = new Array({ code: rootCode, depth: 0, path: rootPath });
    queuedGroups[rootCode] = true;

    while (queue.length > 0) {
        var current = queue.shift();
        if (visitedGroups[current.code]) {
            continue;
        }
        visitedGroups[current.code] = true;
        if (mapSize(visitedGroups) > 500) {
            throw new Error("Limite de 500 grupos relacionados excedido em " + rootCode + ".");
        }

        var memberships = findGroupMemberships(conn, tenantId, current.code);
        for (var i = 0; i < memberships.length; i++) {
            var membership = memberships[i];
            if (membership.login !== "") {
                if (current.depth === 0) {
                    directUsers[membership.login] = true;
                } else {
                    addCandidate(candidates, membership.login, "GROUP", current.code);
                }
            }
            if (membership.roleCode !== "") {
                if (!visitedRoles[membership.roleCode]) {
                    visitedRoles[membership.roleCode] = true;
                    if (mapSize(visitedRoles) > 200) {
                        throw new Error("Limite de 200 papeis relacionados excedido em " + rootCode + ".");
                    }
                    var roleLogins = findRoleLogins(conn, tenantId, membership.roleCode);
                    for (var r = 0; r < roleLogins.length; r++) {
                        addCandidate(candidates, roleLogins[r], "ROLE", membership.roleCode);
                    }
                }
            }
            if (membership.childGroupCode !== "") {
                if (current.path[membership.childGroupCode]) {
                    cycleDetected = true;
                } else if (!queuedGroups[membership.childGroupCode]) {
                    var childPath = copyMap(current.path);
                    childPath[membership.childGroupCode] = true;
                    queuedGroups[membership.childGroupCode] = true;
                    queue.push({ code: membership.childGroupCode, depth: current.depth + 1, path: childPath });
                }
            }
        }
    }

    writeResolvedUsers(dataset, conn, tenantId, root, candidates, directUsers, visitedGroups, visitedRoles, cycleDetected);
}

function writeResolvedUsers(dataset, conn, tenantId, root, candidates, directUsers, visitedGroups, visitedRoles, cycleDetected) {
    var logins = mapKeys(candidates);
    if (logins.length > 10000) {
        throw new Error("Limite de 10000 usuarios candidatos excedido em " + root.code + ".");
    }
    var details = findUserDetails(conn, tenantId, logins);
    if (logins.length === 0) {
        addResult(dataset, "EMPTY", "RESOLVE", root.code, root.description, "", "", "", "", "", "", "0", mapSize(visitedGroups), mapSize(visitedRoles), cycleDetected ? "1" : "0", "0", "Nenhum usuario herdado encontrado.", root.type, root.internal);
        return;
    }
    logins.sort();
    for (var i = 0; i < logins.length; i++) {
        var login = logins[i];
        var user = details[login] || { userCode: "", fullName: "", state: "" };
        addResult(dataset, "OK", "RESOLVE", root.code, root.description, login, user.userCode, user.fullName, user.state, mapKeys(candidates[login].types).join(","), mapKeys(candidates[login].codes).join(","), directUsers[login] ? "1" : "0", mapSize(visitedGroups), mapSize(visitedRoles), cycleDetected ? "1" : "0", logins.length, "", root.type, root.internal);
    }
}

function findGroup(conn, tenantId, groupCode) {
    var stmt = null;
    var rs = null;
    try {
        stmt = conn.prepareStatement("SELECT GROUP_CODE, DESCRIPTION, GROUP_TYPE, INTERNAL FROM fdn_group WHERE TENANT_ID = ? AND GROUP_CODE = ?");
        stmt.setLong(1, java.lang.Long.valueOf(tenantId));
        stmt.setString(2, groupCode);
        rs = stmt.executeQuery();
        if (!rs.next()) {
            return null;
        }
        return { code: rsString(rs, "GROUP_CODE"), description: rsString(rs, "DESCRIPTION"), type: rsString(rs, "GROUP_TYPE"), internal: rsString(rs, "INTERNAL") };
    } finally {
        closeQuietly(rs);
        closeQuietly(stmt);
    }
}

function findGroupMemberships(conn, tenantId, groupCode) {
    var result = new Array();
    var stmt = null;
    var rs = null;
    try {
        stmt = conn.prepareStatement("SELECT LOGIN, CHILD_GROUPCODE, ROLE_CODE FROM fdn_groupuserrole WHERE TENANT_ID = ? AND GROUP_CODE = ?");
        stmt.setLong(1, java.lang.Long.valueOf(tenantId));
        stmt.setString(2, groupCode);
        rs = stmt.executeQuery();
        while (rs.next()) {
            result.push({ login: rsString(rs, "LOGIN"), childGroupCode: rsString(rs, "CHILD_GROUPCODE"), roleCode: rsString(rs, "ROLE_CODE") });
        }
        return result;
    } finally {
        closeQuietly(rs);
        closeQuietly(stmt);
    }
}

function findRoleLogins(conn, tenantId, roleCode) {
    var result = new Array();
    var stmt = null;
    var rs = null;
    try {
        stmt = conn.prepareStatement("SELECT LOGIN FROM fdn_userrole WHERE TENANT_ID = ? AND ROLE_CODE = ?");
        stmt.setLong(1, java.lang.Long.valueOf(tenantId));
        stmt.setString(2, roleCode);
        rs = stmt.executeQuery();
        while (rs.next()) {
            var login = rsString(rs, "LOGIN");
            if (login !== "") {
                result.push(login);
            }
        }
        return result;
    } finally {
        closeQuietly(rs);
        closeQuietly(stmt);
    }
}

function findUserDetails(conn, tenantId, logins) {
    var details = {};
    for (var offset = 0; offset < logins.length; offset += 400) {
        var batch = logins.slice(offset, offset + 400);
        var placeholders = new Array();
        for (var p = 0; p < batch.length; p++) {
            placeholders.push("?");
        }
        var stmt = null;
        var rs = null;
        try {
            stmt = conn.prepareStatement("SELECT ut.LOGIN, ut.USER_CODE, ut.USER_STATE, u.FULL_NAME FROM fdn_usertenant ut INNER JOIN fdn_user u ON u.USER_ID = ut.USER_ID WHERE ut.TENANT_ID = ? AND ut.LOGIN IN (" + placeholders.join(",") + ")");
            stmt.setLong(1, java.lang.Long.valueOf(tenantId));
            for (var i = 0; i < batch.length; i++) {
                stmt.setString(i + 2, batch[i]);
            }
            rs = stmt.executeQuery();
            while (rs.next()) {
                details[rsString(rs, "LOGIN")] = { userCode: rsString(rs, "USER_CODE"), fullName: rsString(rs, "FULL_NAME"), state: rsString(rs, "USER_STATE") };
            }
        } finally {
            closeQuietly(rs);
            closeQuietly(stmt);
        }
    }
    return details;
}

function addCandidate(candidates, login, sourceType, sourceCode) {
    if (login === "") {
        return;
    }
    if (!candidates[login]) {
        candidates[login] = { types: {}, codes: {} };
    }
    candidates[login].types[sourceType] = true;
    candidates[login].codes[sourceType + ":" + sourceCode] = true;
}

function copyMap(source) {
    var target = {};
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }
    return target;
}

function mapKeys(map) {
    var keys = new Array();
    for (var key in map) {
        if (map.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
}

function mapSize(map) {
    return mapKeys(map).length;
}

function rsString(rs, column) {
    var value = rs.getString(column);
    return value == null ? "" : String(value);
}

function stringValue(value) {
    return value == null ? "" : String(value);
}

function closeQuietly(resource) {
    if (resource != null) {
        try {
            resource.close();
        } catch (e) {
            log.warn("[ds_corrigir_grupos] Falha ao fechar recurso: " + e.message);
        }
    }
}
