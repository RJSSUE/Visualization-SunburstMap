let svg = d3.select('#container').select('#mainsvg');
const width = 700;
const height = 407;
const margin = {top: 70, right: 10, bottom: 10, left: 10};
// const innerWidth = width - margin.left - margin.right;
// const innerHeight = height - margin.top - margin.bottom;
const g = svg.append('g').attr('id', 'maingroup')
    .attr('opacity',0.5)
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 0.3)
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
const gg = svg.append('g').attr('id', 'dots')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
const ggg = d3.select('#container').select('#linegraph');
const sunb = d3.select('#container').select('#sunburst')
    .attr('viewbox',[0,0,500,500])
    .append('g')
    .attr('transform', `translate(${200}, ${200})`);
let padding = {'left': 0.2*width, 'bottom': 0.25*height, 'top': 0.13*height, 'right': 0.15*width};
let institutionColors = {
    'Zhejiang University':'#0f4894',
    'University of Wisconsin - Madison':'#9a203e',
    'University of Washington':'#533788',
    'University of Toronto':'#0b3362',
    'University of Texas at Austin':'#cc5318',
    'University of Pennsylvania':'#0c1e55',
    'University of Michigan':'#fecd19',
    'University of Maryland - College Park':'#d7353e',
    'University of Illinois at Urbana-Champaign':'#e75132',
    'University of California - San Diego':'#0e719a',
    'University of California - Los Angeles':'#35508b',
    'University of California - Berkeley':'#0c3c69',
    'Tsinghua University':'#732bac',
    'The Hong Kong University of Science and Technology':'#263f6a',
    'Swiss Federal Institute of Technology Zurich':'#2c2c2c',
    'Stanford University':'#b41d1a',
    'Shanghai Jiao Tong University':'#ca2128',
    'Peking University':'#91180b',
    'Nanjing University':'#6a1a66',
    'Massachusetts Institute of Technology':'#0d393b',
    'Israel Institute of Technology':'#0d1440',
    'Georgia Institute of Technology':'#b6a770',
    'Fudan University':'#2a57a3',
    'Cornell University':'#b62226',
    'Columbia University':'#1451a7',
    'Chinese University of Hong Kong':'#742675',
    'Carnegie Mellon University':'#c6223a'
};
// convert dataPath to svgPath;
// go to https://github.com/d3/d3-geo for more different projections;
//const projection = d3.geoMercator();
//const projection = d3.geoOrthographic();
//const projection = d3.geoStereographic();
//const projection = d3.geoEquirectangular();
const projection = d3.geoEquirectangular()
    .center([0,30])  // 指定投影中心，注意[]中的是经纬度
    .scale(100)//150 originial
    .translate([width / 2, height / 2-50]);
//const projection = d3.geoTransverseMercator();
const pathGenerator = d3.geoPath().projection(projection);
let pos_dict = {};
let place_dict = {};
let dat = null;
var array;
// setting up the tip tool;
const tip = d3.tip()
    .attr('class', 'd3-tip').html(function(d) { return d.properties.name });
