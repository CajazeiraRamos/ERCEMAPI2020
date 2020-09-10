
let populacaoUF = d3.scale.ordinal()
	.domain(["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"])
	.range(['881935','3337357','845731','4144597','14873064','9132078','3015268','4018650','7018354','7075181','3484466','2778986','21168791','8602865','4018127','11433957','9557071','3273227','17264943','3506853','11377239','1777225','605761','7164788','45919049','2298696','1572866']),
nomeUF = d3.scale.ordinal()
	.domain(["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"])
	.range(['Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','Distrito Federal','Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul','Minas Gerais','Pará','Paraíba','Paraná','Pernambuco','Piauí','Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia','Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins']),
siglaRegiao = d3.scale.ordinal()
	.domain(["Sudeste", "Nordeste", "Sul", "Centro-Oeste", "Norte"])
	.range(['SE','NE','S','CO','N']),
colorRegiao = d3.scale.ordinal()
	.domain(["Sudeste", "Nordeste", "Sul", "Centro-Oeste", "Norte"])
	.range(['#b3e2cd','#fdcdac','#cbd5e8','#f4cae4','#e6f5c9']),
populacaoRG = d3.scale.ordinal()
	.domain(["Sudeste", "Nordeste", "Sul", "Centro-Oeste", "Norte"])
	.range(['88371433','57071654','29975984','16297074','18430980']); 

let indUF = d3.scale.ordinal()
	.domain(["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"])
	.range(['','','','','','','','','','','','','','','','','','','','','','','','','','','']),
indRG = d3.scale.ordinal()
	.domain(["Sudeste", "Nordeste", "Sul", "Centro-Oeste", "Norte"])
	.range(['','','','','']);

let centroMapa = [-14, -54],zoomMapa = 5;
var popBR = 210147125;

var formatoNum = d3.format(",d");

let dimData, dimUF, dimRG; 
let groupCasos_dimUF, groupObitos_dimUF, groupTaxa_dimUF, groupLet_dimUF,
groupCasos_dimRG, groupObitos_dimRG, groupTaxa_dimRG, groupLet_dimRG;

let groupCasos_dimData, groupObitos_dimData,
 groupNovosCasos_dimData, groupNovosObitos_dimData;  

let casosPorUF = d3.map(), obitosPorUF = d3.map(), 
	taxaPorUF = d3.map(), letPorUF = d3.map();

let casosPorRG = d3.map(), obitosPorRG = d3.map(), 
	taxaPorRG = d3.map(), letPorRG = d3.map();

let casosPorData = d3.map(), obitosPorData = d3.map(), 
	taxaPorData = d3.map(), letPorData = d3.map();

let RGPorUF = d3.map();

let dataAtual, dataInicial, dataFinal, escala=false, controleUF_RG=false, ControleTxVa=false,
 dtgFormat = d3.time.format("%d/%m/%Y"), formatDay = d3.time.format("%d"),
	formatMonth = d3.time.format("%m"),
	formatYear = d3.time.format("%Y");
	

let quantizeTaxa = d3.scale.linear()
			.domain([0,25,50,100,150,200,300])
			.range(['#eff3ff','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#084594']),
	quantizeLet = d3.scale.linear()
			    .domain([0,1,3,5,7,10,15])
			    .range(['#f2f0f7','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486']),
	quantizeCasos = d3.scale.linear()
				.domain([0,1000,5000,10000,15000,25000,40000])
				.range(['#edf8fb','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824']),
	quantizeObitos = d3.scale.linear()
			    .domain([0,50,100,500,1000,2000,3000])
			    .range(['#edf8e9','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#005a32'])
			   ;

// Variávies para cada gráfico 

let graficoNovosCasos, graficoNovosObitos, graficoCasosAcumulados, graficoAcumulados, graficoUF, graficoRG;


var layerGroup_UF = new L.LayerGroup();
var layerGroup_RG = new L.LayerGroup();
let geojsonUFs, geojsonRGs;



let Mapa = L.map('divMapa', { zoomControl:false }).setView(centroMapa, zoomMapa);
L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {maxZoom: 18, attribution: `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>`})
.addTo(Mapa);
Mapa.scrollWheelZoom.disable();
Mapa.doubleClickZoom.disable();

