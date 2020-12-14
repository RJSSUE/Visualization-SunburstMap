let svg = d3.select('#container').select('#mainsvg');
//const width = +svg.attr('width');
//const height = +svg.attr('height');
const width = 700;
const height = 407
const margin = {top: 70, right: 10, bottom: 10, left: 10};
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const g = svg.append('g').attr('id', 'maingroup')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
const gg = svg.append('g').attr('id', 'dots')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
const ggg = d3.select('#container').select('#linegraph')
    .attr('x',100)
    .attr('y',700);
let padding = {'left': 0.2*width, 'bottom': 0.25*height, 'top': 0.13*height, 'right': 0.15*width};
let linchar = './data/resultnew.json';
// convert dataPath to svgPath;
// go to https://github.com/d3/d3-geo for more different projections;
//const projection = d3.geoMercator();
//const projection = d3.geoOrthographic();
//const projection = d3.geoStereographic();
//const projection = d3.geoEquirectangular();
const projection = d3.geoEquirectangular()
    .center([0,30])  // 指定投影中心，注意[]中的是经纬度
    .scale(150)
    .translate([width / 2, height / 2-50]);
//const projection = d3.geoTransverseMercator();
const pathGenerator = d3.geoPath().projection(projection);
let school_pos = './data/schoollocation.json';
let pos_dict = {};
let place_dict = {};
let s_pos = null;
let dat = null;
// setting up the tip tool;
const tip = d3.tip()
    .attr('class', 'd3-tip').html(function(d) { return d.properties.name });
