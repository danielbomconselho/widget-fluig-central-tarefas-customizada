<script type="application/javascript" src="/webdesk/vcXMLRPC.js" charset="utf-8"></script> 

<div id="Central_iForYou_${instanceId}" 
	class="super-widget wcm-widget-class fluig-style-guide" 
	data-params="Central_iForYou.instance()"
	style="background-color:transparent !important;">
	
	<!-- AMBIENTE T-HEALTH
	<input type="hidden" id="instanceId" value="${instanceId}" />	 -->
	
	<div class="tab-content col-md-12 col-xs-12 col-lg-12 col-sm-12 panel panelLegendas" style="display: none; padding:50px !important;background-color:transparent;box-shadow:none;">
		<div class="panel" style="border: none;padding: 0px;margin: 0px;position: sticky;top: 0px;z-index: 1000 !important;">
		
			<div class="col-lg-1 col-md-1 col-xs-6 col-sm-1">
				<!-- <h2 style="font-family:fantasy;margin:0px;">MINHAS SOLICITAÇÕES</h2>
				<h4 style="margin:0px;">Painel de Visualização</h4> -->		
			</div>	                				
			
			<div class="col-lg-2 col-md-2 col-xs-6 col-sm-2" style="padding:0px !important;cursor:pointer;">
				<div class="panel panel-gray pointer" style="margin-bottom: 0px;" id="dvGeral">
					<!--  ESTILO BI <div class="panel-heading headingSolic" onclick="listaSolicitacoesLoading(null,null,'geral');"> --> 
					<div class="panel-heading headingSolic" onclick="filtrosRegua('GERAL');">
						<div class="row">
							<div class="col-xs-3">
								<i id="listaGeral"
								   title="Clique aqui para ver todas as solicitações"
								   class="flaticon flaticon-desktop-list fa-3x uPOAimg" ></i>
							</div>
							<div class="col-xs-9 text-right">
								<div id="numGeral_${instanceId}" class="huge numGeral">-</div>
								<div>Geral</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="col-lg-2 col-md-2 col-xs-6 col-sm-2" style="padding:0px !important;cursor:pointer;">
				<div class="panel panel-regua-green pointer " id="dvAndamento" style="margin-bottom: 0px;">
					<!-- ESTILO BI <div class="panel-heading headingSolic" onclick="listaSolicitacoesLoading(null,'5','Administrativa');"> -->
					<div class="panel-heading headingSolic" onclick="filtrosRegua('EM ANDAMENTO');">
						<div class="row">
							<div class="col-xs-3">
								<i id="listaAndamento"
								   title="Clique aqui para ver as solicitações em andamento"
								   class="flaticon flaticon-process-activity fa-3x uPOAimg" ></i>
							</div>
							<div class="col-xs-9 text-right">
								<div id="numAndamento_${instanceId}" class="huge numAndamento">-</div>
								<div>Em andamento</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="col-lg-2 col-md-2 col-xs-6 col-sm-2" style="padding:0px !important;cursor:pointer;">
				<div class="panel panel-blue pointer " id="dvPendente" style="margin-bottom: 0px;">
					<!-- ESTILO BI <div class="panel-heading headingSolic" onclick="listaSolicitacoesLoading(null,'11','Tecnica');"> -->
					<div class="panel-heading headingSolic" onclick="filtrosRegua('ASSUMIR TAREFA');">
						<div class="row">
							<div class="col-xs-3">
								<i id="listaPendente"
								   title="Clique aqui para ver as solicitações pendentes"
								   class="flaticon flaticon-edit-square fa-3x uPOAimg" ></i>
							</div>
							<div class="col-xs-9 text-right">
								<div id="numPendente_${instanceId}" class="huge numPendente">-</div>
								<div>Assumir Tarefa</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="col-lg-2 col-md-2 col-xs-6 col-sm-2" style="padding:0px !important;cursor:pointer;">
				<div class="panel panel-rosybrown pointer "  style="margin-bottom: 0px;" id="dvFinalizdo" >
					<!-- ESTILO BI <div class="panel-heading headingSolic" onclick="listaSolicitacoesLoading(null,'20','Finalizado');"> -->
					<div class="panel-heading headingSolic" onclick="filtrosRegua('FINALIZADO');">
						<div class="row">
							<div class="col-xs-3">
								<i id="listaFinalizadas" 
								   title="Clique aqui para ver todas as solicitações finalizadas"
								   class="flaticon flaticon-check-square fa-3x uPOAimg" ></i>
							</div>
							<div class="col-xs-9 text-right">
								<div id="numFinalizada_${instanceId}" class="huge numFinalizada">-</div>
								<div>Finalizado</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="col-lg-2 col-md-2 col-xs-6 col-sm-2" style="padding:0px !important;cursor:pointer;">
				<div class="panel panel-yellow pointer " id="dvCancelado" style="margin-bottom: 0px;">
					<!-- ESTILO BI <div class="panel-heading headingSolic" onclick="listaSolicitacoesLoading(null,'20','Finalizado');"> -->
					<div class="panel-heading headingSolic" onclick="filtrosRegua('CANCELADO');">
						<div class="row">
							<div class="col-xs-3">
								<i id="listaCancelados" 
								   title="Clique aqui para ver todas as solicitações Cancelados"
								   class="flaticon flaticon-alert fa-3x uPOAimg" ></i>
							</div>
							<div class="col-xs-9 text-right">
								<div id="numCancelado_${instanceId}" class="huge numCancelado">-</div>
								<div>Cancelado</div>
							</div>
						</div>
					</div>
				</div>
			</div>				
		</div>	
				
		<!-- ITENS -->
		<div class="tab-content col-md-12 col-xs-12 col-lg-12 col-sm-12">
			<div class="table-responsive col-md-12 col-xs-12 col-lg-12 col-sm-12">
				<div id="tabMinhasTAREFAS_${instanceId}" class="tabMinhasTAREFAS">
				</div>
			</div>
		</div>	
				
	</div>

