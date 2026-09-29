<#ftl encoding="UTF-8">
<meta charset="UTF-8">
<script type="application/javascript" src="/webdesk/vcXMLRPC.js" charset="utf-8"></script>
<div id="Central_de_tarefas_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide" data-params="Central_de_tarefas.instance()">
    <div id="central-tarefas-i18n-${instanceId}" class="d-none" aria-hidden="true">
        <span data-i18n-key="central.tarefas.abrindo.solicitacao">${i18n.getTranslation('central.tarefas.abrindo.solicitacao')}</span>
        <span data-i18n-key="central.tarefas.badge.atrasado">${i18n.getTranslation('central.tarefas.badge.atrasado')}</span>
        <span data-i18n-key="central.tarefas.console.erro.navegar.solicitacao">${i18n.getTranslation('central.tarefas.console.erro.navegar.solicitacao')}</span>
        <span data-i18n-key="central.tarefas.contador.solicitacao.plural">${i18n.getTranslation('central.tarefas.contador.solicitacao.plural')}</span>
        <span data-i18n-key="central.tarefas.contador.solicitacao.singular">${i18n.getTranslation('central.tarefas.contador.solicitacao.singular')}</span>
        <span data-i18n-key="central.tarefas.empty.atividade">${i18n.getTranslation('central.tarefas.empty.atividade')}</span>
        <span data-i18n-key="central.tarefas.empty.filtros">${i18n.getTranslation('central.tarefas.empty.filtros')}</span>
        <span data-i18n-key="central.tarefas.empty.processos.status">${i18n.getTranslation('central.tarefas.empty.processos.status')}</span>
        <span data-i18n-key="central.tarefas.empty.solicitacao">${i18n.getTranslation('central.tarefas.empty.solicitacao')}</span>
        <span data-i18n-key="central.tarefas.estado.erro.subtitulo">${i18n.getTranslation('central.tarefas.estado.erro.subtitulo')}</span>
        <span data-i18n-key="central.tarefas.estado.erro.titulo">${i18n.getTranslation('central.tarefas.estado.erro.titulo')}</span>
        <span data-i18n-key="central.tarefas.estado.sem.ambiente.subtitulo">${i18n.getTranslation('central.tarefas.estado.sem.ambiente.subtitulo')}</span>
        <span data-i18n-key="central.tarefas.estado.sem.ambiente.titulo">${i18n.getTranslation('central.tarefas.estado.sem.ambiente.titulo')}</span>
        <span data-i18n-key="central.tarefas.estado.vazio.subtitulo">${i18n.getTranslation('central.tarefas.estado.vazio.subtitulo')}</span>
        <span data-i18n-key="central.tarefas.estado.vazio.titulo">${i18n.getTranslation('central.tarefas.estado.vazio.titulo')}</span>
        <span data-i18n-key="central.tarefas.filtro.categoria">${i18n.getTranslation('central.tarefas.filtro.categoria')}</span>
        <span data-i18n-key="central.tarefas.filtro.nao.atribuido">${i18n.getTranslation('central.tarefas.filtro.nao.atribuido')}</span>
        <span data-i18n-key="central.tarefas.filtro.remover">${i18n.getTranslation('central.tarefas.filtro.remover')}</span>
        <span data-i18n-key="central.tarefas.filtro.responsavel">${i18n.getTranslation('central.tarefas.filtro.responsavel')}</span>
        <span data-i18n-key="central.tarefas.filtro.sem.categoria">${i18n.getTranslation('central.tarefas.filtro.sem.categoria')}</span>
        <span data-i18n-key="central.tarefas.filtro.sem.solicitante">${i18n.getTranslation('central.tarefas.filtro.sem.solicitante')}</span>
        <span data-i18n-key="central.tarefas.filtro.solicitante">${i18n.getTranslation('central.tarefas.filtro.solicitante')}</span>
        <span data-i18n-key="central.tarefas.filtro.status">${i18n.getTranslation('central.tarefas.filtro.status')}</span>
        <span data-i18n-key="central.tarefas.filtro.todas">${i18n.getTranslation('central.tarefas.filtro.todas')}</span>
        <span data-i18n-key="central.tarefas.filtro.todos">${i18n.getTranslation('central.tarefas.filtro.todos')}</span>
        <span data-i18n-key="central.tarefas.prioridade.alta">${i18n.getTranslation('central.tarefas.prioridade.alta')}</span>
        <span data-i18n-key="central.tarefas.prioridade.baixa">${i18n.getTranslation('central.tarefas.prioridade.baixa')}</span>
        <span data-i18n-key="central.tarefas.prioridade.media">${i18n.getTranslation('central.tarefas.prioridade.media')}</span>
        <span data-i18n-key="central.tarefas.processo.atividade">${i18n.getTranslation('central.tarefas.processo.atividade')}</span>
        <span data-i18n-key="central.tarefas.processo.finalizado">${i18n.getTranslation('central.tarefas.processo.finalizado')}</span>
        <span data-i18n-key="central.tarefas.kanban.finalizadas">${i18n.getTranslation('central.tarefas.kanban.finalizadas')}</span>
        <span data-i18n-key="central.tarefas.kanban.rascunho">${i18n.getTranslation('central.tarefas.kanban.rascunho')}</span>
        <span data-i18n-key="central.tarefas.processo.inicio">${i18n.getTranslation('central.tarefas.processo.inicio')}</span>
        <span data-i18n-key="central.tarefas.processo.nome.analysisiftheprojectshouldbedeveloped">${i18n.getTranslation('central.tarefas.processo.nome.analysisiftheprojectshouldbedeveloped')}</span>
        <span data-i18n-key="central.tarefas.solicitacao.descricao">${i18n.getTranslation('central.tarefas.solicitacao.descricao')}</span>
        <span data-i18n-key="central.tarefas.status.andamento">${i18n.getTranslation('central.tarefas.status.andamento')}</span>
        <span data-i18n-key="central.tarefas.status.atrasadas">${i18n.getTranslation('central.tarefas.status.atrasadas')}</span>
        <span data-i18n-key="central.tarefas.status.concluidas">${i18n.getTranslation('central.tarefas.status.concluidas')}</span>
        <span data-i18n-key="central.tarefas.status.gerais.tudo">${i18n.getTranslation('central.tarefas.status.gerais.tudo')}</span>
        <span data-i18n-key="central.tarefas.status.geral">${i18n.getTranslation('central.tarefas.status.geral')}</span>
        <span data-i18n-key="central.tarefas.tooltip.abrir.solicitacao">${i18n.getTranslation('central.tarefas.tooltip.abrir.solicitacao')}</span>
        <span data-i18n-key="central.tarefas.tooltip.responsavel">${i18n.getTranslation('central.tarefas.tooltip.responsavel')}</span>
        <span data-i18n-key="central.tarefas.tooltip.solicitante">${i18n.getTranslation('central.tarefas.tooltip.solicitante')}</span>
    </div>
    <div class="task-dashboard-container">
        <!-- Dashboard Header -->
        <header class="dashboard-header">
            <button id="btn-nova-solicitacao" data-nova-sol class="btn btn-primary" style="float: right;">
                <i class="fas fa-plus"></i>${i18n.getTranslation('central.tarefas.botao.nova.solicitacao')}
            </button>
            <div class="dashboard-header-text">
                <h1 class="dashboard-title">${i18n.getTranslation('central.tarefas.titulo')}</h1>
                <p class="dashboard-subtitle">${i18n.getTranslation('central.tarefas.subtitulo')}</p>
            </div>
        </header>

        <!-- Filters Bar (solicitante, responsável, categoria) -->
        <div class="filters-bar">
            <div class="filter-group">
                <label class="filter-label" for="filter-solicitante-${instanceId}">${i18n.getTranslation('central.tarefas.filtro.solicitante')}</label>
                <select id="filter-solicitante-${instanceId}" class="filter-select" data-filter-key="solicitante">
                    <option value="all">${i18n.getTranslation('central.tarefas.filtro.todos')}</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label" for="filter-responsavel-${instanceId}">${i18n.getTranslation('central.tarefas.filtro.responsavel')}</label>
                <select id="filter-responsavel-${instanceId}" class="filter-select" data-filter-key="responsavel">
                    <option value="all">${i18n.getTranslation('central.tarefas.filtro.todos')}</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label" for="filter-categoria-${instanceId}">${i18n.getTranslation('central.tarefas.filtro.categoria')}</label>
                <select id="filter-categoria-${instanceId}" class="filter-select" data-filter-key="categoria">
                    <option value="all">${i18n.getTranslation('central.tarefas.filtro.todas')}</option>
                </select>
            </div>
            <button type="button" id="clear-filters-${instanceId}" class="clear-filters-btn d-none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="clear-filters-icon">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                ${i18n.getTranslation('central.tarefas.botao.limpar.filtros')}
            </button>
        </div>

        <!-- Active Filters Chips (preenchido dinamicamente, esconde quando vazio via CSS) -->
        <div id="active-filters-chips-${instanceId}" class="active-filters-chips"></div>

        <!-- KPI Grid with 4 Status Cards -->
        <div class="kpi-grid">
            <!-- Box: Em Andamento -->
            <div class="kpi-card card-blue" data-status-card="andamento">
                <div class="kpi-content">
                    <div class="kpi-icon-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="kpi-icon">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <div class="kpi-info">
                        <span class="kpi-title">${i18n.getTranslation('central.tarefas.status.andamento')}</span>
                        <span class="kpi-counter" id="count-andamento-${instanceId}">0</span>
                    </div>
                </div>
                <div class="kpi-footer-bar"></div>
            </div>

            <!-- Box: Concluídos -->
            <div class="kpi-card card-green" data-status-card="concluidas">
                <div class="kpi-content">
                    <div class="kpi-icon-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="kpi-icon">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <div class="kpi-info">
                        <span class="kpi-title">${i18n.getTranslation('central.tarefas.status.concluidos')}</span>
                        <span class="kpi-counter" id="count-concluidas-${instanceId}">0</span>
                    </div>
                </div>
                <div class="kpi-footer-bar"></div>
            </div>

            <!-- Box: Atrasados -->
            <div class="kpi-card card-red" data-status-card="atrasados">
                <div class="kpi-content">
                    <div class="kpi-icon-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="kpi-icon">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <div class="kpi-info">
                        <span class="kpi-title">${i18n.getTranslation('central.tarefas.status.atrasados')}</span>
                        <span class="kpi-counter" id="count-atrasados-${instanceId}">0</span>
                    </div>
                </div>
                <div class="kpi-footer-bar"></div>
            </div>

            <!-- Box: Geral -->
            <div class="kpi-card card-purple" data-status-card="geral">
                <div class="kpi-content">
                    <div class="kpi-icon-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="kpi-icon">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                    <div class="kpi-info">
                        <span class="kpi-title">${i18n.getTranslation('central.tarefas.status.geral.total')}</span>
                        <span class="kpi-counter" id="count-geral-${instanceId}">0</span>
                    </div>
                </div>
                <div class="kpi-footer-bar"></div>
            </div>
        </div>

        <!-- Carousel Section -->
        <div class="carousel-section d-none" id="carousel-section-${instanceId}">
            <div class="section-header">
                <h3 class="section-title">
                    <span class="title-decorator"></span>
                    ${i18n.getTranslation('central.tarefas.secao.processos')} <span id="selected-status-label-${instanceId}"></span>
                </h3>
            </div>
            
            <div class="carousel-wrapper">
                <button class="carousel-btn prev-btn" id="carousel-prev-${instanceId}" type="button">
                    <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" fill="none" class="btn-arrow">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                
                <div class="carousel-track-container">
                    <div class="carousel-track" id="carousel-track-${instanceId}">
                        <!-- Rendered dynamically by JS -->
                    </div>
                </div>
                
                <button class="carousel-btn next-btn" id="carousel-next-${instanceId}" type="button">
                    <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" fill="none" class="btn-arrow">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Kanban Board Section -->
        <div class="kanban-section d-none" id="kanban-section-${instanceId}">
            <div class="kanban-header">
                <h3 class="section-title">
                    <span class="title-decorator"></span>
                    ${i18n.getTranslation('central.tarefas.secao.kanban')}: <span id="selected-process-label-${instanceId}"></span>
                </h3>
                <div class="kanban-controls">
                    <div class="kanban-search-wrapper">
                        <input type="text" class="form-control kanban-search-input" id="kanban-search-${instanceId}" placeholder="${i18n.getTranslation('central.tarefas.busca.placeholder')}">
                    </div>
                    <div class="kanban-badge-info">
                        <span id="kanban-total-requests-${instanceId}">0 ${i18n.getTranslation('central.tarefas.contador.solicitacao.plural')}</span>
                    </div>
                </div>
            </div>
            
            <div class="kanban-board-scroll">
                <div class="kanban-board" id="kanban-board-${instanceId}">
                    <!-- Rendered dynamically by JS -->
                </div>
            </div>
        </div>
    </div>
</div>