let info = L.control(), 
legenda = L.control({position: 'bottomright'}),
defMapa = L.control({position: 'bottomleft'}); 
defEscala = L.control({position: 'bottomleft'}); 

legenda.onAdd = function (map) {
	
	var title = '';

	if(escala)
		if(ControleTxVa)
			title = '<b>Nº de Óbitos</b>';
		else
			title = '<b>Letalidade (%)</b>';
	else
		if(ControleTxVa)
			title = '<b> Nº de Casos</b>';
		else
			title = '<b>Taxa por 100 mil/h </b>';

	var format = d3.format("s");
	var quantize = getQuantize();
	var brewerColors = quantize.range();
	let div = L.DomUtil.create('div', 'info legend'),
	labels = [],
	n = brewerColors.length,
	from, to;
	labels.push(title);

	for (let i = 0; i < n; i++) {
		let c = brewerColors[i];
		let fromto = quantize.domain();//.invertExtent(c);
		var v1 = format(d3.round(fromto[i],1)),
		v2 = d3.round(fromto[i+1],1);

		labels.push(
		'<i style="background:' + brewerColors[i] + '"></i> ' +
		v1 + (v2 ? ' &ndash; ' + format(v2) : '+'));
	}

	div.innerHTML = labels.join('<br>');
	return div;}
info.onAdd = function(map){
	this._div = L.DomUtil.create('div', 'info');
	this.update();
return this._div;};
info.update = function (e) {
	var formatDay = d3.time.format("%d"),
	formatMonth = d3.time.format("%m"),
	dia  = formatDay(dataAtual),
	mes = formatMonth(dataAtual);
	
	let title = 'estado';
	if(controleUF_RG)
		title = 'região';

	if(e){
		var info = e.properties,
		let = 0,
		taxa = 0,
		nome = "teste",
		casos = 0,
		mortes = 0;

		if(controleUF_RG){
			taxa = taxaPorRG.get(info.nome);
			let = letPorRG.get(info.nome);
			casos = casosPorRG.get(info.nome);
			mortes = obitosPorRG.get(info.nome);
			nome = info.nome;
		}else{
			taxa = taxaPorUF.get(info.UF);
			let = letPorUF.get(info.UF);
			casos = casosPorUF.get(info.UF);
			mortes = obitosPorUF.get(info.UF);
			nome = nomeUF(info.UF);
		}

		var quantize = getQuantize(),
		ind = IndCor(info),		
		cor = quantize(ind);

	}
	this._div.innerHTML = '<h3>Dados por '+title+' </h3>' +  (e ?
		'<b>' + nome + ' ('+dia+'/'+mes+')</b><br />'
		+ casos + ' Casos confirmados' + '</b><br />'
		+ mortes + ' Óbito(s)' + '</b><br />'
		+ taxa + ' para cada 100mil/h'+ '</b><br />'
		+ let + '% Letalidade'+ '</b><br />'+
		'<i style="float: left; margin-top: 5px; height: 20px; margin-left:25%; width:'+let+'px; background-color:black"></i>'
		+'<i style="float: left; margin-top: 5px; height: 20px; width:'+(100-let)+'px; background-color:'+cor+';"></i>' 
		: 'Passe o mouse sobre seu '+title+' ou click');};

defMapa.onAdd = function(mymap){
	let div = L.DomUtil.create('div', 'info');
	labels = [];
	// labels.push('<h2 style="padding: 10px;">-</h2>')
	var seletor = '<b>Estado / Região</b> <br> <label class="switch" style="margin-top:20px;">' + 
		'<input type="checkbox" id="DefMap" onchange="trocaControleUF_RG()">' + 
		'<span class="slider round"></span>' + 
		'</label>';
	labels.push(seletor);
	div.innerHTML = labels.join('<br>');

	return div;}
defEscala.onAdd = function(mymap){
	let div = L.DomUtil.create('div', 'info');
	labels = [];
	// labels.push('<h2 style="padding: 10px;">-</h2>')
	var seletor = '<b>Incidência / Letalidade</b> <br> <label class="switch" style="margin-top:20px;">' + 
		'<input type="checkbox" id="trocaEscala" onchange="trocaEscala()">' + 
		'<span class="slider round"></span>' + 
		'</label>';
	labels.push(seletor);
	div.innerHTML = labels.join('<br>');

	return div;}