</div>

<!-- CUSTOMIZADOS -->


<script type="text/template" class="tarefas_datatable"> 	
  <tr class="regTarefas">	
	<td class="regTarefasCol" id="Solicitacao"      >{{Solicitacao}}</td>
	<td class="regTarefasCol" id="SolicitacaoNome"  >{{SolicitacaoNome}}</td>
	<td class="regTarefasCol" id="Atividade"  		>{{Atividade}}</td>
    <td class="regTarefasCol" id="Solicitante"  	>{{Solicitante}}</td>    	  
    <td class="regTarefasCol" id="Responsavel"  	>{{Responsavel}}</td>
    <td class="regTarefasCol" id="DataAbertura"  	>{{DataAbertura}}</td>
    <td class="regTarefasCol" id="DataEncerramento" >{{DataEncerramento}}</td> 	  
    <td><button type="button" id="btnStatus" name="btnStatus" title="Status da atividade" 										
  	   class="btn btn-info btnStatus" style="font-size: smaller; font-weight: bold; letter-spacing: 2px; opacity: 80%;">{{Status}}</button></td>
<!-- BOTAO ANEXOS -->
	<td style="text-align: center !important;"><button style="border-radius: 100px; width: 40px; height: 40px;" type="button" id="btnVerAnexos" name="btnVerAnexos" title="Ver Arquivos anexados" 
	class="btn btn-info btnVerAnexos" style="font-size: smaller;"><i class="flaticon flaticon-paperclip icon-sm" id="btnVerAnexos"></i></button></td> 
<!-- BOTAO DOCUMENTO -->
	<td style="text-align: center !important;"><button style="border-radius: 100px; width: 40px; height: 40px;" type="button" id="btnVerDoc" name="btnVerDoc" title="Ver Documento" 
	 		class="btn btn-info btnVerDoc" style="font-size: smaller;"><i class="flaticon flaticon-documents icon-sm" id="btnVerDoc"></i></button></td> 
<!-- BOTAO DOCUMENTO -->
	<td style="text-align: center !important;"><button style="border-radius: 100px; width: 40px; height: 40px;" type="button" id="btnExcluir" name="btnExcluir" title="Cancelar Atividade" 
	 		class="btn btn-yellow btnExcluir" style="font-size: smaller;"><i class="flaticon flaticon-trash icon-sm" id="btnExcluir"></i></button></td>
		  	     
<!-- COLUNAS OCULTAS -->
	<td class="regTarefasCol" id="TemAnexos"     style="display:none" >{{TemAnexos}}</td>
    <td class="regTarefasCol" id="Atividade"     style="display:none" >{{Atividade}}</td>  
    <td class="regTarefasCol" id="Formulario"    style="display:none" >{{Formulario}}</td> 
    <td class="regTarefasCol" id="Versao"        style="display:none" >{{Versao}}</td>		   
  </tr> 
</script> 

<!-- LISTA ARQUIVOS -->
<script type="text/template" class="arquivos_Anexos">
    <tr class="regAnexos">
        <td id="Arquivos"	>{{Arquivos}}</td>
        <td id="Formulario"  style="display:none;">{{Formulario}}</td>
        <td id="Versao"      style="display:none;">{{Versao}}</td>        
    </tr>
</script>
