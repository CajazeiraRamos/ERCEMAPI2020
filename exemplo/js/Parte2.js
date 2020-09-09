    // Inicializacao do Mapa: 
    let centro = [-14, -54],zoom = 4,
    Mapa = L.map('divMapa', { zoomControl:false }).setView(centro, zoom);
    
    L.tileLayer(
    'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', 
    {maxZoom: 18, attribution: `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>`}
    ).addTo(Mapa);

    let date = dtgFormat.parse('10/05/2020'),
    escalaDeCores = d3.scale.linear()
    .domain([0,1000,5000,10000,15000,25000,40000])
    .range(['#edf8fb','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824']);

    L.geoJson(
        Estados, {
            style: estilizacao,
            onEachFeature: ParaCadaEstado,
        }
    ).addTo(Mapa);

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
                click: clickEstado
                // Outros Eventos_Leaflet: ...,
        });}

    function clickEstado(e) {        
        let layer =  e.target;
        var cod = layer.feature.properties.UF;
        var key = 'UF:'+cod+', data:'+date,
        Ncasos = groupCasos_DataUF.all()
            .filter(
                function(i){ 
                    return i.key == key 
                })[0].value;
        alert('Estado: '+cod+';\nN de Casos em '+date+': '+Ncasos);    
    }    

    let legenda = L.control({position: 'bottomright'});
    
    legenda.onAdd = function (map) {
	    var title = 'Num de Casos';
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