function trocaEscala(){
	escala = !escala;
	atualizaMapa();
	atualizaGraficos();
}
function trocaControleUF_RG(){
	controleUF_RG = !controleUF_RG;
	info.update();
	atualizaMapa();
}

function trocaControleTxVa(){
	ControleTxVa = !ControleTxVa;
	atualizaMapa();	
}
function limparFiltros(){
	dc.filterAll(); 
	Mapa.flyTo(centroMapa, zoomMapa);}


function alteraDia(){
	
	limparFiltros();
	console.log(dataAtual);

	var novaData = NumToData(document.getElementById("dataRange").value);
	dataAtual = novaData;


	dimData.filter(function(d){
		if(d<=dataAtual)
			return d;
	});
	

	atualiza_mapsUFs();
	atualiza_mapsRGs();
	atualizaMapa();

	var title = document.getElementById("title"),
	dia  = formatDay(dataAtual),
	mes = formatMonth(dataAtual),
	ano = formatYear(dataAtual),
	dataLabel = document.getElementById("dataLabel");

	dataLabel.innerHTML = '<label id = "dataLabel"> Data: '+dia+"/"+mes+"/"+ano+'</label>';


	title.innerHTML = '<h1>'+
		'<span class="label label-default">'+'Brasil ('+dia+"/"+mes+"/"+ano+')'+'</span>\n'+
		'<span class="label label-default">'+casosPorData.get(dataAtual).toLocaleString('pt-BR')+' Casos</span>\n'+
		'<span class="label label-default">'+d3.round(taxaPorData.get(dataAtual),1)+' p/ 100mil/h</span>\n'+
		'<span class="label label-default">'+obitosPorData.get(dataAtual).toLocaleString('pt-BR')+' Óbitos</span>\n'+
		'<span class="label label-default">'+d3.round(letPorData.get(dataAtual),1)+'% Let.</span> \n'+	
		// '<button  class="label label-default" onclick="maisInfos()">+<span>'+
		'</h1>';}

function atualizaMapa(){

	Mapa.removeLayer(layerGroup_UF);
	Mapa.removeLayer(layerGroup_RG);		

	legenda.addTo(Mapa);

	if(controleUF_RG){
		layerGroup_RG.addTo(Mapa);
		AtualizaCoresRG();
	}else{
		layerGroup_UF.addTo(Mapa);
		AtualizaCoresUF();
	}}


d3.csv("data/minSaude.csv", function(data){

	data.forEach(function(d) {
		d.regiao = d.regiao;
		d.uf = d.estado;
	
		var Y = d.data.substr(0,4),
		M = d.data.substr(5,2),
		D = d.data.substr(8,2),
		strData = D+'/'+M+'/'+Y;
		
		d.data = dtgFormat.parse(strData);

		d.nome = nomeUF(d.uf);
		d.casosNovos = +d.casosNovos;
		d.casosAcumulados = +d.casosAcumulados;
		d.obitosNovos = +d.obitosNovos;
		d.obitosAcumulados = +d.obitosAcumulados;
		d.populacao = populacaoUF(d.uf);

		RGPorUF.set(d.uf, d.regiao);
		});


	inicializa(data);


	dataFinal = dimData.top(1)[0].data;
	dataInicial = d3.time.day.offset(dataFinal, -15);
	dataAtual = dataFinal;


	document.getElementById("dataRange").min = dataToNum(dataInicial);
	document.getElementById("dataRange").max = dataToNum(dataFinal);
	document.getElementById("dataRange").value = dataToNum(dataFinal);
	

	geojsonUFs = L.geoJson(Estados, {
		style: style,
		onEachFeature: onEachFeatureUF
	});

	layerGroup_UF.addLayer(geojsonUFs);

	geojsonRGs = L.geoJson(Regioes, {
		style: style,
		onEachFeature: onEachFeatureRG
	});
	layerGroup_RG.addLayer(geojsonRGs);

	
	info.addTo(Mapa);
	defEscala.addTo(Mapa);
	defMapa.addTo(Mapa);



	alteraDia();

});

