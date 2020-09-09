d3.csv("../minSaude.csv", function(data){
    dtgFormat = d3.time.format("%d/%m/%Y");
    data.forEach(function(d) {
        d.regiao = d.regiao;
        d.uf = d.estado;
        d.data = dtgFormat.parse(d.data);
        d.casosNovos = +d.casosNovos;
        d.casosAcumulados = +d.casosAcumulados;
        d.obitosNovos = +d.obitosNovos;
        d.obitosAcumulados = +d.obitosAcumulados;
    });
    //Leitura de dados pela CrossFilter:
    var facts = crossfilter(data); 
    // Dimensao CrossFilter com chave composta (Estado + Data): 
    var Data_UF = facts.dimension(
        function(d){
            return 'UF:'+d.uf +', data:'+d.data
        }),
    // Agrupando o numero de casos por data e estado:
    groupCasos_DataUF = 
        Data_UF.group().reduceSum(function(d){return d.casosAcumulados;}); 
        // Acessando elementos do grupo CrossFilter: 
    groupCasos_DataUF.all()
            .forEach(function(d){		
                    console.log(d.key) // UF: x, data: y;
                    console.log(d.value) // Total de casos acumulados.
            });
        // Acessando um elemento a partir de uma chave ('SP', '10/04/2020'):
        var key = 'UF:'+'SP'+', data:'+dtgFormat.parse('10/04/2020'),
        resposta = groupCasos_DataUF.all()
        .filter(
            function(i){
                return i.key == key 
        })[0].value;
        console.log('total de casos de SP em 10/04/2020: '+resposta); 
    // Dimensao CrossFilter com chave simples (Regiao):
        var Regiao = facts.dimension(function(d){return d.regiao;});
    // Agrupando obitos por regiao (Todos os registros de obitos novos por regiao serao somados):
        var groupObitos = Regiao.group()
        .reduceSum(function(d){
                    return d.obitosNovos;
        });
    // Acessando um elemento a partir de uma chave ('Nordeste'):
        var resposta = groupObitos.all().filter(function(i){ return i.key == 'Nordeste' })[0].value;
        console.log(resposta);

}