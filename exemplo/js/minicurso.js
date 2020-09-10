d3.csv("data/minSaude.csv", function(data){

    dtgFormat = d3.time.format("%Y-%m-%d");
    
    data.forEach(function(d){
        d.regiao = d.regiao;
        d.uf = d.estado;
        d.data = dtgFormat.parse(d.data);
        d.casosNovos = +d.casosNovos;
        d.casosAcumulados = +d.casosAcumulados;
        d.obitosNovos = +d.obitosNovos;
        d.obitosAcumulados = +d.obitosAcumulados;

    })


    var facts = crossfilter(data);

    var Data_UF = facts.dimension(function(d){
        return 'UF:'+d.uf + ', data:'+d.data
    });

    var groupCasos_DataUF = Data_UF.group()
    .reduceSum(function(d){
        return d.casosAcumulados;});

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

     L.geoJson(Estados,
        {
            style: estilizacao,
            onEachFeature: ParaCadaEstado,

        }).addTo(Mapa);

     function estilizacao(feature){
        var key = 'UF:'+feature.properties.UF+', data:'+date, 
        Ncasos = groupCasos_DataUF.all().filter(function(i)
            {    return i.key == key })[0].value;

        return {
            weight: 2,
            opacity: 1,
            color: '#242424',
            dashArray: '3',
            fillOpacity: 1,
            fillColor: escalaDeCores(Ncasos)
        }
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


    var dim_UF = facts.dimension(function(d){return d.uf;}),
    
    Casos_UF = dim_UF.group()
        .reduceSum(function(d){
            return d.casosNovos;});


    grafico1 = new dc.rowChart("#divGrafico1");

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

        grafico2 = new dc.barChart("#divGrafico2");
        var dim_Data =  facts.dimension(function(d){return d.data;});
    
        var Casos_Data = dim_Data.group()
            .reduceSum(function(d){
                return d.casosNovos;});

        var maxDate = dtgFormat.parse("2020-05-10"),
        minDate = d3.time.day.offset(maxDate, -20);

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

        grafico2
            .on('renderlet', function (chart) {
                chart.selectAll('g.x text')
                .attr('transform', 'translate(-20,10) rotate(-35)')
          }); 

    dc.renderAll();


});