function inicializa(data){
	
	var facts = crossfilter(data);
	
	dimDataUF = facts.dimension(function(d){
		return "data: "+d.data+",UF: "+d.uf;});
	
	groupCasos_dimDataUF = dimDataUF.group()
	.reduceSum(function(d){
		return d.casosNovos;});

	groupCasos_dimDataUF.all()
	.forEach(function(d){
		console.log(d)
		});
	


	dimData = facts.dimension(function(d){
		return d.data;});
	dimUF = facts.dimension(function(d){
		return d.uf;});
	dimRG = facts.dimension(function(d){
		return d.regiao;});


	groupCasos_dimUF = dimUF.group()
		.reduceSum(function(d){
			return d.casosNovos;});
	groupTaxa_dimUF = dimUF.group()
		.reduceSum(function(d){
			return d.casosNovos;});
	groupObitos_dimUF = dimUF.group()
		.reduceSum(function(d){
			return d.obitosNovos;});
	groupLet_dimUF = dimUF.group()
		.reduceSum(function(d){
			return d.obitosNovos;});		
	
	groupCasos_dimRG = dimRG.group()
		.reduceSum(function(d){
			return d.casosNovos;});

	groupTaxa_dimRG = dimRG.group()
		.reduceSum(function(d){
			return d.casosNovos;});


	groupObitos_dimRG = dimRG.group()
		.reduceSum(function(d){
			return d.obitosNovos;});
	groupLet_dimRG = dimRG.group()
		.reduceSum(function(d){
			return d.obitosNovos;});
	
	groupCasos_dimData = dimData.group()
		.reduceSum(function(d){
			return d.casosAcumulados;});
	groupNovosCasos_dimData = dimData.group()
		.reduceSum(function(d){
			return d.casosNovos;});
	groupObitos_dimData = dimData.group()
		.reduceSum(function(d){
			return d.obitosAcumulados;});
	groupNovosObitos_dimData = dimData.group()
		.reduceSum(function(d){
			return d.obitosNovos;});

	
 	groupCasos_dimData.all()
	.forEach(function(d){
		casosPorData.set(d.key, +d.value);
		var taxa = d3.round(((d.value*100000)/popBR),2);
		taxaPorData.set(d.key, taxa);
	});
	groupObitos_dimData.all()
	.forEach(function(d){
		obitosPorData.set(d.key, +d.value);
		var let = d3.round((d.value*100/casosPorData.get(d.key)),2);
		letPorData.set(d.key, let);
	});
	

}

function atualiza_mapsUFs(){
	groupCasos_dimUF.all()
	.forEach(function(d){
		casosPorUF.set(d.key, +d.value);
		var taxa = d3.round((d.value*100000)/populacaoUF(d.key),2);
		taxaPorUF.set(d.key, +taxa);

	});
	groupObitos_dimUF.all()
	.forEach(function(d){
		obitosPorUF.set(d.key, +d.value);
		var letalidade = d3.round((d.value*100)/casosPorUF.get(d.key),2);
		if(Number.isNaN(letalidade))
			letalidade = 0;
		letPorUF.set(d.key, +letalidade);
	});}
function atualiza_mapsRGs(){
	groupCasos_dimRG.all()
	.forEach(function(d){
		casosPorRG.set(d.key, +d.value);
		var taxa = d3.round((d.value*100000)/populacaoRG(d.key),2);
		taxaPorRG.set(d.key, +taxa);
	});
	groupObitos_dimRG.all()
	.forEach(function(d){
		obitosPorRG.set(d.key, +d.value);
		var letalidade = +d3.round((d.value*100)/casosPorRG.get(d.key),2);
		// console.log(letalidade);
		if(Number.isNaN(letalidade))
			letalidade = 0;
		letPorRG.set(d.key, +letalidade);
	});}

function onEachFeatureUF(feature, layer) {
	layer._leaflet_id = feature.properties.UF;
	// console.log(layer._leaflet_id);
		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlight,
			click: highlightFeaturev2
	});}
function onEachFeatureRG(feature, layer) {
	layer._leaflet_id = feature.properties.nome;
		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlight,
			click: highlightFeaturev2
	});}
function AtualizaCoresUF(){

	var quantize = getQuantize();

	var UFs = groupCasos_dimUF.top(Infinity);
	UFs.forEach(function (d){
		var layer = geojsonUFs._layers[d.key];
		geojsonUFs.resetStyle(layer);
		});}