svg.call(tip);
d3.json(school_pos).then(function(DATA) {
    dat = DATA;
    let schools = dat.schools;
    let nodes = dat.nodes;
    let linkis = dat.links;
    let links = [];
    for (i in schools){
        let s = schools[i].longitude;
        let t = schools[i].latitude;
        pos_dict[schools[i].school] = [s,t];
        place_dict[schools[i].school] = projection(pos_dict[schools[i].school]);
        //projection.fitSize([innerWidth,innerHeight],pos_dict[schools[i].school])
        // console.log(pos_dict[schools[i].school]+'\n');
    }
    for(i in linkis){
        let flag = 0
        for(j in schools){
            if(linkis[i].target == schools[j].school || linkis[i].source == schools[j].school){
                flag += 1;
            }
        }
        if(flag == 2){
            links.push(linkis[i]);
        }

    }
    let linki = gg.selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('x1',d=>place_dict[d.source][0])
        .attr('y1',d=>place_dict[d.source][1])
        .attr('x2',d=>place_dict[d.target][0])
        .attr('y2',d=>place_dict[d.target][1])
        .attr("stroke", "#999")
        .join("line")
        .attr('opaque',0.3)
        .attr("stroke-width", d =>0.25*Math.sqrt(d.weight));


    let circles = gg.selectAll('circle')
        .data(schools)
        .enter().append('circle')
        .attr("class","point")
        .attr("cx",(d,i)=>{return place_dict[schools[i].school][0]})
        .attr("cy",(d,i)=>{return place_dict[schools[i].school][1]})
        .attr("r",3)
        .attr("opacity",0.5)
        .on("mouseover", function (d,i) {
            d3.select(this).style("fill", "goldenrod").attr('opacity',1);
            let txt;
            txt = "<br/>" + String(schools[i].school) + "<p>";
            let tooltip = d3.select("#tooltip");
          //  console.log(String(schools[i].longitude)+'\n');
            tooltip.html(txt)
                //设置tooltip的位置
                .style("left", (place_dict[schools[i].school][0] + 10) + "px")
                .style("top", (place_dict[schools[i].school][1] + 10) + "px")
                .style("visibility", "visible");
        })
        .on("mouseout", function (e,d) {
            d3.select(this)
                .style("fill", 'red')
                .attr('opacity',0.5)
            let tooltip = d3.select("#tooltip");
            tooltip.style("visibility", "hidden");
        })
        .style('fill','red');

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
function cx(x){
    return 130.5+(x-1950)/70*1000;
}
function cy(x,maxy){
    return 156-(x*120/(maxy+3));
}
d3.json(linchar).then(
    function(DATA){
        let dati = DATA;
        let maxy = 0;
        let total = dati.total;
        let AI = dati.AI;
        let system = dati.system;
        let theory = dati.theory;
        let inter = dati.inter;
        let mixed = dati.mixed;
        let none = dati.none;
        //console.log(typeof(total[6].number));
        console.log(total.length);
        for (i in total){
            //console.log(total[i].number);
            if (total[i].number > maxy)
                maxy = total[i].number;
        }
        let x = d3.scaleLinear()
            .domain([1950,2020])
            .range([100, 1100]);
        let axis_x = d3.axisBottom()
            .scale(x)
            .ticks(5)
            .tickFormat(d => d);

        // y axis - publications
        let y = d3.scaleLinear()
            .domain([maxy+3,0])
            .range([35,155]);
        let axis_y = d3.axisLeft()
            .scale(y)
            .ticks(10)
            .tickFormat(d => d);
        ggg.append('g')
            .attr('transform', `translate(${30}, ${155})`)
            .call(axis_x)
            .attr('font-size', '0.8rem');
        ggg.append('g')
            .attr('transform', `translate(${130}, ${0})`)
            .call(axis_y)
            .attr('font-size', '0.8rem');

        ggg.append('g')
            .selectAll('circle')
            .attr('class','AI')
            .data(total)
            .enter().append('circle')
            .attr('cx',(d,i)=>{return cx(AI[i].year)})
            .attr('cy',(d,i)=>{return cy(AI[i].number,maxy)})
            .attr('r','2')
            .attr('fill','cyan')
            .attr('opacity',0.5)
            .attr('stroke','cyan')
            .attr('stroke-width',1.5)
            .attr('stroke-linejoin','round')
            .attr('stroke-linecap','round')
            .on('mouseover',function(d,i){
                let txti = "<br/>" + String(AI[i].year)+','+String(AI[i].number) + "<p>";
                let tooltip = d3.select("#tooltip");
                //  console.log(String(schools[i].longitude)+'\n');
                tooltip.html(txti)
                    //设置tooltip的位置
                    .style("left", (cx(AI[i].year) + 10) + "px")
                    .style("top", (cy(AI[i].number,maxy) +390) + "px")
                    .style("visibility", "visible");
            })
            .on("mouseout", function (e,d) {
                d3.select(this)
                    .style("fill", 'cyan')
                    .attr('opacity',0.5)
                let tooltip = d3.select("#tooltip");
                tooltip.style("visibility", "hidden");
            });
        ggg.append('g')
            .selectAll('circle')
            .attr('class','system')
            .data(total)
            .enter().append('circle')
            .attr('cx',(d,i)=>{return cx(system[i].year)})
            .attr('cy',(d,i)=>{return cy(system[i].number,maxy)})
            .attr('r','2')
            .attr('fill','red')
            .attr('opacity',0.5)
            .attr('stroke','red')
            .attr('stroke-width',1.5)
            .attr('stroke-linejoin','round')
            .attr('stroke-linecap','round')
            .on('mouseover',function(d,i){
                let txti = "<br/>" + String(system[i].year)+','+String(system[i].number) + "<p>";
                let tooltip = d3.select("#tooltip");
                //  console.log(String(schools[i].longitude)+'\n');
                tooltip.html(txti)
                    //设置tooltip的位置
                    .style("left", (cx(system[i].year) + 10) + "px")
                    .style("top", (cy(system[i].number,maxy) +390) + "px")
                    .style("visibility", "visible");
            })
            .on("mouseout", function (e,d) {
                d3.select(this)
                    .style("fill", 'red')
                    .attr('opacity',0.5)
                let tooltip = d3.select("#tooltip");
                tooltip.style("visibility", "hidden");
            });
        ggg.append('g')
            .selectAll('circle')
            .attr('class','theory')
            .data(total)
            .enter().append('circle')
            .attr('cx',(d,i)=>{return cx(theory[i].year)})
            .attr('cy',(d,i)=>{return cy(theory[i].number,maxy)})
            .attr('r','2')
            .attr('fill','green')
            .attr('stroke','green')
            .attr('opacity',0.5)
            .attr('stroke-width',1.5)
            .attr('stroke-linejoin','round')
            .attr('stroke-linecap','round')
            .on('mouseover',function(d,i){
                let txti = "<br/>" + String(theory[i].year)+','+String(theory[i].number) + "<p>";
                let tooltip = d3.select("#tooltip");
                //  console.log(String(schools[i].longitude)+'\n');
                tooltip.html(txti)
                    //设置tooltip的位置
                    .style("left", (cx(theory[i].year) + 10) + "px")
                    .style("top", (cy(theory[i].number,maxy) +390) + "px")
                    .style("visibility", "visible");
            })
            .on("mouseout", function (e,d) {
                d3.select(this)
                    .style("fill", 'green')
                    .attr('opacity',0.5)
                let tooltip = d3.select("#tooltip");
                tooltip.style("visibility", "hidden");
            });
        ggg.append('g')
            .selectAll('circle')
            .attr('class','inter')
            .data(total)
            .enter().append('circle')
            .attr('cx',(d,i)=>{return cx(inter[i].year)})
            .attr('cy',(d,i)=>{return cy(inter[i].number,maxy)})
            .attr('r','2')
            .attr('fill','burlywood')
            .attr('stroke','burlywood')
            .attr('opacity',0.5)
            .attr('stroke-width',1.5)
            .attr('stroke-linejoin','round')
            .attr('stroke-linecap','round')
            .on('mouseover',function(d,i){
                let txti = "<br/>" + String(total[i].year)+','+String(total[i].number) + "<p>";
                let tooltip = d3.select("#tooltip");
                //  console.log(String(schools[i].longitude)+'\n');
                tooltip.html(txti)
                    //设置tooltip的位置
                    .style("left", (cx(inter[i].year) + 10) + "px")
                    .style("top", (cy(inter[i].number,maxy) +390) + "px")
                    .style("visibility", "visible");
            })
            .on("mouseout", function (e,d) {
                d3.select(this)
                    .style("fill", 'burlywood')
                    .attr('opacity',0.5)
                let tooltip = d3.select("#tooltip");
                tooltip.style("visibility", "hidden");
            });
        ggg.append('g')
            .selectAll('circle')
            .attr('class','mixed')
            .data(total)
            .enter().append('circle')
            .attr('cx',(d,i)=>{return cx(mixed[i].year)})
            .attr('cy',(d,i)=>{return cy(mixed[i].number,maxy)})
            .attr('r','2')
            .attr('opacity',0.5)
            .attr('fill','violet')
            .attr('stroke','violet')
            .attr('stroke-width',1.5)
            .attr('stroke-linejoin','round')
            .attr('stroke-linecap','round')
            .on('mouseover',function(d,i){
                let txti = "<br/>" + String(mixed[i].year)+','+String(mixed[i].number) + "<p>";
                let tooltip = d3.select("#tooltip");
                //  console.log(String(schools[i].longitude)+'\n');
                tooltip.html(txti)
                    //设置tooltip的位置
                    .style("left", (cx(mixed[i].year) + 10) + "px")
                    .style("top", (cy(mixed[i].number,maxy) +390) + "px")
                    .style("visibility", "visible");
            })
            .on("mouseout", function (e,d) {
                d3.select(this)
                    .style("fill", 'violet')
                    .attr('opacity',0.5)
                let tooltip = d3.select("#tooltip");
                tooltip.style("visibility", "hidden");
            });
        ggg.append('g')
            .selectAll('circle')
            .attr('class','none')
            .data(total)
            .enter().append('circle')
            .attr('cx',(d,i)=>{return cx(none[i].year)})
            .attr('cy',(d,i)=>{return cy(none[i].number,maxy)})
            .attr('r','2')
            .attr('fill','salmon')
            .attr('opacity',0.5)
            .attr('stroke','salmon')
            .attr('stroke-width',1.5)
            .attr('stroke-linejoin','round')
            .attr('stroke-linecap','round')
            .on('mouseover',function(d,i){
                let txti = "<br/>" + String(none[i].year)+','+String(none[i].number) + "<p>";
                let tooltip = d3.select("#tooltip");
                //  console.log(String(schools[i].longitude)+'\n');
                tooltip.html(txti)
                    //设置tooltip的位置
                    .style("left", (cx(none[i].year) + 10) + "px")
                    .style("top", (cy(none[i].number,maxy) +390) + "px")
                    .style("visibility", "visible");
            })
            .on("mouseout", function (e,d) {
                d3.select(this)
                    .style("fill", 'salmon')
                    .attr('opacity',0.5)
                let tooltip = d3.select("#tooltip");
                tooltip.style("visibility", "hidden");
            })
        ggg.append('g')
            .selectAll('circle')
            .attr('class','total')
            .data(total)
            .enter().append('circle')
            .attr('cx',(d,i)=>{return cx(total[i].year)})
            .attr('cy',(d,i)=>{return cy(total[i].number,maxy)})
            .attr('r','2')
            .attr('fill','blue')
            .attr('opacity',0.5)
            .attr('stroke','blue')
            .attr('stroke-width',1.5)
            .attr('stroke-linejoin','round')
            .attr('stroke-linecap','round')
            .on('mouseover',function(d,i){
                let txti = "<br/>" + String(total[i].year)+','+String(total[i].number) + "<p>";
                let tooltip = d3.select("#tooltip");
                //  console.log(String(schools[i].longitude)+'\n');
                tooltip.html(txti)
                    //设置tooltip的位置
                    .style("left", (cx(total[i].year) + 10) + "px")
                    .style("top", (cy(total[i].number,maxy) +390) + "px")
                    .style("visibility", "visible");
            })
            .on("mouseout", function (e,d) {
                d3.select(this)
                    .style("fill", 'blue')
                    .attr('opacity',0.5)
                let tooltip = d3.select("#tooltip");
                tooltip.style("visibility", "hidden");
            });
        let tot=[]
        //console.log(total);
        let f = total.length;
        let ii = 0;
        while (ii < f){
        //    console.log(typeof(ii));
            let va = {}
        //    console.log(total[ii]);
            va.x1 = cx(parseInt(total[ii].year));
            va.y1 = cy(total[ii].number,maxy);
            if(i < f-1){
            //    console.log(i);
                va.x2 = cx(parseInt(total[ii+1].year));
                va.y2 = cy(total[ii+1].number,maxy);
            }
            else{
                va.x2 = cx(total[ii].year);
                va.y2 = cy(total[ii].number,maxy);
            }
            tot.push(va);
          //  console.log(va);
            ii+=1;
        }
        console.log(tot);
        ggg.selectAll("line")
            .data(tot)
            .enter().append("line")
            .attr('x1',(d,i)=>{return tot[i].x1})
            .attr('y1',(d,i)=>{return tot[i].y1})
            .attr('x2',(d,i)=>{return tot[i].x2})
            .attr('y2',(d,i)=>{return tot[i].y2})
            .attr("stroke", "blue")
            .join("line")
            .attr('opacity',1)
            .attr("stroke-width", 4);

    }
);