svg.call(tip);
let circles,linki,frac,root,x,y;
var class_id = {'total': 0, 'AI': 1, 'system':2,'theory':3,'inter':4, 'mixed':5,'none':6}
function checkNum(){
    var array =new Array();
    for(var i=0;i<researchinterest.single.length;i++){
        if(researchinterest.single[i].checked==true)
            array[i]=1;
        else array[i]=0;
    }
    return array;
}
function map(){
    d3.json('./data/schoollocation.json').then(function(DATA) {
        dat = DATA;
        let schools = dat.schools;
        let linkis = dat.links;
        let nodis = dat.nodes;
        let links = [];
        for (i in schools){
            let s = schools[i].longitude;
            let t = schools[i].latitude;
            pos_dict[schools[i].school] = [s,t];
            place_dict[schools[i].school] = projection(pos_dict[schools[i].school]);
            //projection.fitSize([innerWidth,innerHeight],pos_dict[schools[i].school])
            // console.log(pos_dict[schools[i].school]+'\n');
        }
        for (i in nodis){
            for(let j in schools)
                if(nodis[i].id == schools[j].school){
                    schools[j].weight = nodis[i].weight;
                    schools[j].in = 0;
                    schools[j].out = 0;
                    schools[j].loop = 0;
                }
        }
        for(i in linkis){
            let flag = 0;
            for(j in schools){
                if(linkis[i].target == schools[j].school || linkis[i].source == schools[j].school){
                    flag += 1;
                }
                if(linkis[i].target == schools[j].school && linkis[i].source==schools[j].school)
                    schools[j].loop += linkis[i].weight;
                else if(linkis[i].target == schools[j].school)
                    schools[j].in += linkis[i].weight;
                else if(linkis[i].source == schools[j].school)
                    schools[j].out += linkis[i].weight;
            }
            if(flag == 2){
                links.push(linkis[i]);
            }

        }
        linki = gg.selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('x1',d=>place_dict[d.source][0])
            .attr('y1',d=>place_dict[d.source][1])
            .attr('x2',d=>place_dict[d.target][0])
            .attr('y2',d=>place_dict[d.target][1])
            .attr("stroke", "#999")
            .join("line")
            .attr('stroke-opacity',0.6)
            .attr("stroke-width", d =>0.25*Math.sqrt(d.weight))
            .on("mouseover", function (d,i) {
                d3.select(this)//.transition()
                    .attr("stroke-width", 3)
                    .attr("stroke-opacity", 1)
                    .attr('stroke','yellow');
                let content = '<br/>'
                    + "Graduate from: "+ String(links[i].source)+ '<br/>'
                    +"Work at: "+ String(links[i].target) + '<br/>'
                    + 'Number: '+ String(links[i].weight)+'<p>';
                //console.log(place_dict);
                d3.select('#tooltip').html(content)
                    .style('left', String((place_dict[links[i].target][0]+place_dict[links[i].source][0])/2)+'px')
                    .style('top', String((place_dict[links[i].target][1]+place_dict[links[i].source][1])/2)+'px')
                    .style('visibility', 'visible');
            })
            .on("mouseout", function (e, d) {
                d3.select(this)//.transition()
                    .attr("stroke-width", d => Math.sqrt(d.weight))
                    .attr("stroke-opacity", 0.6)
                    .attr('stroke','#999');
                d3.select('#tooltip').style('visibility', 'hidden');
            });

        circles = gg.selectAll('circle')
            .data(schools)
            .enter().append('circle')
            .attr("class","point")
            .attr("cx",(d)=>{return place_dict[d.school][0]})
            .attr("cy",(d)=>{return place_dict[d.school][1]})
            .attr("r",(d)=>2+6*d.weight/200)
            .attr("opacity",0.6)
            .on("mouseover", function (d,i) {
                frac.attr('opacity',(e)=>{
                    if(d.school === e.data.institution)
                        return 1;
                    else
                        return 0.2;
                });
                d3.select(this)
                    .style("fill", "goldenrod").attr('opacity',1);
                let content = '<br/>'
                    + 'Institution: ' + String(d.school)+ '<br/>'
                    + 'Graduated faculty number: '+ String(d.weight)+ '<br/>'
                    + 'Flow out: '+ String(d.out )+ '<br/>'
                    + 'Self_loop: '+ String(d.loop)+ '<br/>'
                    + 'Flow in: '+ String(d.in)+ '<p>';

                d3.select('#tooltip').html(content)
                    .style('left', String(place_dict[d.school][0]+50) + 'px')
                    .style('top', String(place_dict[d.school][1]+80) + 'px')
                    .style('visibility', 'visible');

                linki.attr("stroke",(l)=>{
                    if(d.school == l.source && d.school == l.target)
                        return 'none';
                    else if(d.school == l.source)
                        return '#ff7f50';
                    else if(d.school == l.target)
                        return '#008000';
                    else
                        return 'none';
                })
            })
            .on("mouseout", function (e,d) {
                frac.attr('opacity',0.6);
                linki.attr("stroke","#999");
                d3.select(this)
                    .style('fill',(d)=>institutionColors[d.school])
                    .attr('opacity',0.5)
                let tooltip = d3.select("#tooltip");
                tooltip.style("visibility", "hidden");
            })
            .style('fill',(d)=>institutionColors[d.school]);

    });
    let worldmeta;
    let lastid = undefined;
    d3.json('./data/countries-110m.json').then(
        function(data){
            // convert topo-json to geo-json;
            worldmeta = topojson.feature(data, data.objects.countries);

            // this code is really important if you want to fit your geoPaths (map) in your SVG element;
            // projection.fitSize([innerWidth, innerHeight], worldmeta);
            projection(worldmeta);
            // perform data-join;
            const paths = g.selectAll('path')
                .data(worldmeta.features, d => d.properties.name)
                .enter().append('path')
                .attr('d', pathGenerator)
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .on('mouseover',function(d){
                    d3.select(this)
                        .attr("opacity", 0.5)
                        .attr("stroke","white")
                        .attr("stroke-width", 6);
                })
                .on('mouseout', function(d){
                    d3.select(this)
                        .attr("opacity", 1)
                        .attr("stroke","black")
                        .attr("stroke-width",1);
                })
                .on('contextmenu', function(d){
                    d3.event.preventDefault();
                    if(lastid !== d.properties.name){
                        tip.show(d)
                        lastid = d.properties.name;
                    }else{
                        tip.hide(d)
                    }
                })
        }
    );
}
function interest(data,classname,color){
    array = checkNum();
    ggg.append('g')
        .selectAll('circle')
        .data(data)
        .enter().append('circle')
        .attr('class',classname)
        .attr('cx',(d)=>{return x(d.year)})
        .attr('cy',(d)=>{return y(d.number)})
        .attr('fill',color)
        .attr('stroke',color)
        .attr('r',2)
        .attr('opacity',0.5)
        .attr('visibility',d=>{
            if (array[class_id[classname]] == 1)
                return 'visible';
            else
                return 'hidden';
        })
        .on('mouseover',function(d,i){
            //console.log(this);
            ggg.selectAll('circle')
                .attr('opacity',0.1);
            ggg.selectAll('.'+classname)
                .attr('r',4)
                .attr('fill','yellow')
                .attr('opacity',1);
            ggg.selectAll('path')
                .attr('opacity',0.1);
            if(classname == 'total'){
                ggg.select('.line-path')
                    .attr('opacity',1);
            }
            else if(classname == 'AI'){
                ggg.select('.line-path2')
                    .attr('opacity',1);
            }
            else if(classname == 'system'){
                ggg.select('.line-path3')
                    .attr('opacity',1);
            }
            else if(classname == 'theory'){
                ggg.select('.line-path4')
                    .attr('opacity',1);
            }
            else if(classname == 'inter'){
                ggg.select('.line-path5')
                    .attr('opacity',1);
            }
            else if(classname == 'mixed'){
                ggg.select('.line-path6')
                    .attr('opacity',1);
            }
            else if(classname == 'none'){
                ggg.select('.line-path7')
                    .attr('opacity',1);
            }
            let txti = "<br/>" +"Graduation Year: "+ String(d.year)+"<br/>"+classname+"<br/>"+"Graduation Number: "+String(d.number) + "<p>";
            let tooltip = d3.select("#tooltip");
            //  console.log(String(schools[i].longitude)+'\n');
            tooltip.html(txti)
                //设置tooltip的位置
                .style("left", (x(d.year) + 10) + "px")
                .style("top", (y(d.number) +390) + "px")
                .style("visibility", "visible");
        })
        .on("mouseout", function (e,d) {
            ggg.selectAll('circle')
                .attr('opacity',0.5);
            ggg.selectAll('path')
                .attr('opacity',0.5);
            d3.selectAll('.'+classname)
                .attr('r',2)
                .attr('fill',color);
            let tooltip = d3.select("#tooltip");
            tooltip.style("visibility", "hidden");
        });
}
function line(){
    d3.json('./data/resultnew.json').then(
        function(DATA){
            var data_legend = [
                {
                    "name":"total",
                    "color":"blue"
                },
                {
                    "name":"AI",
                    "color":"cyan"
                },
                {
                    "name":"system",
                    "color":"red"
                },
                {
                    "name":"theory",
                    "color":"green"
                },
                {
                    "name":"interdisciplinary",
                    "color":"burlywood"
                },
                {
                    "name":"mixed",
                    "color":"violet"
                },
                {
                    "name":"none",
                    "color":"salmon"
                }
            ];
            let dati = DATA;
            let maxy = 0;
            let total = dati.total;
            let AI = dati.AI;
            let system = dati.system;
            let theory = dati.theory;
            let inter = dati.inter;
            let mixed = dati.mixed;
            let none = dati.none;
            total.map((i)=>{
                if (i.number > maxy)
                    maxy = i.number;
            })
            x = d3.scaleLinear()
                .domain([1950,2020])
                .range([100, 1100]);
            let axis_x = d3.axisBottom()
                .scale(x)
                .ticks(5)
                .tickFormat(d => d);

            // y axis - publications
            y = d3.scaleLinear()
                .domain([maxy+3,0])
                .range([35,155]);
            let axis_y = d3.axisLeft()
                .scale(y)
                .ticks(10)
                .tickFormat(d => d);
            ggg.append('g')
                .attr('transform', `translate(${0}, ${155})`)
                .call(axis_x)
                .attr('font-size', '0.8rem');
            ggg.append('g')
                .attr('transform', `translate(${100}, ${0})`)
                .call(axis_y)
                .attr('font-size', '0.8rem');
            interest(AI,'AI','cyan');
            interest(system,'system','red');
            interest(theory,'theory','green');
            interest(inter,'inter','burlywood');
            interest(mixed,'mixed','violet');
            interest(none,'none','salmon');
            interest(total,'total','blue');
            var legend = ggg.selectAll(".legend")
                .data(data_legend)
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return "translate(-450," + (i * 15 + 30) + ")"; });  //transform属性便是整个图例的坐标
            legend.append("rect")
                .attr("x", width - 25) //width是svg的宽度，x属性用来调整位置
                // .attr("x", (width / 160) * 157)
                //或者可以用width的分数来表示，更稳定一些，这是我试出来的，下面同
                .attr("y", 8)
                .attr("width", 40)
                .attr("height", 3) //设低一些就是线，高一些就是面，很好理解
                .style("fill", function(d){
                    return d.color
                });
            legend.append("text")
                .attr("x", width - 30)
                // .attr("x", (width / 40) * 39)
                .attr("y", 15)
                .style("text-anchor", "end") //样式对齐
                .text(function(d) {
                    return d.name;
                });
            const lineGenerator = d3.line()
                .x(d=>x(parseInt(d.year)))
                .y(d=>y(d.number));
            ggg.append('path')
                .attr('class','line-path')
                .attr('d',lineGenerator(total))
                .attr('opacity',0.5)
                .attr('visibility',d=>{
                    if(array[0] == 1)
                        return 'visible';
                    else
                        return 'hidden';
                });
            ggg.append('path')
                .attr('class','line-path2')
                .attr('d',lineGenerator(AI))
                .attr('opacity',0.5)
                .attr('visibility',d=>{
                    if(array[1] == 1)
                        return 'visible';
                    else
                        return 'hidden';
                });
            ggg.append('path')
                .attr('class','line-path3')
                .attr('d',lineGenerator(system))
                .attr('opacity',0.5)
                .attr('visibility',d=>{
                    if(array[2] == 1)
                        return 'visible';
                    else
                        return 'hidden';
                });
            ggg.append('path')
                .attr('class','line-path4')
                .attr('d',lineGenerator(theory))
                .attr('opacity',0.5)
                .attr('visibility',d=>{
                    if(array[3] == 1)
                        return 'visible';
                    else
                        return 'hidden';
                });
            ggg.append('path')
                .attr('class','line-path5')
                .attr('d',lineGenerator(inter))
                .attr('opacity',0.5)
                .attr('visibility',d=>{
                    if(array[4] == 1)
                        return 'visible';
                    else
                        return 'hidden';
                });
            ggg.append('path')
                .attr('class','line-path6')
                .attr('d',lineGenerator(mixed))
                .attr('opacity',0.5)
                .attr('visibility',d=>{
                    if(array[5] == 1)
                        return 'visible';
                    else
                        return 'hidden';
                });
            ggg.append('path')
                .attr('class','line-path7')
                .attr('d',lineGenerator(none))
                .attr('opacity',0.5)
                .attr('visibility',d=>{
                    if(array[6] == 1)
                        return 'visible';
                    else
                        return 'hidden';
                });
        }
    );
}
function sunburst(){
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        // pad distances equal to padAngle * padRadius;
        // pad distances equal to padAngle * padRadius;
        // It's split into two parameters
        // so that the pie generator doesn't need to concern itself with radius
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        //.padRadius(radius / 2)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1)
    const render = function(data) {
        const fill = d =>{
            while(d.depth > 1)
                d = d.parent;
            return institutionColors[d.data.institution];
        }
        // const color = d3.scaleOrdinal(d3.schemeCategory10)
        // console.log(color)
        frac = sunb.selectAll('.datapath')
            // this can be simplified as .data(root.descendants().filter(d => d.depth))
            .data(data.descendants().filter(d => d.depth !== 0))
            .join('path')
            .attr('class', (d)=>d.data.institution)
            .attr('opacity',0.6)
            .attr("fill", fill)
            .attr("d", arc)
            .on("mouseover", function (d) {
                console.log(d);
                if(d.depth === 2){
                    let con = '<br/>'
                        + 'Name: ' + String(d.data.name)+ '<br/>'
                        + 'Institution: '+ String(d.data.institution)+ '<br/>'
                //        + '<tr><td>H-index: </td><td>'+ String(d.data[1]) + '<br/>'
                        + 'Citation: '+ String(d.data.citations)+ '<br/>'
                        + 'Average Publication: '+ String(d.data.averagepub)+ '<br/>'
                        + 'Publication: '+ String(d.data.publication)+'<p>';
                    //console.log(place_dict);
                    d3.select('#tooltip').html(con)
                        .style('left', '400px')
                        .style('top', '10px')
                        .style('visibility', 'visible');
                }
                else if(d.depth === 1){
                    let con = "<br/>"+"Institution: "+String(d.data.institution)+'<br/>'+String(d.value.toFixed(2))+'<p>';
                    d3.select('#tooltip').html(con)
                        .style('left', '400px')
                        .style('top', '10px')
                        .style('visibility', 'visible');
                }
                circles.attr('opacity',(e)=>{
                    if(e.school === d.data.institution)
                        return 1;
                    else
                        return 0.2;
                })

                let tt = d3.select(this)
                    .attr('opacity',1);
                console.log(d);
                linki.attr("stroke",(l)=>{
                    if(d.data.institution == l.source && d.data.institution == l.target)
                        return 'none';
                    else if(d.data.institution == l.source)
                        return '#ff7f50';
                    else if(d.data.institution == l.target)
                        return '#008000';
                    else
                        return 'none';
                })
            })
            .on("mouseout", function (e,d) {
                circles.attr('opacity',0.6);
                linki.attr("stroke","#999");
                d3.select(this)
                    .style('fill',fill)
                    .attr('opacity',0.5);
                d3.select('#tooltip')
                    .style('visibility','hidden');
            })
        sunb.selectAll('.datatext')
            .data(data.descendants()
                //.filter(d => d.depth && (d.x1 - d.x0) > Math.PI / 65 && d.data.name.length < 15))
                .filter(d => d.depth===1))
            .join("text")
            .attr('class', 'datatext')
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .attr('font-size', d => d.data.institution.length < 15 ? '.55em' : '.35em' )
            .attr("transform", function(d) {
                const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
                const y = (d.y0 + d.y1) / 2;
                // note that there is an implicit transform inherited from the maingroup;
                return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180? 0 : 180}) 
              translate(0, 5)`;
            })
            // the following code is alternative to the 'translate(0, 5) above; '
            //.attr("dy", "0.35em")
            .text(d => d.data.institution);

    }
    d3.json('./data/people-institution.json').then(
        function(data){
            root = d3.partition().size([2 * Math.PI, 200])
            (d3.hierarchy(data).sum(d => d.averagepub)
                .sort((a, b) => b.averagepub - a.averagepub));
            render(root);
        })
}
function main(){
    map();
    line();
    sunburst();
    d3.select("#form").selectAll(".checkclass")
        .on("click",function(){
            this.checked = !this.checked;
            console.log(this.class);
            console.log('clicked\n');
            ggg.selectAll('circle')
                .style("visibility","hidden");
        });
}

main();
function clicked(){
    array = checkNum();
    ggg.selectAll('.total')
        .attr('visibility',d=>{
            if(array[0] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.AI')
        .attr('visibility',d=>{
            if(array[1] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.system')
        .attr('visibility',d=>{
            if(array[2] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.inter')
        .attr('visibility',d=>{
            if(array[4] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.theory')
        .attr('visibility',d=>{
            if(array[3] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.mixed')
        .attr('visibility',d=>{
            if(array[5] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.none')
        .attr('visibility',d=>{
            if(array[6] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.line-path')
        .attr('visibility',d=>{
            if(array[0] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.line-path2')
        .attr('visibility',d=>{
            if(array[1] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.line-path3')
        .attr('visibility',d=>{
            if(array[2] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.line-path4')
        .attr('visibility',d=>{
            if(array[3] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.line-path5')
        .attr('visibility',d=>{
            if(array[4] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.line-path6')
        .attr('visibility',d=>{
            if(array[5] == 0)
                return 'hidden';
            else
                return 'visible';
        });
    ggg.selectAll('.line-path7')
        .attr('visibility',d=>{
            if(array[6] == 0)
                return 'hidden';
            else
                return 'visible';
        });
}