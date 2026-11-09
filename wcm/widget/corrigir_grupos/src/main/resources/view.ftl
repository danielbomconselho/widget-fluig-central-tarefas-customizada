<div id="corrigirGrupos_${instanceId}"
     class="super-widget wcm-widget-class fluig-style-guide corrigir-grupos"
     data-params="corrigir_grupos.instance()">

    <div class="corrigir-grupos__i18n hide" aria-hidden="true">
        <#list ["state.loading", "state.noEnv", "state.loadError", "state.groupsEmpty", "state.ready", "validation.selectGroup", "analysis.ready", "analysis.noPending", "analysis.partialError", "apply.confirm", "apply.progress", "apply.success", "apply.partialError", "label.yes", "label.no", "label.pending", "label.alreadyDirect", "preview.limit", "common.error", "common.success", "common.warning"] as key>
            <span data-i18n-key="${key}">${i18n.getTranslation(key)}</span>
        </#list>
    </div>

    <div class="panel panel-default">
        <div class="panel-heading">
            <h2 class="panel-title">${i18n.getTranslation('widget.title')}</h2>
        </div>
        <div class="panel-body">
            <p class="text-muted">${i18n.getTranslation('widget.description')}</p>

            <div id="status_${instanceId}" class="alert alert-info" role="status" aria-live="polite"></div>

            <div class="form-group">
                <label for="groupFilter_${instanceId}">${i18n.getTranslation('group.filter')}</label>
                <input id="groupFilter_${instanceId}" type="search" class="form-control"
                       placeholder="${i18n.getTranslation('group.filterPlaceholder')}"
                       data-filter-groups>
            </div>

            <div class="form-group">
                <label for="groupSelect_${instanceId}">${i18n.getTranslation('group.select')}</label>
                <select id="groupSelect_${instanceId}" class="form-control corrigir-grupos__select"
                        multiple size="12" data-group-select aria-describedby="groupHelp_${instanceId}"></select>
                <p id="groupHelp_${instanceId}" class="help-block">${i18n.getTranslation('group.help')}</p>
            </div>

            <div class="corrigir-grupos__actions">
                <button type="button" class="btn btn-default" data-refresh-groups>${i18n.getTranslation('button.refresh')}</button>
                <button type="button" class="btn btn-default" data-select-visible>${i18n.getTranslation('button.selectVisible')}</button>
                <button type="button" class="btn btn-default" data-clear-selection>${i18n.getTranslation('button.clear')}</button>
                <button type="button" class="btn btn-primary" data-analyze>${i18n.getTranslation('button.analyze')}</button>
                <button type="button" class="btn btn-success" data-apply disabled>${i18n.getTranslation('button.apply')}</button>
            </div>
        </div>
    </div>

    <section id="result_${instanceId}" class="panel panel-default hide" data-result aria-live="polite">
        <div class="panel-heading"><h3 class="panel-title">${i18n.getTranslation('result.summaryTitle')}</h3></div>
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead><tr>
                    <th>${i18n.getTranslation('table.group')}</th>
                    <th>${i18n.getTranslation('table.pending')}</th>
                    <th>${i18n.getTranslation('table.alreadyDirect')}</th>
                    <th>${i18n.getTranslation('table.groupsVisited')}</th>
                    <th>${i18n.getTranslation('table.rolesVisited')}</th>
                    <th>${i18n.getTranslation('table.cycle')}</th>
                </tr></thead>
                <tbody id="summaryBody_${instanceId}" data-summary-body></tbody>
            </table>
        </div>
    </section>

    <section id="users_${instanceId}" class="panel panel-default hide" data-users>
        <div class="panel-heading"><h3 class="panel-title">${i18n.getTranslation('result.usersTitle')}</h3></div>
        <div class="table-responsive">
            <table class="table table-condensed table-striped">
                <thead><tr>
                    <th>${i18n.getTranslation('table.group')}</th>
                    <th>${i18n.getTranslation('table.login')}</th>
                    <th>${i18n.getTranslation('table.name')}</th>
                    <th>${i18n.getTranslation('table.source')}</th>
                    <th>${i18n.getTranslation('table.status')}</th>
                </tr></thead>
                <tbody id="usersBody_${instanceId}" data-users-body></tbody>
            </table>
        </div>
    </section>
</div>
