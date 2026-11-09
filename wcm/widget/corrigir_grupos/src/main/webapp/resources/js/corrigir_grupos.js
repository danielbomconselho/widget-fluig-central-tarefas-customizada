var corrigir_grupos = SuperWidget.extend({
    datasetName: "ds_corrigir_grupos",
    batchSize: 100,
    previewLimit: 500,
    groups: [],
    lastRows: [],
    lastSelected: [],
    pendingByGroup: {},
    translations: {},
    busy: false,

    init: function () {
        this.root = document.getElementById("corrigirGrupos_" + this.instanceId);
        if (!this.root) {
            return;
        }
        this._loadTranslations();
        if (typeof WCMAPI === "undefined" || typeof WCMAPI.getServerURL !== "function" || !WCMAPI.getServerURL()) {
            this._setStatus("danger", this._t("state.noEnv"));
            return;
        }
        this.refreshGroups();
    },

    bindings: {
        local: {
            "refresh-groups": ["click_refreshGroups"],
            "filter-groups": ["input_filterGroups"],
            "select-visible": ["click_selectVisibleGroups"],
            "clear-selection": ["click_clearSelection"],
            "analyze": ["click_analyzeSelected"],
            "apply": ["click_confirmApply"]
        },
        global: {}
    },

    refreshGroups: function () {
        var self = this;
        this._setBusy(true);
        this._clearAnalysis();
        this._setStatus("info", this._t("state.loading"));
        this._datasetRequest([
            this._constraint("ACTION", "LIST_GROUPS", 1)
        ]).then(function (rows) {
            var errorRow = rows.filter(function (row) { return row.STATUS === "ERROR"; })[0];
            if (errorRow) {
                throw new Error(errorRow.MESSAGE || self._t("state.loadError"));
            }
            self.groups = rows.filter(function (row) {
                return row.STATUS === "OK" && row.ROOT_GROUP_CODE;
            });
            self._renderGroups();
            self._setStatus("info", self.groups.length ? self._t("state.ready") : self._t("state.groupsEmpty"));
        }).catch(function (error) {
            self.groups = [];
            self._renderGroups();
            self._setStatus("danger", self._errorMessage(error, self._t("state.loadError")));
        }).then(function () {
            self._setBusy(false);
        });
    },

    filterGroups: function () {
        var input = this.root.querySelector("[data-filter-groups]");
        var filter = this._normalize(input ? input.value : "");
        var options = this.root.querySelectorAll("[data-group-select] option");
        Array.prototype.forEach.call(options, function (option) {
            option.hidden = filter !== "" && option.getAttribute("data-search").indexOf(filter) === -1;
        });
    },

    selectVisibleGroups: function () {
        var options = this.root.querySelectorAll("[data-group-select] option");
        Array.prototype.forEach.call(options, function (option) {
            if (!option.disabled && !option.hidden) {
                option.selected = true;
            }
        });
    },

    clearSelection: function () {
        var options = this.root.querySelectorAll("[data-group-select] option");
        Array.prototype.forEach.call(options, function (option) {
            option.selected = false;
        });
        this._clearAnalysis();
        this._setStatus("info", this._t("state.ready"));
    },

    analyzeSelected: function () {
        var codes = this._selectedGroupCodes();
        if (!codes.length) {
            this._setStatus("warning", this._t("validation.selectGroup"));
            return;
        }
        this._runAnalysis(codes, "");
    },

    confirmApply: function () {
        var self = this;
        var total = this._pendingTotal();
        var groups = Object.keys(this.pendingByGroup).filter(function (code) {
            return self.pendingByGroup[code].length > 0;
        });
        if (!total || !groups.length || this.busy) {
            return;
        }
        FLUIGC.message.confirm({
            title: this._t("common.warning"),
            message: this._format(this._t("apply.confirm"), total, groups.length),
            labelYes: this._t("label.yes"),
            labelNo: this._t("label.no")
        }, function (confirmed) {
            if (confirmed) {
                self._applyPendingUsers();
            }
        });
    },

    _runAnalysis: function (codes, completion) {
        var self = this;
        var constraints = [this._constraint("ACTION", "RESOLVE", 1)];
        codes.forEach(function (code) {
            constraints.push(self._constraint("ROOT_GROUP_CODE", code, 2));
        });
        this.lastSelected = codes.slice(0);
        this._setBusy(true);
        this._setStatus("info", this._t("state.loading"));
        this._datasetRequest(constraints).then(function (rows) {
            self.lastRows = rows;
            self._buildAnalysis(rows, codes);
            if (completion) {
                self._setStatus(completion.type, completion.message);
            }
        }).catch(function (error) {
            self._clearAnalysis();
            self._setStatus("danger", self._errorMessage(error, self._t("state.loadError")));
        }).then(function () {
            self._setBusy(false);
        });
    },

    _buildAnalysis: function (rows, codes) {
        var self = this;
        var summaries = {};
        var errors = 0;
        this.pendingByGroup = {};
        codes.forEach(function (code) {
            summaries[code] = { code: code, description: "", pending: 0, direct: 0, groups: 0, roles: 0, cycle: false, message: "" };
            self.pendingByGroup[code] = [];
        });

        rows.forEach(function (row) {
            var code = row.ROOT_GROUP_CODE;
            if (!code) {
                return;
            }
            if (!summaries[code]) {
                summaries[code] = { code: code, description: "", pending: 0, direct: 0, groups: 0, roles: 0, cycle: false, message: "" };
                self.pendingByGroup[code] = [];
            }
            var summary = summaries[code];
            summary.description = row.ROOT_GROUP_DESCRIPTION || summary.description;
            summary.groups = Number(row.GROUPS_VISITED || summary.groups || 0);
            summary.roles = Number(row.ROLES_VISITED || summary.roles || 0);
            summary.cycle = summary.cycle || row.CYCLE_DETECTED === "1";
            if (row.STATUS === "ERROR") {
                summary.message = row.MESSAGE || self._t("common.error");
                errors += 1;
            } else if (row.STATUS === "OK" && row.LOGIN) {
                if (row.ALREADY_DIRECT === "1") {
                    summary.direct += 1;
                } else {
                    summary.pending += 1;
                    self.pendingByGroup[code].push(row.LOGIN);
                }
            }
        });

        var orderedSummaries = codes.map(function (code) { return summaries[code]; });
        this._renderSummary(orderedSummaries);
        this._renderUsers(rows);
        this.root.querySelector("[data-result]").classList.remove("hide");
        this.root.querySelector("[data-users]").classList.toggle("hide", !rows.some(function (row) { return row.LOGIN; }));
        var total = this._pendingTotal();
        if (errors) {
            this._setStatus("warning", this._format(this._t("analysis.partialError"), errors));
        } else if (total) {
            this._setStatus("success", this._format(this._t("analysis.ready"), total, codes.length));
        } else {
            this._setStatus("success", this._t("analysis.noPending"));
        }
        this._setApplyEnabled(total > 0);
    },

    _applyPendingUsers: function () {
        var self = this;
        var jobs = [];
        Object.keys(this.pendingByGroup).forEach(function (groupCode) {
            var logins = self.pendingByGroup[groupCode];
            for (var offset = 0; offset < logins.length; offset += self.batchSize) {
                jobs.push({ groupCode: groupCode, logins: logins.slice(offset, offset + self.batchSize) });
            }
        });
        if (!jobs.length) {
            return;
        }

        var failures = 0;
        var sequence = Promise.resolve();
        this._setBusy(true);
        jobs.forEach(function (job, index) {
            sequence = sequence.then(function () {
                self._setStatus("info", self._format(self._t("apply.progress"), index + 1, jobs.length));
                return self._addUsers(job.groupCode, job.logins).catch(function () {
                    failures += 1;
                });
            });
        });
        sequence.then(function () {
            var completion = failures ?
                { type: "warning", message: self._format(self._t("apply.partialError"), failures) } :
                { type: "success", message: self._t("apply.success") };
            self._runAnalysis(self.lastSelected.slice(0), completion);
        });
    },

    _addUsers: function (groupCode, logins) {
        var self = this;
        return this._ajax({
            url: this._serverUrl() + "/api/public/2.0/groups/addUsers/" + encodeURIComponent(groupCode),
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(logins),
            timeout: 120000
        }).then(function (response) {
            var payload = self._parseResponse(response);
            var rejected = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.content) ? payload.content : []);
            if (rejected.length) {
                throw new Error(rejected.join(", "));
            }
            return payload;
        });
    },

    _datasetRequest: function (constraints) {
        var self = this;
        return this._ajax({
            url: this._serverUrl() + "/api/public/ecm/dataset/datasets",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({ name: this.datasetName, fields: [], constraints: constraints, order: [] }),
            timeout: 120000
        }).then(function (response) {
            var payload = self._parseResponse(response) || {};
            if (payload.content && Array.isArray(payload.content.values)) {
                return payload.content.values;
            }
            if (Array.isArray(payload.values)) {
                return payload.values;
            }
            throw new Error((payload.content && payload.content.message) || payload.message || self._t("state.loadError"));
        });
    },

    _ajax: function (options) {
        return new Promise(function (resolve, reject) {
            options.success = resolve;
            options.error = function (xhr, status, error) {
                if (typeof WCMAPI !== "undefined" && typeof WCMAPI.failHandler === "function") {
                    WCMAPI.failHandler(xhr, status, error);
                }
                reject(xhr);
            };
            FLUIGC.ajax(options);
        });
    },

    _renderGroups: function () {
        var select = this.root.querySelector("[data-group-select]");
        select.textContent = "";
        this.groups.forEach(function (group) {
            var option = document.createElement("option");
            var label = (group.ROOT_GROUP_DESCRIPTION || group.ROOT_GROUP_CODE) + " (" + group.ROOT_GROUP_CODE + ")";
            option.value = group.ROOT_GROUP_CODE;
            option.textContent = label;
            option.setAttribute("data-search", (label + " " + group.ROOT_GROUP_CODE).toLocaleLowerCase());
            option.disabled = ["1", "true", "yes", "sim"].indexOf(String(group.INTERNAL || "").toLowerCase()) !== -1;
            select.appendChild(option);
        });
    },

    _renderSummary: function (summaries) {
        var self = this;
        var body = this.root.querySelector("[data-summary-body]");
        body.textContent = "";
        summaries.forEach(function (summary) {
            var row = document.createElement("tr");
            var groupLabel = summary.description ? summary.description + " (" + summary.code + ")" : summary.code;
            if (summary.message) {
                groupLabel += " - " + summary.message;
            }
            self._appendCell(row, groupLabel);
            self._appendCell(row, summary.pending);
            self._appendCell(row, summary.direct);
            self._appendCell(row, summary.groups);
            self._appendCell(row, summary.roles);
            self._appendCell(row, summary.cycle ? self._t("label.yes") : self._t("label.no"));
            body.appendChild(row);
        });
    },

    _renderUsers: function (rows) {
        var self = this;
        var body = this.root.querySelector("[data-users-body]");
        var users = rows.filter(function (row) { return row.STATUS === "OK" && row.LOGIN; });
        body.textContent = "";
        users.slice(0, this.previewLimit).forEach(function (user) {
            var row = document.createElement("tr");
            self._appendCell(row, user.ROOT_GROUP_DESCRIPTION || user.ROOT_GROUP_CODE);
            self._appendCell(row, user.LOGIN);
            self._appendCell(row, user.FULL_NAME || "");
            self._appendCell(row, user.SOURCE_CODES || user.SOURCE_TYPES || "");
            self._appendCell(row, user.ALREADY_DIRECT === "1" ? self._t("label.alreadyDirect") : self._t("label.pending"));
            body.appendChild(row);
        });
        if (users.length > this.previewLimit) {
            var limitRow = document.createElement("tr");
            var cell = document.createElement("td");
            cell.colSpan = 5;
            cell.textContent = this._format(this._t("preview.limit"), this.previewLimit);
            limitRow.appendChild(cell);
            body.appendChild(limitRow);
        }
    },

    _appendCell: function (row, value) {
        var cell = document.createElement("td");
        cell.textContent = value == null ? "" : String(value);
        row.appendChild(cell);
    },

    _selectedGroupCodes: function () {
        var select = this.root.querySelector("[data-group-select]");
        return Array.prototype.filter.call(select.options, function (option) {
            return option.selected && !option.disabled;
        }).map(function (option) { return option.value; });
    },

    _clearAnalysis: function () {
        this.lastRows = [];
        this.lastSelected = [];
        this.pendingByGroup = {};
        var result = this.root.querySelector("[data-result]");
        var users = this.root.querySelector("[data-users]");
        if (result) { result.classList.add("hide"); }
        if (users) { users.classList.add("hide"); }
        this._setApplyEnabled(false);
    },

    _setBusy: function (isBusy) {
        this.busy = isBusy;
        var buttons = this.root.querySelectorAll("button");
        Array.prototype.forEach.call(buttons, function (button) {
            button.disabled = isBusy;
        });
        if (!isBusy) {
            this._setApplyEnabled(this._pendingTotal() > 0);
        }
    },

    _setApplyEnabled: function (enabled) {
        var button = this.root.querySelector("[data-apply]");
        if (button) {
            button.disabled = this.busy || !enabled;
        }
    },

    _pendingTotal: function () {
        var self = this;
        return Object.keys(this.pendingByGroup).reduce(function (total, code) {
            return total + self.pendingByGroup[code].length;
        }, 0);
    },

    _setStatus: function (type, message) {
        var status = this.root.querySelector("[role='status']");
        status.className = "alert alert-" + type;
        status.textContent = message;
    },

    _loadTranslations: function () {
        var self = this;
        var nodes = this.root.querySelectorAll("[data-i18n-key]");
        Array.prototype.forEach.call(nodes, function (node) {
            self.translations[node.getAttribute("data-i18n-key")] = node.textContent;
        });
    },

    _t: function (key) {
        return this.translations[key] || key;
    },

    _format: function (message) {
        var args = Array.prototype.slice.call(arguments, 1);
        return String(message).replace(/\{(\d+)\}/g, function (match, index) {
            return typeof args[Number(index)] === "undefined" ? match : args[Number(index)];
        });
    },

    _constraint: function (field, value, type) {
        return {
            _field: field,
            _initialValue: value,
            _finalValue: value,
            _type: type,
            _likeSearch: false
        };
    },

    _serverUrl: function () {
        return String(WCMAPI.getServerURL()).replace(/\/$/, "");
    },

    _parseResponse: function (response) {
        if (typeof response === "string") {
            try {
                return JSON.parse(response);
            } catch (ignore) {
                return response;
            }
        }
        return response;
    },

    _errorMessage: function (error, fallback) {
        if (!error) {
            return fallback;
        }
        var response = error.responseJSON || this._parseResponse(error.responseText || "");
        return (response && response.message) || (response && response.content && response.content.message) || error.message || fallback;
    },

    _normalize: function (value) {
        return String(value || "").toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
});
