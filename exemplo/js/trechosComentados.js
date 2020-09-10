// Parte 1: Lendo Arquivo csv com d3 e criando dimensões e grupos Crossfilter
 
d3.csv("data/minSaude.csv", function(data){
    dtgFormat = d3.time.format("%Y-%m-%d");
    // Para cada instância (Ou linha) do arquivo, armazenar as variáveis desejadas
	data.forEach(function(d) {
		d.regiao = d.regiao;
        d.uf = d.estado;
		d.data = dtgFormat.parse(d.data);
		d.casosNovos = +d.casosNovos;
		d.casosAcumulados = +d.casosAcumulados;
		d.obitosNovos = +d.obitosNovos;
		d.obitosAcumulados = +d.obitosAcumulados;
    });

    // Criando dimensões e grupos Crosfilter:
    
    var facts = crossfilter(data);
    
        // Dimensão data e estado, onde os valores podem ser agrupados com uma chave composta. 

    var Data_UF = facts.dimension(function(d){
        return 'UF:'+d.uf +', data:'+d.data});

    // Agrupando o número de casos com a dimensão Data_UF

    var groupCasos_DataUF = Data_UF.group()
    .reduceSum(function(d){
        return d.casosAcumulados;});

    // Exemplo: Imprimir todos os elementos de um grupo: 

    groupCasos_DataUF.all()
	    .forEach(function(d){		
            console.log(d.key) // UF: x, data: y
            console.log(d.value) // Total de casos acumulados do estado x, na data y. 
		});
    
    //Qual o total de casos de SP em 10/04/2020? 

    var key = 'UF:SP, data:'+dtgFormat.parse('2020-04-10'),
    resposta = groupCasos_DataUF.all().filter(function(i){ return i.key == key })[0].value;

    console.log(resposta); 

    // Dimensão Região, onde valores podem ser agrupados e recuperados (Casos ou óbitos por Região, dentre outros)
    var Regiao = facts.dimension(function(d){
        return d.regiao;});
    
    // Agrupando óbitos de uma região, note a diferença do "groupCasos_DataUF": Óbitos novos de todos as "datas" serão somados. 
        
    var groupObitos = Regiao.group()
		.reduceSum(function(d){
            return d.obitosNovos;});
            
    // Qual o total de óbitos da região Nordeste hoje?
    
    resposta = groupObitos.all().filter(function(i){ return i.key == 'Nordeste' })[0].value;
    console.log(resposta);

// Fim parte 1;   
    
// Parte 2: Construindo um mapa temático com o Número de casos da Covid19 por estado, considerando dados até o dia 10/05/2020:

    // *Verificar estrutura do arquivo HTML; 

    // Inicializando Mapa: 

    let centro = [-14, -54],zoom = 4,
    Mapa = L.map('divMapa', { zoomControl:false }).setView(centro, zoom);
    
    L.tileLayer(
        'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', 
        {maxZoom: 18, attribution: `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>`}
    ).addTo(Mapa);

    // Data de Referência p/ o Mapa: 10/05/2020 e Escala de Cores:
    let date = dtgFormat.parse('2020-05-10');
    
    let escalaDeCores = d3.scale.linear()
        .domain([0,1000,5000,10000,15000,25000,40000])
        .range(['#edf8fb','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824']);

    // Adicionando os limites dos estados ao Mapa_Leaflet: 
    // "Estados" é uma variável contendo o json com limites geográficos 

    L.geoJson(
        Estados, {
            style: estilizacao,
            onEachFeature: ParaCadaEstado,
        }
    ).addTo(Mapa);


    // Funções auxiliares importantes: 

    function estilizacao(feature){

        var key = 'UF:'+feature.properties.UF+', data:'+date, 
        Ncasos = groupCasos_DataUF.all().filter(function(i){ return i.key == key })[0].value;

        return {
            weight: 2,
            opacity: 1,
            color: '#242424',
            dashArray: '3',
            fillOpacity: 1,
            fillColor: escalaDeCores(Ncasos) 
        };
    }

    function ParaCadaEstado(feature, layer) {
        layer._leaflet_id = feature.properties.UF;
            layer.on({
                // Eventos_Leaflet: ...,
                click: clickEstado
        });}

    function clickEstado(e) {        

        let layer =  e.target;
        var cod = layer.feature.properties.UF;

        var key = 'UF:'+cod+', data:'+date,
        Ncasos = groupCasos_DataUF.all().filter(function(i){ return i.key == key })[0].value;
        alert("Estado: "+cod+";\nNº de Casos em 10/04/2020: "+Ncasos);    
    
    }

    // Construindo uma Legenda (verificar estilização*):

    let legenda = L.control({position: 'bottomright'});
    
    legenda.onAdd = function (map) {
	
        var title = 'Nº de Casos';
    
        var format = d3.format("s");
        var cores = escalaDeCores.range();
        let div = L.DomUtil.create('div', 'legenda'),
        labels = [],
        n = cores.length,
        from, to;
        labels.push(title);
    
        for (let i = 0; i < n; i++) {
            let c = cores[i];
            let fromto = escalaDeCores.domain();
            var v1 = format(d3.round(fromto[i],1)),
            v2 = d3.round(fromto[i+1],1);
    
            labels.push(
            '<i style="background:' + cores[i] + '"></i> ' +
            v1 + (v2 ? ' &ndash; ' + format(v2) : '+'));
        }
    
        div.innerHTML = labels.join('<br>');
        return div;
    }

    legenda.addTo(Mapa);



// Parte 3: Construindo dois gráficos interligados e interativos com DC:
    
    
    // Definindo Dimensão e Grupo p/ o gráfico Nº de Casos por UF: 

    var dim_UF = facts.dimension(function(d){return d.uf;}),
    Casos_UF = dim_UF.group()
		.reduceSum(function(d){
			return d.casosNovos;});

    // Atribuição do gráfico à div HTML:

    grafico1 = new dc.rowChart("#divGrafico1");

    // Construção do gráfico:

    grafico1
		.width(900)
		.height(800)
	    .margins({left: 100, top: 10, right: 50, bottom: 60})
		.renderLabel(true)
        .renderTitleLabel(true)
		.labelOffsetX(-35)
		.elasticX(true)
		.dimension(dim_UF)
        .group(Casos_UF)
		.title(function(d){
			if(d.value == 0)
        		return '-';
			return d.value.toLocaleString("pt-BR");
        })
        .colorAccessor(function (d){return d.value;})
        .colors(function(d){
            return escalaDeCores(d);
        });

    
    // Construindo o gráfico 2: Nº de casos por dia.
    
    // Definindo Dimensão e Grupo p/ o gráfico: 

    var dim_Data =  facts.dimension(function(d){return d.data;});
    
    var Casos_Data = dim_Data.group()
        .reduceSum(function(d){
            return d.casosNovos;});
    
    // Atribuição do gráfico à div HTML:
    grafico2 = new dc.barChart("#divGrafico2");

    // Janela temporal: 

    var maxDate = dtgFormat.parse("2020-05-10"),
    minDate = d3.time.day.offset(maxDate, -20);
   
    // Construção do gráfico:    
    
    grafico2
		.width(900)
		.height(500)
		.elasticY(true)
        .margins({left: 60, top: 30, right: 80, bottom: 60})
        .x(d3.time.scale().domain([minDate, maxDate]))
		.xUnits(d3.time.days)
		.centerBar(true)
		.brushOn(false)
		.renderHorizontalGridLines(true)
       	.renderVerticalGridLines(true)
		.colors(['#e34a33'])
		.dimension(dim_Data)
		.group(Casos_Data);
		

    // Adaptações relevantes:

        // Filtrando gráfico 1 para dados até o dia 10/05/2020:
        dim_Data.filter(function(d){
            if(d<=dtgFormat.parse("2020-05-10"))
            return d;
        });

        //Formatação da Data e de números: 

        var formatDay = d3.time.format("%d"),
        formatMonth = d3.time.format("%m");
    
        grafico2
        .title(function(d){
            var dia  = formatDay(d.key),
            mes = formatMonth(d.key);
            return ('('+dia+'/'+mes+'): '+d.value+'');
        })
        .xAxis()
            .ticks(d3.time.days, 3)
            .tickFormat(function(d){
                var dia = formatDay(d),
                mes = formatMonth(d);
                return (dia+'/'+mes);
            }); 
        
        grafico2
        .yAxis()
	    	.tickFormat(function(d){
		    	return d.toLocaleString("pt-BR");
		    });


        // Rotacionando a legenda inferior:

        grafico2
            .on('renderlet', function (chart) {
                chart.selectAll('g.x text')
                .attr('transform', 'translate(-20,10) rotate(-35)')
          }); 


        
    // Renderizando gráficos DC: 

    dc.renderAll();

    // A interação entre gráficos já Funciona! 
    // Clique em uma linha de uma UF e verifique. :D 
})

