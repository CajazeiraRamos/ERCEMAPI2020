    // Dimensao e grupo para o grafico 1:
    var dim_UF = facts.dimension(function(d){return d.uf;}),
    Casos_UF = dim_UF.group()
        .reduceSum( function(d){return d.casosNovos;});
    // Dimensao e grupo para o grafico 2:
    var dim_Data =  facts.dimension(function(d){return d.data;}),
    Casos_Data = dim_Data.group()
        .reduceSum(function(d){return d.casosNovos;});
    // Janela temporal para grafico 2:
    var maxDate = dtgFormat.parse("10/05/2020"),
    minDate = d3.time.day.offset(maxDate, -20);
    // Inicializacao dos graficos:
    var grafico1 = new dc.rowChart("#divGrafico1");
    var grafico2 = new dc.barChart("#divGrafico2");
    // Contrucao dos graficos:
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
                return escalaDeCores(d);});                
    grafico2
            .width(900)
            .height(500)
            .elasticY(true)
            .margins({left: 60, top: 30, right: 80, bottom: 60})
            .x(d3.time.scale().domain([minDate, maxDate]))
            .xUnits(d3.time.days)
            .brushOn(false)
            .centerBar(true)
            .renderHorizontalGridLines(true)
            .renderVerticalGridLines(true)
            .colors(['#e34a33'])
            .dimension(dim_Data)
            .group(Casos_Data);
    // Exemplo de filtro com dimensao crossfilter
    dim_Data.filter(function(d){
            if(d<=dtgFormat.parse("10/05/2020"))
            return d;
        });
    // Formatacao de numeros e data no grafico 2:
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
            })
        .yAxis()
                .tickFormat(function(d){
                    return d.toLocaleString("pt-BR");
                });
    // Rotacao da legenda inferior - Eixo X - no grafico 2:
    grafico2
        .on('renderlet', function (chart) {
            chart.selectAll('g.x text')
            .attr('transform', 'translate(-20,10) rotate(-35)')
        }); 
    // Renderizacao dos graficos:
    dc.renderAll();