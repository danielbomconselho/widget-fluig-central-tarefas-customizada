<script type="application/javascript" src="/webdesk/vcXMLRPC.js" charset="utf-8"></script>
<div id="Central_de_tarefas_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide" data-params="Central_de_tarefas.instance()">
    <div class="task-dashboard-container">
        <!-- Dashboard Header -->
        <header class="dashboard-header">
            <button id="btn-nova-solicitacao" data-nova-sol class="btn btn-primary" style="float: right;">
                <i class="fas fa-plus"></i>Nova Solicitação
            </button>
            <div class="dashboard-header-text">
                <h1 class="dashboard-title">Central de Tarefas Inteligente</h1>
                <p class="dashboard-subtitle">Visualize o andamento dos processos, navegue entre solicitações e acompanhe as atividades em tempo real</p>
            </div>
        </header>

        <!-- Filters Bar (solicitante, responsável, categoria) -->
        <div class="filters-bar">
            <div class="filter-group">
                <label class="filter-label" for="filter-solicitante-${instanceId}">Solicitante</label>
                <select id="filter-solicitante-${instanceId}" class="filter-select" data-filter-key="solicitante">
                    <option value="all">Todos</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label" for="filter-responsavel-${instanceId}">Responsável</label>
                <select id="filter-responsavel-${instanceId}" class="filter-select" data-filter-key="responsavel">
                    <option value="all">Todos</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label" for="filter-categoria-${instanceId}">Categoria</label>
                <select id="filter-categoria-${instanceId}" class="filter-select" data-filter-key="categoria">
                    <option value="all">Todas</option>
                </select>
            </div>
            <button type="button" id="clear-filters-${instanceId}" class="clear-filters-btn d-none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="clear-filters-icon">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Limpar Filtros
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
                        <span class="kpi-title">Em Andamento</span>
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
                        <span class="kpi-title">Concluídos</span>
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
                        <span class="kpi-title">Atrasados</span>
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
                        <span class="kpi-title">Geral (Total)</span>
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
                    Processos com Solicitações <span id="selected-status-label-${instanceId}"></span>
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
                    Quadro Kanban: <span id="selected-process-label-${instanceId}"></span>
                </h3>
                <div class="kanban-controls">
                    <div class="kanban-search-wrapper">
                        <input type="text" class="form-control kanban-search-input" id="kanban-search-${instanceId}" placeholder="Buscar por código ou solicitante...">
                    </div>
                    <div class="kanban-badge-info">
                        <span id="kanban-total-requests-${instanceId}">0 solicitações</span>
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