function style(feature) {
	var quantize = getQuantize();
	var ind = IndCor(feature.properties),
	cor = quantize(ind);
	return {
		weight: 2,
		opacity: 1,
		color: '#242424',
		dashArray: '3',
		fillOpacity: 1,
		fillColor: quantize(ind)};}
function getFeature(id){
	if(controleUF_RG)
		return geojsonRGs._layers[id].feature;
	
	else
		return geojsonUFs._layers[id].feature;}

function getLayer(id){
	if(controleUF_RG)
		return geojsonRGs._layers[id];
	else
		return geojsonUFs._layers[id];}

function IndCor(id){

	if(escala){ //Obitos
		if(controleUF_RG){ //Obitos Por Região
			if(ControleTxVa){  //Valores Absolutos
				return obitosPorRG.get(id.nome);
			}
			return letPorRG.get(id.nome);
		}
		if(ControleTxVa){
			return obitosPorUF.get(id.UF);
		}
		return letPorUF.get(id.UF);
	}
	// Casos 
	if(controleUF_RG){ // Casos por Região
		if(ControleTxVa) //Valores absolutos
			return casosPorRG.get(id.nome);
		return taxaPorRG.get(id.nome);
	}
	if(ControleTxVa)
		return casosPorUF.get(id.UF);
	return taxaPorUF.get(id.UF);


	// if(controleUF_RG){
	// 	if(escala){
	// 		return letPorRG.get(id.nome);
	// 	}
	// 	return taxaPorRG.get(id.nome);
	// }
	// if(escala)
	// 	return letPorUF.get(id.UF);
	// return taxaPorUF.get(id.UF);
	return 0;}
function indPorUF(id){

	if(escala){ //Obitos
		if(ControleTxVa){
			return obitosPorUF.get(id);
		}
		return letPorUF.get(id);
	}
	if(ControleTxVa)
		return casosPorUF.get(id);
	return taxaPorUF.get(id);
}
function indPorRG(id){

	if(escala){ //Obitos
		if(ControleTxVa){  //Valores Absolutos
			return obitosPorRG.get(id);
		}
		return letPorRG.get(id);
		
	}
	// Casos 
	if(ControleTxVa) //Valores absolutos
		return casosPorRG.get(id);
	return taxaPorRG.get(id);
	
	return 0;}


function AtualizaCoresRG(){
	
	var RGs = groupCasos_dimRG.top(Infinity);
	RGs.forEach(function (d){
		geojsonRGs.resetStyle(geojsonRGs._layers[d.key]);});}
function highlightFeature(e) {
	let layer;
	if(e.target)
		layer = e.target;
	else
		layer = e;

	layer.setStyle({
				weight: 3,
				color: 'white',
				dashArray: '',
				fillOpacity: 0.7
	});

	if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	}

	info.update(layer.feature);}
function highlightFeaturev2(e) {

	let layer =  e.target;
	var cod = layer.feature.properties.UF;
	// dimUF.filter(function(d){
	// 	console.log(d);
	// 	if(d == cod);
	// 		return true;
	// 	return false;
	// })
	// dimUF.filter(cod);
	// dc.renderAll();


	info.update(layer.feature);

}
function resetHighlight(e) {
	if(controleUF_RG)
		geojsonRGs.resetStyle(e.target);
	else
		geojsonUFs.resetStyle(e.target);
	info.update();}

function getQuantize(){
	if(escala){
		if(ControleTxVa)
			return quantizeObitos;
		return quantizeLet;
	}else{
		if(ControleTxVa)
			return quantizeCasos;
		return quantizeTaxa;
	}
}
function dataToNum(inDate) {
    var returnDateTime = 25569.0 + ((inDate.getTime() - (inDate.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24));
    return returnDateTime.toString().substr(0,5);}
function NumToData(serial) {
   var utc_days  = Math.floor(serial - 25569);
   var utc_value = utc_days * 86400;                      
   var date_info = new Date(utc_value * 1000);
   var ano = date_info.getFullYear(),
   mes = date_info.getMonth()+1,
   dia =  date_info.getDate()+1;
   return dtgFormat.parse(dia+"/"+mes+"/"+ano);}
