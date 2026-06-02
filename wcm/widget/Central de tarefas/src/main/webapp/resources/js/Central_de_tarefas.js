var Central_de_tarefas = SuperWidget.extend({

    // Local state variables
    requests: [],
    filters: null,            // Inicializado em init() para evitar compartilhamento entre instâncias
    colleagueMap: null,       // Idem
    categoryLabelMap: null,
    currentStatus: null,
    currentProcess: null,
    carouselIndex: 0,
    i18n: {},

    // === Fase 0: instrumentação opt-in de performance ===
    // Para ATIVAR em homologação (cobre o init na próxima recarga):
    //   localStorage.setItem('CentralTarefas.debugPerf', 'true');  // depois recarregar
    // Para DESATIVAR:
    //   localStorage.removeItem('CentralTarefas.debugPerf');       // depois recarregar
    // Quando OFF (default), helpers viram no-op — zero overhead em produção.
    debugPerf: false,
    _perfCounters: null,

    // Cache de atividades por processId (preenchido pelo getProcessActivities).
    // Vive durante a sessão da instância — atividades de processo não mudam em runtime.
    _processStateCache: null,

    // Status do carregamento inicial — diferencia vazio legítimo de erro real.
    // Valores: 'ok' | 'error' | 'no-env'
    _loadStatus: 'ok',
    _loadError: null,

    _perfNow: function() {
        return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    },
    _perfCount: function(label) {
        if (!this.debugPerf) return;
        if (!this._perfCounters) this._perfCounters = {};
        this._perfCounters[label] = (this._perfCounters[label] || 0) + 1;
    },
    _perfTime: function(label, fn) {
        if (!this.debugPerf) return fn.call(this);
        var t0 = this._perfNow();
        try {
            return fn.call(this);
        } finally {
            console.log('[CentralTarefas][perf] ' + label + ': ' + Math.round(this._perfNow() - t0) + 'ms');
        }
    },
    _perfReport: function(label) {
        if (!this.debugPerf) return;
        console.log('[CentralTarefas][perf] ' + label + ' counters:', JSON.stringify(this._perfCounters || {}));
    },

    _t: function(key) {
        return this.i18n && this.i18n[key] ? this.i18n[key] : key;
    },

    _format: function(template, values) {
        values = values || [];
        return String(template || '').replace(/\{(\d+)\}/g, function(match, index) {
            return values[index] !== undefined ? values[index] : match;
        });
    },

    _getStatusLabels: function(variant) {
        return {
            andamento: this._t('central.tarefas.status.andamento'),
            concluidas: this._t('central.tarefas.status.concluidas'),
            atrasados: this._t('central.tarefas.status.atrasadas'),
            geral: variant === 'carousel'
                ? this._t('central.tarefas.status.gerais.tudo')
                : this._t('central.tarefas.status.geral')
        };
    },

    loadI18n: function() {
        var instance = this;
        var translations = {};
        $('#central-tarefas-i18n-' + instance.instanceId).find('[data-i18n-key]').each(function() {
            var key = $(this).attr('data-i18n-key');
            if (key) {
                translations[key] = $(this).text();
            }
        });
        instance.i18n = translations;
    },

    // Widget initialization
    init: function() {
        var instance = this;

        // debugPerf precisa ser lido ANTES de qualquer medição para cobrir o init().
        // Atribuição no console (Central_de_tarefas.instance().debugPerf = true) não
        // sobrevive a reload — por isso usamos localStorage como fonte persistente.
        try {
            if (typeof localStorage !== 'undefined' && localStorage.getItem('CentralTarefas.debugPerf') === 'true') {
                instance.debugPerf = true;
            }
        } catch (e) { /* localStorage pode estar bloqueado (modo privado, sandbox) */ }

        instance._perfCounters = {};
        var _initT0 = instance._perfNow();

        instance.loadI18n();

        // Estado por instância (objetos não podem ficar no protótipo)
        instance.filters = { solicitante: 'all', responsavel: 'all', categoria: 'all' };
        instance.colleagueMap = {};
        instance.categoryLabelMap = {};
        instance._processStateCache = {};

        // Hide containers initially
        $('#carousel-section-' + instance.instanceId).addClass('d-none');
        $('#kanban-section-' + instance.instanceId).addClass('d-none');

        // Load dataset or mock data
        instance.requests = instance.loadData();

        // Resolve nomes amigáveis de responsáveis e solicitantes (id → nome)
        instance.loadColleagueNames();

        // Aplica nome amigável do solicitante nos requests
        instance.resolveRequesterNames();

        // Popula os selects de filtro a partir dos dados carregados
        instance.populateFilters();

        // Compute and show status card numbers
        instance.renderKPIs();

        // Bind dynamic event listeners
        instance.setupEvents();

        // Decide se mostra estado vazio inicial (vazio legítimo, erro de load ou sem ambiente)
        instance.renderEmptyState();

        // === DIAG TEMPORÁRIO (remover após investigação) ===
        var _diagSample = (instance.requests || [])[0];
        console.log('[CentralTarefas][diag] init END instanceId=' + instance.instanceId
            + ' requests=' + (instance.requests || []).length
            + ' colleagueMapKeys=' + Object.keys(instance.colleagueMap || {}).length,
            'sample.requester=', _diagSample && _diagSample.requester,
            'sample.requesterId=', _diagSample && _diagSample.requesterId,
            'sample.requesterName=', _diagSample && _diagSample.requesterName);
        // === FIM DIAG ===

        if (instance.debugPerf) {
            console.log('[CentralTarefas][perf] init: ' + Math.round(instance._perfNow() - _initT0) + 'ms');
            instance._perfReport('init');
        }
    },

    // BIND de eventos do Fluig (we use delegated jQuery events for reliability with dynamic elements)
    bindings: {
        local: {},
        global: {}
    },

    // Setup event handlers using jQuery delegation
    setupEvents: function() {
        var instance = this;
        var rootSelector = '#Central_de_tarefas_' + instance.instanceId;
        $("#btn-nova-solicitacao").on("click", function () {
            window.location.href = "/portal/p/1/pageprocessstart";
        });
        // KPI Status card selection
        $(rootSelector).on('click', '[data-status-card]', function() {
            var status = $(this).attr('data-status-card');
            instance.selectStatus(status);
        });

        // Process selection inside the carousel
        $(rootSelector).on('click', '[data-process-id]', function() {
            var processId = $(this).attr('data-process-id');
            instance.selectProcess(processId);
        });

        // Carousel buttons
        $(rootSelector).on('click', '#carousel-prev-' + instance.instanceId, function() {
            instance.slideCarousel('prev');
        });

        $(rootSelector).on('click', '#carousel-next-' + instance.instanceId, function() {
            instance.slideCarousel('next');
        });

        // Kanban search input — debounce 250ms para evitar re-render por tecla
        var _searchTimer = null;
        $(rootSelector).on('input', '#kanban-search-' + instance.instanceId, function() {
            if (_searchTimer) clearTimeout(_searchTimer);
            _searchTimer = setTimeout(function() {
                _searchTimer = null;
                instance.renderKanban();
            }, 250);
        });

        // Filtros base (solicitante, responsavel, categoria)
        $(rootSelector).on('change', '.filter-select', function() {
            var key = $(this).attr('data-filter-key');
            var val = $(this).val();
            if (key && instance.filters.hasOwnProperty(key)) {
                instance.filters[key] = val;
                instance.applyFiltersAndRefresh();
            }
        });

        // Botão Limpar Filtros
        $(rootSelector).on('click', '#clear-filters-' + instance.instanceId, function() {
            instance.clearAllFilters();
        });

        // Botão × de cada chip (remove filtro individual)
        $(rootSelector).on('click', '.filter-chip-remove', function() {
            var $chip = $(this).closest('.filter-chip');
            var key = $chip.attr('data-chip-key');
            if (key) instance.removeFilter(key);
        });

        // Abrir solicitação ao clicar em qualquer área do card
        $(rootSelector).on('click', '.kanban-card[data-process-instance]', function() {
            instance.openRequest({
                processInstanceId: $(this).attr('data-process-instance'),
                processId: $(this).attr('data-process-id')
            });
        });

        // Acessibilidade — abrir com Enter/Espaço quando o card tem foco
        $(rootSelector).on('keydown', '.kanban-card[data-process-instance]', function(ev) {
            if (ev.key === 'Enter' || ev.key === ' ' || ev.keyCode === 13 || ev.keyCode === 32) {
                ev.preventDefault();
                instance.openRequest({
                    processInstanceId: $(this).attr('data-process-instance'),
                    processId: $(this).attr('data-process-id')
                });
            }
        });
    },

    // Resolve o login do usuário logado, com fallbacks seguros
    getLoggedUser: function() {
        if (typeof WCMAPI === 'undefined') return null;
        if (WCMAPI.userCode) return WCMAPI.userCode;
        if (WCMAPI.getUserCode) return WCMAPI.getUserCode();
        if (WCMAPI.user) return WCMAPI.user;
        return null;
    },

    getCurrentLanguage: function() {
        if (typeof WCMAPI !== 'undefined') {
            if (WCMAPI.locale) return WCMAPI.locale;
            if (WCMAPI.getLocale) return WCMAPI.getLocale();
            if (WCMAPI.language) return WCMAPI.language;
        }
        if (typeof navigator !== 'undefined') {
            return navigator.language || navigator.userLanguage || 'pt-BR';
        }
        return 'pt-BR';
    },

    getTranslatedProcessLabel: function(processId, fallback) {
        var instance = this;
        if (!processId || typeof DatasetFactory === 'undefined') return fallback;

        try {
            var idioma = instance.getCurrentLanguage();
            var normalizedIdioma = String(idioma || '').replace('_', '-').toLowerCase();
            var constraints = [
                DatasetFactory.createConstraint("PROCESSID", processId, processId, ConstraintType.MUST),
                DatasetFactory.createConstraint("IDIOMA", idioma, idioma, ConstraintType.MUST)
            ];
            instance._perfCount('dataset.ds_traducao_dos_processos');
            var ds = DatasetFactory.getDataset("ds_traducao_dos_processos", null, constraints, null);
            if (!ds || !ds.values || ds.values.length === 0) return fallback;

            var row = ds.values[0];
            for (var i = 0; i < ds.values.length; i++) {
                var candidate = ds.values[i];
                var rowIdioma = candidate.IDIOMA
                    || candidate.idioma
                    || candidate.LANGUAGE
                    || candidate.language
                    || candidate.LOCALE
                    || candidate.locale
                    || candidate.LANG
                    || candidate.lang;
                if (rowIdioma && String(rowIdioma).replace('_', '-').toLowerCase() === normalizedIdioma) {
                    row = candidate;
                    break;
                }
            }

            return instance.getTranslatedProcessText(row, fallback);
        } catch (e) {
            console.warn('[CentralTarefas] Falha ao traduzir processo ' + processId + ':', e);
            return fallback;
        }
    },

    getTranslatedProcessText: function(row, fallback) {
        if (!row) return fallback;

        var preferredFields = [
            'CATEGORY_DESCRIPTION',
            'categoryDescription',
            'CATEGORY',
            'category',
            'CATEGORIA',
            'categoria',
            'PROCESS_DESCRIPTION',
            'processDescription',
            'PROCESSDESCRIPTION',
            'DESCRIPTION',
            'description',
            'DESCRICAO',
            'descricao',
            'NOME',
            'nome'
        ];
        for (var i = 0; i < preferredFields.length; i++) {
            var value = row[preferredFields[i]];
            if (value && value !== 'null') return value;
        }

        for (var key in row) {
            if (row.hasOwnProperty(key)) {
                var lowerKey = String(key).toLowerCase();
                var ignored = lowerKey.indexOf('process') !== -1
                    || lowerKey.indexOf('vers') !== -1
                    || lowerKey.indexOf('idioma') !== -1
                    || lowerKey.indexOf('language') !== -1
                    || lowerKey.indexOf('locale') !== -1
                    || lowerKey === 'lang';
                if (!ignored && row[key] && row[key] !== 'null') return row[key];
            }
        }

        return fallback;
    },

    // Busca assíncrona as tarefas ativas de uma solicitação via REST.
    // Invoca callback com { movementSequence, assigneeCode } da tarefa do usuário logado,
    // ou null se não encontrar / falhar. NÃO bloqueia a UI.
    fetchUserTaskContextAsync: function(processId, processInstanceId, callback) {
        var instance = this;
        if (!processId || !processInstanceId) return callback(null);

        var loggedUser = instance.getLoggedUser();
        if (!loggedUser) return callback(null);

        var serverURL = WCMAPI.serverURL || (WCMAPI.getServerURL && WCMAPI.getServerURL()) || '';
        var url = serverURL
                + '/process-management/api/v2/processes/' + encodeURIComponent(processId)
                + '/requests/tasks?processInstanceId=' + encodeURIComponent(processInstanceId);

        var requestFn = (typeof FLUIGC !== 'undefined' && FLUIGC.ajax)
            ? FLUIGC.ajax
            : (typeof $ !== 'undefined' && $.ajax ? $.ajax : null);
        if (!requestFn) return callback(null);

        instance._perfCount('ajax.requests-tasks');
        var _t0 = instance._perfNow();

        try {
            requestFn({
                dataType: 'json',
                url: url,
                type: 'GET',
                contentType: 'application/json',
                async: true,
                loading: false,
                success: function(result) {
                    if (instance.debugPerf) {
                        console.log('[CentralTarefas][perf] ajax.requests-tasks: ' + Math.round(instance._perfNow() - _t0) + 'ms');
                    }
                    var items = (result && result.items) ? result.items : [];
                    var userTasks = [];
                    for (var i = 0; i < items.length; i++) {
                        var it = items[i];
                        var code = it.assignee && it.assignee.code;
                        if (code === loggedUser && it.movementSequence) {
                            userTasks.push(it);
                        }
                    }
                    if (userTasks.length === 0) return callback(null);

                    userTasks.sort(function(a, b) {
                        var movA = parseInt(a.movementSequence, 10) || 0;
                        var movB = parseInt(b.movementSequence, 10) || 0;
                        if (movA !== movB) return movB - movA;

                        var dateA = new Date(a.assignStartDate || a.startDate || 0).getTime() || 0;
                        var dateB = new Date(b.assignStartDate || b.startDate || 0).getTime() || 0;
                        return dateB - dateA;
                    });

                    callback({
                        movementSequence: userTasks[0].movementSequence,
                        assigneeCode: userTasks[0].assignee && userTasks[0].assignee.code
                    });
                },
                error: function(xhr, st, err) {
                    if (instance.debugPerf) {
                        console.log('[CentralTarefas][perf] ajax.requests-tasks (error): ' + Math.round(instance._perfNow() - _t0) + 'ms');
                    }
                    console.error("Erro ao buscar tarefas da solicitação:", st, err);
                    callback(null);
                }
            });
        } catch (e) {
            console.error("Falha na consulta REST de tarefas:", e);
            callback(null);
        }
    },

    // Abre a solicitação no Fluig em nova aba (híbrido):
    //  - se houver tarefa ativa do usuário logado → abre o formulário da tarefa
    //  - senão → abre a tela de detalhes/consulta
    //
    // window.open precisa rodar no mesmo tick do clique (handler do gesto) para
    // não ser bloqueado pelo popup blocker. Por isso a janela é aberta JÁ aqui
    // com about:blank + loader, e só depois recebe a URL final via async.
    openRequest: function(task) {
        var instance = this;
        if (!task || !task.processInstanceId) return;

        if (typeof WCMAPI === 'undefined') {
            console.error("WCMAPI indisponível — não é possível abrir a solicitação.");
            return;
        }

        var serverURL = WCMAPI.serverURL || (WCMAPI.getServerURL && WCMAPI.getServerURL()) || '';
        var tenant = WCMAPI.organizationId
                  || (WCMAPI.getTenantCode && WCMAPI.getTenantCode())
                  || (WCMAPI.getOrganizationId && WCMAPI.getOrganizationId());

        if (!tenant) {
            console.error("Tenant indisponível — não é possível montar a URL da solicitação.");
            return;
        }

        var base = serverURL + '/portal/p/' + tenant + '/pageworkflowview?';
        var fallbackUrl = base + 'app_ecm_workflowview_detailsProcessInstanceID=' + encodeURIComponent(task.processInstanceId);

        // Abre a janela AGORA, no tick do clique. Sem isso o popup blocker bloqueia.
        var win = window.open('about:blank', '_blank');
        if (!win) {
            console.warn("Abertura da solicitação bloqueada pelo navegador. Habilite popups para este site.");
            return;
        }

        // Loader simples enquanto a chamada async resolve a tarefa
        try {
            win.document.open();
            var openingRequestText = instance._t('central.tarefas.abrindo.solicitacao');
            win.document.write(
                '<!doctype html><html><head><meta charset="utf-8">' +
                '<title>' + instance.escapeHtml(openingRequestText) + '</title>' +
                '<style>body{font-family:Lato,Arial,sans-serif;color:#5a5a5a;padding:40px;text-align:center}</style>' +
                '</head><body>' + instance.escapeHtml(openingRequestText) + '</body></html>'
            );
            win.document.close();
        } catch (eDoc) {
            // alguns navegadores podem bloquear escrita no about:blank — segue sem loader
        }

        // Timeout de segurança: se a chamada REST pendurar (rede lenta, servidor sem
        // resposta, SDK que não dispara success/error), evita deixar a aba presa em
        // "Abrindo solicitação…" indefinidamente — força navegação para o fallbackUrl.
        var resolved = false;
        var navigateTo = function(targetUrl) {
            if (resolved) return;
            resolved = true;
            try {
                win.location.href = targetUrl;
            } catch (eNav) {
                    console.error(instance._t('central.tarefas.console.erro.navegar.solicitacao'), eNav);
            }
        };
        var timeoutHandle = setTimeout(function() {
            if (resolved) return;
            console.warn("[CentralTarefas] Timeout (15s) ao buscar contexto da tarefa — abrindo tela de detalhes em fallback.");
            navigateTo(fallbackUrl);
        }, 15000);

        // Resolve contexto da tarefa e atualiza a janela com a URL final
        instance.fetchUserTaskContextAsync(task.processId, task.processInstanceId, function(ctx) {
            clearTimeout(timeoutHandle);
            var finalUrl;
            if (ctx && ctx.movementSequence && ctx.assigneeCode) {
                finalUrl = base
                    + 'app_ecm_workflowview_processInstanceId=' + encodeURIComponent(task.processInstanceId)
                    + '&app_ecm_workflowview_currentMovto=' + encodeURIComponent(ctx.movementSequence)
                    + '&app_ecm_workflowview_taskUserId=' + encodeURIComponent(ctx.assigneeCode)
                    + '&app_ecm_workflowview_managerMode=false';
            } else {
                finalUrl = fallbackUrl;
            }
            navigateTo(finalUrl);
        });
    },

    // Hybrid data loader: Fluig dataset -> fallback to rich mock data
    loadData: function() {
        var instance = this;
        var data = [];

        // Check if we are running in the Fluig WCM environment
        if (typeof DatasetFactory !== 'undefined' && typeof WCMAPI !== 'undefined') {
            data = instance.getFluigData();
        } else {
            instance._loadStatus = 'no-env';
        }
        return data;
    },

    // Retrieve and join Fluig Datasets
    getFluigData: function() {
        var data = [];
        // Escopo pessoal: widget mostra apenas itens onde o usuário logado tem tarefa
        // ativa OU é o requester. Se loggedUser indisponível, mantém comportamento legado (sem filtro).
        var loggedUser = this.getLoggedUser();
        try {
            // Get all workflow instances
            var constraintsWorkflow = [];
            constraintsWorkflow.push(DatasetFactory.createConstraint("active", "true", "true", ConstraintType.MUST));
            this._perfCount('dataset.workflowProcess');
            var dsWorkflow = DatasetFactory.getDataset("workflowProcess", null, constraintsWorkflow, null);
            if (dsWorkflow && dsWorkflow.values && dsWorkflow.values.length > 0) {

                // Get active tasks to find current activity name, deadlines and assignees.
                // Constraint MATRICULA reduz drasticamente o payload quando loggedUser está disponível
                // (ds_process_task suporta o bind — ver datasets/ds_process_task.js).
                var dsTasksConstraints = null;
                if (loggedUser) {
                    dsTasksConstraints = [DatasetFactory.createConstraint("MATRICULA", loggedUser, loggedUser, ConstraintType.MUST)];
                }
                this._perfCount('dataset.ds_process_task');
                var dsTasks = DatasetFactory.getDataset("ds_process_task", null, dsTasksConstraints, null);
                var activeTaskMap = {};

                if (dsTasks && dsTasks.values) {
                    for (var j = 0; j < dsTasks.values.length; j++) {
                        var task = dsTasks.values[j];
                        // check if task is active
                        if (task.LOG_ATIV === "true" || task.LOG_ATIV === true) {
                            // Array para suportar processos com múltiplas tarefas ativas (paralelismo/pool)
                            if (!activeTaskMap[task.NUM_PROCES]) {
                                activeTaskMap[task.NUM_PROCES] = [];
                            }
                            var aid = task.CD_MATRICULA;
                            // Dataset retorna "null" como string para valores nulos do SQL
                            if (aid === 'null' || aid === undefined) aid = null;
                            activeTaskMap[task.NUM_PROCES].push({
                                activityDescription: task.DES_ESTADO || this._format(this._t('central.tarefas.processo.atividade'), [task.NUM_SEQ_ESTADO]),
                                deadline: task.DEADLINE,
                                assigneeId: aid
                            });
                        }
                    }
                }

                // Reduz aos itens do usuário antes das consultas auxiliares.
                var workflowValues = dsWorkflow.values;
                if (loggedUser) {
                    workflowValues = dsWorkflow.values.filter(function(w) {
                        var iid = w.processInstanceId || w["workflowProcessPK.processInstanceId"];
                        var hasUserTask = activeTaskMap[iid] && activeTaskMap[iid].length > 0;
                        var isUserRequester = w.requesterId === loggedUser;
                        return hasUserTask || isUserRequester;
                    });
                }
                var visibleProcessIds = {};
                workflowValues.forEach(function(w) {
                    if (w.processId) visibleProcessIds[w.processId] = true;
                });

                // Process definition dataset to get cleaner process names
                this._perfCount('dataset.processDefinition');
                var dsDef = DatasetFactory.getDataset("processDefinition", null, null, null);
                var processNames = {};
                var categoryNames = {};
                var categoryLabels = {};
                if (dsDef && dsDef.values) {
                    for (var k = 0; k < dsDef.values.length; k++) {
                        var def = dsDef.values[k];
                        var defProcessId = def["processDefinitionPK.processId"];
                        if (!visibleProcessIds[defProcessId]) continue;
                        var defProcessName = def.processDescription;
                        var defCategoryId = def.categoryId;
                        processNames[defProcessId] = defProcessName;
                        categoryNames[defProcessId] = defCategoryId;
                        if (defCategoryId && defCategoryId !== 'null' && !categoryLabels[defCategoryId]) {
                            categoryLabels[defCategoryId] = this.getTranslatedProcessLabel(defProcessId, defProcessName || defCategoryId);
                        }
                    }
                }
                this.categoryLabelMap = categoryLabels;

                // Reduz dsWorkflow.values aos itens do usuário ANTES de buildDescriptorMap.
                // Isso encolhe drasticamente o N+1 do dataset 'document', porque só pedimos
                // descriptor para solicitações que de fato serão exibidas.
                // Mapa cardDocumentId → descriptor textual do registro de formulário.
                // Prioridade do texto: documentDescription → cardDescription.
                // Seleção de versão: activeVersion === true; fallback = maior documentPK.version.
                var descriptorMap = this.buildDescriptorMap(workflowValues);

                for (var i = 0; i < workflowValues.length; i++) {
                    var w = workflowValues[i];
                    var instanceId = w.processInstanceId || w["workflowProcessPK.processInstanceId"];
                    var procId = w.processId;

                    // Format process name nicely
                    var procName = processNames[procId] || w.processDescription || procId;
                    procName = procName.replace(/_/g, " ");
                    var categoryId = categoryNames[procId];
                    if (categoryId === 'null' || categoryId === undefined) categoryId = null;

                    // Solicitante: guarda id e name separados (login técnico pode vir em qualquer um)
                    var requesterId = w.requesterId || null;
                    var requesterName = w.requesterName || null;
                    var requester = requesterName || requesterId || this._t('central.tarefas.filtro.solicitante');
                    var start = w.startDate || w.startPeriod;

                    // Determine request state (active/inactive)
                    var active = w.active === "true" || w.active === true || w.state === 0 || w.state === "0";

                    var dateStr = "";
                    if (start) {
                        var d = new Date(start);
                        dateStr = isNaN(d.getTime()) ? start : d.toLocaleDateString('pt-BR');
                    } else {
                        dateStr = new Date().toLocaleDateString('pt-BR');
                    }

                    // Tarefas ativas desse processo (pode haver múltiplas em paralelismo/pool)
                    var currentTasks = activeTaskMap[instanceId] || [];
                    var currentTask = currentTasks[0]; // Tarefa principal para exibição
                    var currentActivity = this._t('central.tarefas.processo.finalizado');
                    var status = "concluidas";
                    if (active) {
                        currentActivity = currentTask ? currentTask.activityDescription : this._t('central.tarefas.processo.inicio');
                        // Processo está atrasado se QUALQUER tarefa ativa estiver vencida
                        var isDelayed = false;
                        var hasMoment = typeof moment !== 'undefined';
                        var nowMs = Date.now();
                        for (var t = 0; t < currentTasks.length; t++) {
                            var activeTask = currentTasks[t];
                            if (!activeTask || !activeTask.deadline) continue;
                            if (hasMoment) {
                                var deadLine = moment(activeTask.deadline, 'YYYY-MM-DD HH:mm:ss');
                                if (deadLine.isValid() && deadLine.isBefore(nowMs)) {
                                    isDelayed = true;
                                    break;
                                }
                            } else {
                                // Fallback nativo se moment.js não estiver disponível
                                var dl = new Date(String(activeTask.deadline).replace(' ', 'T'));
                                if (!isNaN(dl.getTime()) && dl.getTime() < nowMs) {
                                    isDelayed = true;
                                    break;
                                }
                            }
                        }
                        status = isDelayed ? "atrasados" : "andamento";
                    }

                    // Lista deduplicada de responsáveis ativos
                    var assigneeIds = [];
                    for (var t2 = 0; t2 < currentTasks.length; t2++) {
                        var aid2 = currentTasks[t2].assigneeId;
                        if (aid2 && assigneeIds.indexOf(aid2) === -1) {
                            assigneeIds.push(aid2);
                        }
                    }

                    // cardDocumentId pode vir como "null" (string), 0 ou ausente
                    var cardDocumentId = w.cardDocumentId;
                    if (cardDocumentId === 'null' || cardDocumentId === '0' || cardDocumentId === 0 || cardDocumentId === undefined) {
                        cardDocumentId = null;
                    }
                    var descriptorText = (cardDocumentId && descriptorMap[cardDocumentId]) ? descriptorMap[cardDocumentId] : null;

                    data.push({
                        id: "FLUIG-" + instanceId,
                        processInstanceId: instanceId,
                        processId: procId,
                        processName: procName,
                        requester: requester,
                        requesterId: requesterId,
                        requesterName: requesterName,
                        date: dateStr,
                        status: status,
                        currentActivity: currentActivity,
                        categoryId: categoryId,
                        categoryLabel: categoryId ? (categoryLabels[categoryId] || categoryId) : null,
                        assigneeIds: assigneeIds,
                        cardDocumentId: cardDocumentId,
                        descriptor: descriptorText,
                        description: this._format(this._t('central.tarefas.solicitacao.descricao'), [procName]),
                        priority: instanceId % 3 === 0
                            ? this._t('central.tarefas.prioridade.alta')
                            : (instanceId % 3 === 1
                                ? this._t('central.tarefas.prioridade.media')
                                : this._t('central.tarefas.prioridade.baixa'))
                    });
                }
            }
        } catch (e) {
            console.error("Erro ao consultar datasets do Fluig:", e);
            this._loadStatus = 'error';
            this._loadError = e;
        }
        return data;
    },

    // Carrega mapa colleagueId → nome amigável a partir do dataset nativo "colleague".
    // Resolve apenas responsáveis (assigneeIds). Para solicitantes usa-se requesterName
    // que já vem no workflowProcess — evita N+1 inteiro de requesters.
    // Query por ID com constraint (evita carregar todo o dataset de colaboradores).
    // Falha silenciosa: nome ausente cai para o id como fallback.
    loadColleagueNames: function() {
        var instance = this;
        instance.colleagueMap = {};

        if (typeof DatasetFactory === 'undefined') return;

        // Coleta apenas IDs de responsáveis. Para solicitantes, getUserDisplayName()
        // já faz fallback para requesterName quando o ID não está no map.
        // Combinado com o escopo pessoal (MATRICULA), o conjunto de assignees colapsa
        // na prática para ~1 entrada (o próprio usuário logado).
        var idsNeeded = {};
        instance.requests.forEach(function(req) {
            (req.assigneeIds || []).forEach(function(id) {
                if (id) idsNeeded[id] = true;
            });
        });

        var ids = Object.keys(idsNeeded);
        // Sem early return: a residual de SOLICITANTES (logo abaixo) precisa rodar
        // mesmo quando não há assignees a resolver — caso típico de usuário Identity
        // que aparece só como requester, nunca como assignee.

        ids.forEach(function(id) {
            try {
                var c1 = DatasetFactory.createConstraint("colleaguePK.colleagueId", id, id, ConstraintType.MUST);
                instance._perfCount('dataset.colleague');
                var ds = DatasetFactory.getDataset("colleague", null, [c1], null);
                if (ds && ds.values && ds.values.length > 0) {
                    var c = ds.values[0];
                    instance.colleagueMap[id] = c.colleagueName || c.fullName || id;
                }
            } catch (e) {
                // Silencioso — falha em uma resolução não deve travar o widget
            }
        });

        // Resolução residual de SOLICITANTES (requesterId).
        // O caminho otimizado usa req.requesterName direto (sem chamada extra). Em
        // ambientes Identity, requesterName costuma vir vazio OU igual ao hash do id —
        // nesses casos caímos no fallback que exibe o hash na tela. Aqui detectamos
        // esses casos e fazemos uma 2ª passada no dataset 'colleague' para resolver o
        // nome real. IDs já presentes em colleagueMap (resolvidos como responsáveis)
        // não são re-buscados.
        var residualIds = {};
        instance.requests.forEach(function(req) {
            var rid = req.requesterId;
            if (!rid) return;
            if (instance.colleagueMap[rid]) return; // já resolvido
            // Sinais de "nome técnico":
            //   - requesterName ausente/null
            //   - requesterName igual ao id (típico de Identity)
            //   - requesterName parece hash (32 chars hex)
            var rname = req.requesterName;
            var looksTechnical = !rname
                || rname === rid
                || (typeof rname === 'string' && /^[0-9a-f]{32}$/i.test(rname));
            if (looksTechnical) {
                residualIds[rid] = true;
            }
        });
        var residual = Object.keys(residualIds);
        // === DIAG TEMPORÁRIO (remover após investigação) ===
        console.log('[CentralTarefas][diag] requests.length=' + instance.requests.length
            + ' assignees=' + ids.length
            + ' residualRequesterIds=' + residual.length, residual);
        // === FIM DIAG ===
        if (residual.length > 0) {
            residual.forEach(function(id) {
                try {
                    var c1 = DatasetFactory.createConstraint("colleaguePK.colleagueId", id, id, ConstraintType.MUST);
                    instance._perfCount('dataset.colleague.requester');
                    var ds = DatasetFactory.getDataset("colleague", null, [c1], null);
                    // === DIAG TEMPORÁRIO ===
                    var rowsLen = (ds && ds.values) ? ds.values.length : 0;
                    var firstName = rowsLen ? (ds.values[0].colleagueName || ds.values[0].fullName || '(sem nome)') : '(sem rows)';
                    console.log('[CentralTarefas][diag] residual id=' + id + ' rows=' + rowsLen + ' name=' + firstName);
                    // === FIM DIAG ===
                    if (ds && ds.values && ds.values.length > 0) {
                        var c = ds.values[0];
                        instance.colleagueMap[id] = c.colleagueName || c.fullName || id;
                    }
                } catch (e) {
                    console.log('[CentralTarefas][diag] residual ERROR id=' + id, e && e.message);
                }
            });
            // === DIAG TEMPORÁRIO ===
            console.log('[CentralTarefas][diag] colleagueMap após residual:', JSON.stringify(instance.colleagueMap));
            // === FIM DIAG ===
        }
    },

    // Resolve o descriptor (texto descritivo da solicitação) a partir do dataset 'document'.
    // Recebe a lista bruta de workflowProcess.values e retorna mapa cardDocumentId → texto.
    //
    // Estratégia:
    //  1. Deduplica cardDocumentIds válidos do workflowProcess.
    //  2. Consulta dataset 'document' por documentPK.documentId (1 chamada por documento único).
    //  3. Seleciona a linha com activeVersion === true; fallback: maior documentPK.version.
    //  4. Prioriza documentDescription → cardDescription; ignora valores vazios/"null".
    //
    // Falha silenciosa por item — uma resolução com erro não trava o widget.
    buildDescriptorMap: function(workflowValues) {
        var map = {};
        if (typeof DatasetFactory === 'undefined' || !workflowValues) return map;

        // Deduplica cardDocumentIds válidos
        var idsNeeded = {};
        for (var i = 0; i < workflowValues.length; i++) {
            var cdId = workflowValues[i].cardDocumentId;
            if (cdId && cdId !== 'null' && cdId !== '0' && cdId !== 0) {
                idsNeeded[cdId] = true;
            }
        }
        var ids = Object.keys(idsNeeded);
        if (ids.length === 0) return map;

        var self = this;
        ids.forEach(function(docId) {
            try {
                var c1 = DatasetFactory.createConstraint("documentPK.documentId", docId, docId, ConstraintType.MUST);
                var c2 = DatasetFactory.createConstraint("activeVersion", true, true, ConstraintType.MUST);
                //var c3 = DatasetFactory.createConstraint("dataSetName", "", "", ConstraintType.MUST_NOT);
                self._perfCount('dataset.document');
                var dsDoc = DatasetFactory.getDataset("document", null, [c1, c2], null);
                if (!dsDoc || !dsDoc.values || dsDoc.values.length === 0) return;

                // 1ª escolha: activeVersion === true
                var chosen = null;
                for (var dv = 0; dv < dsDoc.values.length; dv++) {
                    var row = dsDoc.values[dv];
                    if (row.activeVersion === true || row.activeVersion === "true") {
                        chosen = row;
                        break;
                    }
                }
                // Fallback: maior documentPK.version
                if (!chosen) {
                    var sorted = dsDoc.values.slice().sort(function(a, b) {
                        var va = parseInt(a["documentPK.version"] || a.version || 0, 10) || 0;
                        var vb = parseInt(b["documentPK.version"] || b.version || 0, 10) || 0;
                        return vb - va;
                    });
                    chosen = sorted[0];
                }
                if (!chosen) return;

                // Prioridade do texto: documentDescription → cardDescription
                var text = chosen.documentDescription;
                if (!text || text === 'null' || String(text).trim() === '') {
                    text = chosen.cardDescription;
                }
                if (text && text !== 'null' && String(text).trim() !== '') {
                    map[docId] = String(text).trim();
                }
            } catch (e) {
                // Silencioso — falha em uma resolução não deve travar o widget
            }
        });

        return map;
    },

    // Retorna o nome amigável de um usuário.
    // Ordem: nome do colleague resolvido → rawName fornecido → id → fallback.
    getUserDisplayName: function(id, rawName) {
        var instance = this;
        if (id && instance.colleagueMap[id]) return instance.colleagueMap[id];
        if (rawName) return rawName;
        if (id) return id;
        return this._t('central.tarefas.filtro.solicitante');
    },

    // Reprocessa instance.requests substituindo o label do solicitante pelo nome amigável.
    // Chamado após loadColleagueNames(), pois depende do colleagueMap preenchido.
    resolveRequesterNames: function() {
        var instance = this;
        instance.requests.forEach(function(req) {
            req.requester = instance.getUserDisplayName(req.requesterId, req.requesterName);
        });
    },

    // Popula os 3 selects de filtro a partir de instance.requests
    populateFilters: function() {
        var instance = this;
        var root = $('#Central_de_tarefas_' + instance.instanceId);

        // --- SOLICITANTES ---
        // value = requesterId (chave técnica, estável); label = nome resolvido (apresentação).
        // Desacopla apresentação de regra de filtro — evita colisão por homônimos e
        // sobrevive a mudança de label depois de uma resolução tardia.
        var solicitantes = {};
        var hasNoRequesterId = false;
        instance.requests.forEach(function(r) {
            if (r.requesterId) {
                // Mantém a melhor label conhecida (já passou por resolveRequesterNames)
                if (!solicitantes[r.requesterId]) {
                    solicitantes[r.requesterId] = r.requester || r.requesterId;
                }
            } else {
                hasNoRequesterId = true;
            }
        });
        var solicitantesArr = Object.keys(solicitantes).map(function(id) {
            return { id: id, label: solicitantes[id] };
        }).sort(function(a, b) {
            return a.label.localeCompare(b.label, 'pt-BR');
        });

        var $solSelect = root.find('#filter-solicitante-' + instance.instanceId);
        $solSelect.empty();
        $solSelect.append('<option value="all">' + instance.escapeHtml(instance._t('central.tarefas.filtro.todos')) + '</option>');
        solicitantesArr.forEach(function(s) {
            $solSelect.append('<option value="' + instance.escapeHtml(s.id) + '">' + instance.escapeHtml(s.label) + '</option>');
        });
        if (hasNoRequesterId) {
            $solSelect.append('<option value="__no_requester__">' + instance.escapeHtml(instance._t('central.tarefas.filtro.sem.solicitante')) + '</option>');
        }

        // --- RESPONSÁVEIS ---
        var responsaveis = {};
        var hasUnassigned = false;
        instance.requests.forEach(function(r) {
            var ids = r.assigneeIds || [];
            if (ids.length === 0) {
                hasUnassigned = true;
            } else {
                ids.forEach(function(id) {
                    responsaveis[id] = true;
                });
            }
        });
        var responsaveisArr = Object.keys(responsaveis).map(function(id) {
            return { id: id, label: instance.colleagueMap[id] || id };
        }).sort(function(a, b) {
            return a.label.localeCompare(b.label, 'pt-BR');
        });

        var $respSelect = root.find('#filter-responsavel-' + instance.instanceId);
        $respSelect.empty();
        $respSelect.append('<option value="all">' + instance.escapeHtml(instance._t('central.tarefas.filtro.todos')) + '</option>');
        responsaveisArr.forEach(function(r) {
            $respSelect.append('<option value="' + instance.escapeHtml(r.id) + '">' + instance.escapeHtml(r.label) + '</option>');
        });
        if (hasUnassigned) {
            $respSelect.append('<option value="__unassigned__">' + instance.escapeHtml(instance._t('central.tarefas.filtro.nao.atribuido')) + '</option>');
        }

        // --- CATEGORIAS ---
        var categorias = {};
        var hasNoneCategory = false;
        instance.requests.forEach(function(r) {
            if (r.categoryId) {
                if (!categorias[r.categoryId]) {
                    categorias[r.categoryId] = r.categoryLabel || instance.categoryLabelMap[r.categoryId] || r.categoryId;
                }
            } else {
                hasNoneCategory = true;
            }
        });
        var categoriasArr = Object.keys(categorias).map(function(id) {
            return { id: id, label: categorias[id] };
        }).sort(function(a, b) {
            return a.label.localeCompare(b.label, 'pt-BR');
        });

        var $catSelect = root.find('#filter-categoria-' + instance.instanceId);
        $catSelect.empty();
        $catSelect.append('<option value="all">' + instance.escapeHtml(instance._t('central.tarefas.filtro.todas')) + '</option>');
        categoriasArr.forEach(function(c) {
            $catSelect.append('<option value="' + instance.escapeHtml(c.id) + '">' + instance.escapeHtml(c.label) + '</option>');
        });
        if (hasNoneCategory) {
            $catSelect.append('<option value="__none__">' + instance.escapeHtml(instance._t('central.tarefas.filtro.sem.categoria')) + '</option>');
        }

        instance.updateFiltersBarUI();
    },

    // Renderiza estado vazio inicial (após loadData). Mostra mensagem amigável
    // distinguindo 3 cenários: erro de carregamento, ambiente Fluig ausente, vazio legítimo.
    // O caso de "vazio por filtro" (filtro aplicado zera resultado) é tratado em selectStatus.
    renderEmptyState: function() {
        var instance = this;
        var $box = $('#empty-state-' + instance.instanceId);
        if ($box.length === 0) return;

        // Há solicitações → esconder qualquer estado vazio ativo
        if (instance.requests.length > 0 && instance._loadStatus === 'ok') {
            $box.addClass('d-none').removeClass('is-error');
            return;
        }

        var title, subtitle, isError = false;

        if (instance._loadStatus === 'error') {
            isError = true;
            title = instance._t('central.tarefas.estado.erro.titulo');
            subtitle = instance._t('central.tarefas.estado.erro.subtitulo');
        } else if (instance._loadStatus === 'no-env') {
            title = instance._t('central.tarefas.estado.sem.ambiente.titulo');
            subtitle = instance._t('central.tarefas.estado.sem.ambiente.subtitulo');
        } else {
            title = instance._t('central.tarefas.estado.vazio.titulo');
            subtitle = instance._t('central.tarefas.estado.vazio.subtitulo');
        }

        $box.toggleClass('is-error', isError);
        $box.find('.empty-state-title').text(title);
        $box.find('.empty-state-subtitle').text(subtitle);
        $box.removeClass('d-none');

        // Garante que carrossel e Kanban fiquem ocultos no estado vazio inicial
        $('#carousel-section-' + instance.instanceId).addClass('d-none');
        $('#kanban-section-' + instance.instanceId).addClass('d-none');
    },

    // Escapa HTML para uso seguro em option values e labels
    escapeHtml: function(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    // Retorna lista filtrada por filtros base (solicitante + responsavel + categoria)
    // SEM mutar instance.requests
    getFilteredRequests: function() {
        var instance = this;
        var f = instance.filters;
        return instance.requests.filter(function(req) {
            // Solicitante — compara por requesterId (chave técnica), não por label visual.
            // value especial '__no_requester__' filtra solicitações sem requesterId.
            if (f.solicitante !== 'all') {
                if (f.solicitante === '__no_requester__') {
                    if (req.requesterId) return false;
                } else {
                    if (req.requesterId !== f.solicitante) return false;
                }
            }
            // Responsável
            if (f.responsavel !== 'all') {
                var ids = req.assigneeIds || [];
                if (f.responsavel === '__unassigned__') {
                    if (ids.length > 0) return false;
                } else {
                    if (ids.indexOf(f.responsavel) === -1) return false;
                }
            }
            // Categoria
            if (f.categoria !== 'all') {
                if (f.categoria === '__none__') {
                    if (req.categoryId) return false;
                } else {
                    if (req.categoryId !== f.categoria) return false;
                }
            }
            return true;
        });
    },

    // Re-renderiza tudo (KPIs, carrossel, kanban) respeitando os filtros atuais.
    // É lateral change — preserva a busca textual digitada.
    applyFiltersAndRefresh: function() {
        var instance = this;

        instance.renderKPIs();
        instance.updateFiltersBarUI();

        // Se tinha um status selecionado, regenera o carrossel SEM resetar a busca textual
        if (instance.currentStatus) {
            instance.selectStatus(instance.currentStatus, { resetSearch: false });
        }
    },

    // Mostra/oculta botão "Limpar Filtros" e renderiza chips de filtros ativos
    updateFiltersBarUI: function() {
        var instance = this;
        var root = $('#Central_de_tarefas_' + instance.instanceId);
        var $btn = $('#clear-filters-' + instance.instanceId);
        var $chipsContainer = root.find('#active-filters-chips-' + instance.instanceId);

        var chips = [];

        if (instance.filters.solicitante !== 'all') {
            var solValue = instance.filters.solicitante;
            var solLabel;
            if (solValue === '__no_requester__') {
                solLabel = instance._t('central.tarefas.filtro.sem.solicitante');
            } else {
                // Procura o primeiro request com este requesterId para obter o label resolvido
                var match = instance.requests.find(function(r) { return r.requesterId === solValue; });
                solLabel = (match && match.requester) || instance.colleagueMap[solValue] || solValue;
            }
            chips.push({
                key: 'solicitante',
                label: instance._t('central.tarefas.filtro.solicitante'),
                value: solLabel
            });
        }
        if (instance.filters.responsavel !== 'all') {
            var respValue = instance.filters.responsavel;
            var respLabel = respValue === '__unassigned__'
                ? instance._t('central.tarefas.filtro.nao.atribuido')
                : (instance.colleagueMap[respValue] || respValue);
            chips.push({
                key: 'responsavel',
                label: instance._t('central.tarefas.filtro.responsavel'),
                value: respLabel
            });
        }
        if (instance.filters.categoria !== 'all') {
            var catValue = instance.filters.categoria;
            var catLabel = catValue === '__none__'
                ? instance._t('central.tarefas.filtro.sem.categoria')
                : (instance.categoryLabelMap[catValue] || catValue);
            chips.push({
                key: 'categoria',
                label: instance._t('central.tarefas.filtro.categoria'),
                value: catLabel
            });
        }
        if (instance.currentStatus) {
            var statusLabels = instance._getStatusLabels();
            chips.push({
                key: 'status',
                label: instance._t('central.tarefas.filtro.status'),
                value: statusLabels[instance.currentStatus] || instance.currentStatus
            });
        }

        // Renderiza chips (vazio → CSS esconde via :empty)
        $chipsContainer.empty();
        chips.forEach(function(chip) {
            var chipHtml =
                '<span class="filter-chip" data-chip-key="' + instance.escapeHtml(chip.key) + '">' +
                    '<span class="filter-chip-label">' + instance.escapeHtml(chip.label) + ':</span>' +
                    '<span class="filter-chip-value">' + instance.escapeHtml(chip.value) + '</span>' +
                    '<button type="button" class="filter-chip-remove" aria-label="' + instance.escapeHtml(instance._format(instance._t('central.tarefas.filtro.remover'), [chip.label])) + '">&times;</button>' +
                '</span>';
            $chipsContainer.append(chipHtml);
        });

        // Botão Limpar visível se houver pelo menos 1 filtro ativo
        if (chips.length > 0) {
            $btn.removeClass('d-none');
        } else {
            $btn.addClass('d-none');
        }
    },

    // Remove um filtro específico (chamado pelo × do chip)
    removeFilter: function(key) {
        var instance = this;
        var root = $('#Central_de_tarefas_' + instance.instanceId);

        if (key === 'status') {
            // Remover o status é drilling-out: reseta status + processo + busca textual.
            // Filtros base (solicitante/responsavel/categoria) permanecem.
            instance.currentStatus = null;
            instance.currentProcess = null;
            instance.carouselIndex = 0;
            root.find('[data-status-card]').removeClass('active');
            root.find('#kanban-search-' + instance.instanceId).val('');
            $('#carousel-section-' + instance.instanceId).addClass('d-none');
            $('#kanban-section-' + instance.instanceId).addClass('d-none');
            instance.renderKPIs();
            instance.updateFiltersBarUI();
            instance.renderEmptyState();
        } else if (instance.filters.hasOwnProperty(key)) {
            instance.filters[key] = 'all';
            root.find('#filter-' + key + '-' + instance.instanceId).val('all');
            instance.applyFiltersAndRefresh();
        }
    },

    // Reseta TODOS os filtros e estados, voltando ao carregamento inicial
    clearAllFilters: function() {
        var instance = this;

        instance.filters = { solicitante: 'all', responsavel: 'all', categoria: 'all' };
        instance.currentStatus = null;
        instance.currentProcess = null;
        instance.carouselIndex = 0;

        var root = $('#Central_de_tarefas_' + instance.instanceId);
        root.find('.filter-select').val('all');
        root.find('#kanban-search-' + instance.instanceId).val('');
        root.find('[data-status-card]').removeClass('active');

        $('#carousel-section-' + instance.instanceId).addClass('d-none');
        $('#kanban-section-' + instance.instanceId).addClass('d-none');

        instance.renderKPIs();
        instance.updateFiltersBarUI();
        instance.renderEmptyState();
    },

    // Renders totals into the status KPI cards
    renderKPIs: function() {
        var instance = this;
        var baseRequests = instance.getFilteredRequests();

        var totals = {
            andamento: 0,
            concluidas: 0,
            atrasados: 0,
            geral: baseRequests.length
        };

        baseRequests.forEach(function(req) {
            if (totals[req.status] !== undefined) {
                totals[req.status]++;
            }
        });

        $('#count-andamento-' + instance.instanceId).text(totals.andamento);
        $('#count-concluidas-' + instance.instanceId).text(totals.concluidas);
        $('#count-atrasados-' + instance.instanceId).text(totals.atrasados);
        $('#count-geral-' + instance.instanceId).text(totals.geral);
    },

    // Executed when user clicks on a KPI card.
    // options.resetSearch (default true) — define se a busca textual deve ser limpa.
    // Click manual em KPI = drill-down novo (resetSearch=true).
    // Re-render por mudança de filtro base = lateral change (resetSearch=false).
    selectStatus: function(status, options) {
        var instance = this;
        var resetSearch = !options || options.resetSearch !== false;
        instance.currentStatus = status;
        instance.carouselIndex = 0;

        // Ao entrar em drill-down via KPI, esconde o estado vazio inicial.
        // (O caso "vazio por filtro" é mostrado dentro do carrossel logo abaixo.)
        $('#empty-state-' + instance.instanceId).addClass('d-none');

        // Toggle active visual class on KPI cards
        var root = $('#Central_de_tarefas_' + instance.instanceId);
        root.find('[data-status-card]').removeClass('active');
        root.find('[data-status-card="' + status + '"]').addClass('active');

        // Update Carousel Title
        var statusLabels = instance._getStatusLabels('carousel');
        $('#selected-status-label-' + instance.instanceId).text(statusLabels[status]);

        instance.updateFiltersBarUI();

        // Fonte: requests JÁ filtrados por filtros base
        var baseRequests = instance.getFilteredRequests();

        // Filter requests based on status
        var filteredRequests = baseRequests.filter(function(r) {
            return status === 'geral' || r.status === status;
        });

        // Group filtered requests by Process
        var processGroupMap = {};
        filteredRequests.forEach(function(req) {
            if (!processGroupMap[req.processId]) {
                processGroupMap[req.processId] = {
                    id: req.processId,
                    name: req.processName,
                    count: 0
                };
            }
            processGroupMap[req.processId].count++;
        });

        var processes = [];
        for (var key in processGroupMap) {
            if (processGroupMap.hasOwnProperty(key)) {
                // Progresso usa base filtrada para coerência
                var totalProcRequests = baseRequests.filter(function(r) { return r.processId === key; });
                var completedProcRequests = totalProcRequests.filter(function(r) { return r.status === 'concluidas'; });
                var progressPct = totalProcRequests.length > 0 ? Math.round((completedProcRequests.length / totalProcRequests.length) * 100) : 0;

                var proc = processGroupMap[key];
                proc.progressPct = progressPct;
                processes.push(proc);
            }
        }

        // Render the Carousel process cards
        var track = $('#carousel-track-' + instance.instanceId);
        track.empty();
        track.css('transform', 'translateX(0px)');

        if (processes.length === 0) {
            // Distingue "filtros base zeraram a lista inteira" vs "este status específico não tem processo".
            // baseRequests = pós-filtros base; se vazio mesmo com requests originais cheias = filtro zerou tudo.
            var hasAnyData = instance.requests.length > 0;
            var hasAnyAfterBaseFilters = baseRequests.length > 0;
            var emptyMsg;
            if (hasAnyData && !hasAnyAfterBaseFilters) {
                emptyMsg = instance._t('central.tarefas.empty.filtros');
            } else {
                emptyMsg = instance._t('central.tarefas.empty.processos.status');
            }
            track.append('<div style="padding: 20px; color: var(--text-muted); width: 100%; text-align: center; font-weight: 500;">' + instance.escapeHtml(emptyMsg) + '</div>');
            $('#carousel-section-' + instance.instanceId).removeClass('d-none');
            $('#kanban-section-' + instance.instanceId).addClass('d-none');

            $('#carousel-prev-' + instance.instanceId).prop('disabled', true);
            $('#carousel-next-' + instance.instanceId).prop('disabled', true);
            return;
        }

        processes.forEach(function(proc) {
            var cardHtml =
                '<div class="process-card" data-process-id="' + instance.escapeHtml(proc.id) + '">' +
                    '<div class="process-card-header">' +
                        '<span class="process-name" title="' + instance.escapeHtml(proc.name) + '">' + instance.escapeHtml(proc.name) + '</span>' +
                        '<span class="process-count-badge">' + proc.count + '</span>' +
                    '</div>' +
                '</div>';
            track.append(cardHtml);
        });

        $('#carousel-section-' + instance.instanceId).removeClass('d-none');
        instance.updateCarouselButtonsState();

        // Tenta preservar o processo selecionado anterior; se não estiver mais disponível, seleciona o primeiro.
        // resetSearch propaga o que foi decidido em selectStatus (click manual reseta; re-render interno preserva).
        var prevProcess = instance.currentProcess;
        var processIds = processes.map(function(p) { return p.id; });
        if (prevProcess && processIds.indexOf(prevProcess) !== -1) {
            instance.selectProcess(prevProcess, { resetSearch: resetSearch });
        } else {
            instance.selectProcess(processes[0].id, { resetSearch: resetSearch });
        }
    },

    // Handles the selection of a process from the carousel track.
    // options.resetSearch (default true) controla se o input de busca é limpo.
    // Em re-renders internos (mudança de filtro base) passamos false para preservar a busca.
    selectProcess: function(processId, options) {
        var instance = this;
        var resetSearch = !options || options.resetSearch !== false;

        instance.currentProcess = processId;

        var track = $('#carousel-track-' + instance.instanceId);
        track.find('.process-card').removeClass('active');
        track.find('[data-process-id="' + processId + '"]').addClass('active');

        // Busca o nome do processo na lista filtrada (cai para requests originais se não achar)
        var baseRequests = instance.getFilteredRequests();
        var processCard = baseRequests.find(function(r) { return r.processId === processId; })
                       || instance.requests.find(function(r) { return r.processId === processId; });
        var processName = processCard ? processCard.processName : processId;

        $('#selected-process-label-' + instance.instanceId).text(processName);

        if (resetSearch) {
            $('#kanban-search-' + instance.instanceId).val('');
        }

        $('#kanban-section-' + instance.instanceId).removeClass('d-none');

        instance.renderKanban();
    },

    // Helper to get workflow activity list
    getProcessActivities: function(processId) {
        var instance = this;

        // Cache hit — evita chamada do dataset processState a cada renderKanban/selectProcess.
        // Atividades de um processo são estruturais (diagrama BPM) e não mudam em runtime.
        if (instance._processStateCache && instance._processStateCache.hasOwnProperty(processId)) {
            instance._perfCount('processState.cacheHit');
            return instance._processStateCache[processId];
        }

        var activities = [];

        // 1. Tenta buscar do Fluig se estiver no ambiente usando o dataset processState
        if (typeof DatasetFactory !== 'undefined' && typeof WCMAPI !== 'undefined') {
            try {
                var constraints = [];
                constraints.push(DatasetFactory.createConstraint("processStatePK.processId", processId, processId, ConstraintType.MUST));

                var companyId = WCMAPI.getCompanyId ? WCMAPI.getCompanyId() : (WCMAPI.organizationId || "1");
                constraints.push(DatasetFactory.createConstraint("processStatePK.companyId", companyId, companyId, ConstraintType.MUST));
                constraints.push(DatasetFactory.createConstraint("automatic", false, false, ConstraintType.MUST));

                instance._perfCount('dataset.processState');
                var dsProcessState = DatasetFactory.getDataset("processState", null, constraints, null);

                if (dsProcessState && dsProcessState.values && dsProcessState.values.length > 0) {
                    var values = dsProcessState.values.slice();

                    values.sort(function(a, b) {
                        var seqA = parseInt(a["processStatePK.sequence"] || a.sequence || 0);
                        var seqB = parseInt(b["processStatePK.sequence"] || b.sequence || 0);
                        return seqA - seqB;
                    });

                    var seen = {};
                    values.forEach(function(row) {
                        var desc = row.stateName || row.stateDescription;
                        var seq = parseInt(row["processStatePK.sequence"] || row.sequence || 0);

                        if (desc && desc.trim() !== "" && seq > 0) {
                            var normalizedDesc = desc.trim().toUpperCase();
                            if (!seen[normalizedDesc]) {
                                seen[normalizedDesc] = true;
                                activities.push(desc.trim());
                            }
                        }
                    });
                }
            } catch (e) {
                console.error("Erro ao buscar atividades via dataset processState:", e);
            }
        }

        // 2. Fallback estático (vazio hoje)
        if (activities.length === 0) {
            var maps = {};
            activities = maps[processId] || [];
        }

        // 3. Fallback dinâmico: varre solicitações históricas (usa requests originais, não filtradas — atividades do processo são propriedade dele, não do filtro)
        if (activities.length === 0) {
            var acts = [];
            var allProcessRequests = instance.requests.filter(function(r) {
                return r.processId === processId;
            });
            var seenFallback = {};
            allProcessRequests.forEach(function(r) {
                if (r.currentActivity) {
                    var normalizedDesc = r.currentActivity.trim().toUpperCase();
                    if (!seenFallback[normalizedDesc]) {
                        seenFallback[normalizedDesc] = true;
                        acts.push(r.currentActivity.trim());
                    }
                }
            });
            activities = acts;
        }

        // Memoiza por processId (incluindo array vazio — consistência entre chamadas).
        if (instance._processStateCache) {
            instance._processStateCache[processId] = activities;
        }

        return activities;
    },

    // Renders the Kanban Board columns and inserts filtered request cards
    renderKanban: function() {
        var instance = this;
        var processId = instance.currentProcess;
        var status = instance.currentStatus;
        var _renderT0 = instance._perfNow();

        var board = $('#kanban-board-' + instance.instanceId);
        board.empty();

        if (!processId) {
            if (instance.debugPerf) {
                console.log('[CentralTarefas][perf] renderKanban (skip): ' + Math.round(instance._perfNow() - _renderT0) + 'ms');
            }
            return;
        }

        // Fonte: requests JÁ filtrados por filtros base
        var baseRequests = instance.getFilteredRequests();

        // Filter requests by current selected process
        var processRequests = baseRequests.filter(function(r) {
            return r.processId === processId;
        });

        // Filter requests further based on the selected Status
        var statusRequests = processRequests.filter(function(r) {
            return status === 'geral' || !status || r.status === status;
        });

        // Apply real-time text Search Filter
        var searchQuery = $('#kanban-search-' + instance.instanceId).val();
        var finalRequests = statusRequests;
        if (searchQuery && searchQuery.trim() !== '') {
            var q = searchQuery.toLowerCase().trim();
            finalRequests = statusRequests.filter(function(r) {
                return r.id.toLowerCase().indexOf(q) !== -1 ||
                       (r.requester || '').toLowerCase().indexOf(q) !== -1 ||
                       (r.descriptor || '').toLowerCase().indexOf(q) !== -1 ||
                       (r.description || '').toLowerCase().indexOf(q) !== -1;
            });
        }

        // Update total counter in Kanban badge
        $('#kanban-total-requests-' + instance.instanceId).text(finalRequests.length + (finalRequests.length === 1
            ? ' ' + instance._t('central.tarefas.contador.solicitacao.singular')
            : ' ' + instance._t('central.tarefas.contador.solicitacao.plural')));

        // Retrieve the ordered workflow activities for this process
        var activities = instance.getProcessActivities(processId);

        if (activities.length === 0) {
            board.append('<div style="padding: 20px; color: var(--text-muted); width: 100%; text-align: center;">' + instance.escapeHtml(instance._t('central.tarefas.empty.atividade')) + '</div>');
            return;
        }

        // Generate columns for each activity
        activities.forEach(function(activity) {
            var activityRequests = finalRequests.filter(function(req) {
                var reqAct = (req.currentActivity || "").trim().toUpperCase();
                var colAct = activity.trim().toUpperCase();

                if (reqAct === colAct) {
                    return true;
                }
                var isLastActivity = (activities.indexOf(activity) === activities.length - 1);
                if (isLastActivity && req.status === "concluidas") {
                    var matchesOther = activities.some(function(act) {
                        var otherColAct = act.trim().toUpperCase();
                        return act !== activity && reqAct === otherColAct;
                    });
                    return !matchesOther;
                }
                return false;
            });

            var colId = 'kanban-col-' + instance.instanceId + '-' + activity.replace(/\s+/g, '-');
            var colHtml =
                '<div class="kanban-column" id="' + colId + '">' +
                    '<div class="column-header">' +
                        '<span class="column-title" title="' + instance.escapeHtml(activity) + '">' + instance.escapeHtml(activity) + '</span>' +
                        '<span class="column-badge">' + activityRequests.length + '</span>' +
                    '</div>' +
                    '<div class="column-cards-container">';

            if (activityRequests.length === 0) {
                colHtml += '<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 16px 0; border: 1px dashed var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-card);">' + instance.escapeHtml(instance._t('central.tarefas.empty.solicitacao')) + '</div>';
            } else {
                activityRequests.forEach(function(req) {
                    var prioClass = 'priority-' + (req.priority || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    // Padroniza para singular (CSS usa .status-andamento, .status-concluido, .status-atrasado)
                    var statusKeyMap = { 'concluidas': 'concluido', 'atrasados': 'atrasado' };
                    var statusClass = 'status-' + (statusKeyMap[req.status] || req.status);
                    var isAtrasado = req.status === 'atrasados';

                    // Respons\u00e1vel: resolve nome amig\u00e1vel do primeiro assignee (se houver)
                    var respId = (req.assigneeIds && req.assigneeIds.length > 0) ? req.assigneeIds[0] : null;
                    var respName = respId ? instance.getUserDisplayName(respId, null) : instance._t('central.tarefas.filtro.nao.atribuido');
                    var respExtra = (req.assigneeIds && req.assigneeIds.length > 1)
                        ? ' +' + (req.assigneeIds.length - 1) : '';

                    colHtml +=
                        '<div class="kanban-card kanban-card-clickable ' + statusClass + '" ' +
                            'data-process-instance="' + instance.escapeHtml(req.processInstanceId) + '" ' +
                            'data-process-id="' + instance.escapeHtml(req.processId) + '" ' +
                            'tabindex="0" role="button" ' +
                            'title="' + instance.escapeHtml(instance._format(instance._t('central.tarefas.tooltip.abrir.solicitacao'), [req.id])) + '">' +
	                            '<div class="card-header-info">' +
	                                '<span class="card-id">' +
	                                    instance.escapeHtml(req.id) +
	                                '</span>' +
                                '<span class="card-date">' + instance.escapeHtml(req.date) + '</span>' +
                            '</div>' +
                            (isAtrasado
                                ? '<span class="card-atraso-badge">' +
                                      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="card-atraso-icon">' +
                                          '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>' +
                                          '<line x1="12" y1="9" x2="12" y2="13"></line>' +
                                          '<line x1="12" y1="17" x2="12.01" y2="17"></line>' +
                                      '</svg>' + instance.escapeHtml(instance._t('central.tarefas.badge.atrasado')) + '</span>'
                                : '') +
                            '<p class="card-description">' + instance.escapeHtml(req.descriptor || req.description) + '</p>' +
                            '<div class="card-assignee" title="' + instance.escapeHtml(instance._format(instance._t('central.tarefas.tooltip.responsavel'), [respName + respExtra])) + '">' +
                                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="card-assignee-icon">' +
                                    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
                                    '<circle cx="12" cy="7" r="4"></circle>' +
                                '</svg>' +
                                '<span class="card-assignee-name">' + instance.escapeHtml(respName) + respExtra + '</span>' +
                            '</div>' +
                            '<div class="card-footer-info">' +
                                '<span class="card-requester" title="' + instance.escapeHtml(instance._format(instance._t('central.tarefas.tooltip.solicitante'), [req.requester])) + '">' + instance.escapeHtml(req.requester) + '</span>' +
                                '<span class="priority-badge ' + prioClass + '">' + instance.escapeHtml(req.priority) + '</span>' +
                            '</div>' +
                        '</div>';
                });
            }

            colHtml += '</div></div>';
            board.append(colHtml);
        });

        if (instance.debugPerf) {
            console.log('[CentralTarefas][perf] renderKanban (' + activities.length + ' cols, ' + finalRequests.length + ' reqs): ' + Math.round(instance._perfNow() - _renderT0) + 'ms');
        }
    },

    // Slides the carousel track horizontally
    slideCarousel: function(direction) {
        var instance = this;
        var track = $('#carousel-track-' + instance.instanceId);
        var cards = track.find('.process-card');
        if (cards.length === 0) return;

        var containerWidth = $('.carousel-track-container').width();
        var cardWidth = cards.first().outerWidth(true);

        var visibleCount = Math.floor(containerWidth / cardWidth) || 1;
        var maxIndex = Math.max(0, cards.length - visibleCount);

        if (direction === 'next') {
            instance.carouselIndex = Math.min(instance.carouselIndex + 1, maxIndex);
        } else {
            instance.carouselIndex = Math.max(instance.carouselIndex - 1, 0);
        }

        var translateValue = -(instance.carouselIndex * cardWidth);
        track.css('transform', 'translateX(' + translateValue + 'px)');

        instance.updateCarouselButtonsState();
    },

    // Updates disabled state of carousel buttons
    updateCarouselButtonsState: function() {
        var instance = this;
        var track = $('#carousel-track-' + instance.instanceId);
        var cards = track.find('.process-card');

        if (cards.length === 0) {
            $('#carousel-prev-' + instance.instanceId).prop('disabled', true);
            $('#carousel-next-' + instance.instanceId).prop('disabled', true);
            return;
        }

        var containerWidth = $('.carousel-track-container').width();
        var cardWidth = cards.first().outerWidth(true) || 280;

        var visibleCount = Math.floor(containerWidth / cardWidth) || 1;
        var maxIndex = Math.max(0, cards.length - visibleCount);

        $('#carousel-prev-' + instance.instanceId).prop('disabled', instance.carouselIndex === 0);
        $('#carousel-next-' + instance.instanceId).prop('disabled', instance.carouselIndex >= maxIndex);
    }
});
