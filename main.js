let svg = d3.select('#container').select('#mainsvg');
const width = 700;
var array;
const height = 407;
const margin = {top: 70, right: 10, bottom: 10, left: 10};
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const g = svg.append('g').attr('id', 'maingroup')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
const gg = svg.append('g').attr('id', 'dots')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
const ggg = d3.select('#container').select('#linegraph');
const sunb = d3.select('#container').select('#sunburst')
    .attr('viewbox',[0,0,500,500])
    .append('g')
    .attr('transform', `translate(${200}, ${200})`);;
let padding = {'left': 0.2*width, 'bottom': 0.25*height, 'top': 0.13*height, 'right': 0.15*width};
let linchar = './data/resultnew.json';
let root;
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
    .scale(129)//150 originial
    .translate([width / 2, height / 2-50]);
//const projection = d3.geoTransverseMercator();
const pathGenerator = d3.geoPath().projection(projection);
let school_pos = './data/schoollocation.json';
let pos_dict = {};
let place_dict = {};
let dat = null;
// setting up the tip tool;
const tip = d3.tip()
    .attr('class', 'd3-tip').html(function(d) { return d.properties.name });
svg.call(tip);
function get_min_max(data, attr) {
    let min = 1e9;
    let max = 0;
    data.forEach(d => {
        if(!isNaN(d[attr])) {
            let v = d[attr];
            if (v > max)
                max = v;
            if (v < min)
                min = v;
        }
    });
    console.log('attr', attr, 'min', min, 'max', max);

    return [min, max];
}
function main(){
    d3.json(school_pos).then(function(DATA) {
        dat = DATA;
        let schools = dat.schools;
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
            let flag = 0;
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
            total.map((i)=>{
                if (i.number > maxy)
                    maxy = i.number;
            })
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
            //array = checkNum()
            ggg.append('g')
                .attr('transform', `translate(${0}, ${155})`)
                .call(axis_x)
                .attr('font-size', '0.8rem');
            ggg.append('g')
                .attr('transform', `translate(${100}, ${0})`)
                .call(axis_y)
                .attr('font-size', '0.8rem');

            ggg.append('g')
                .selectAll('circle')
                .attr('class','AI')
                .data(total)
                .enter().append('circle')
                .attr('cx',(d,i)=>{return x(AI[i].year)})
                .attr('cy',(d,i)=>{return y(AI[i].number)})
                .attr('r','2')
                .attr('fill','cyan')
                .attr('opacity',0.5)
              /*  .attr('visibility',(d,i)=>{
                    if(array[0] == 0)
                        return 'hidden';
                    else
                        return 'visible';
                })*/
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
                        .style("left", (x(AI[i].year) + 10) + "px")
                        .style("top", (y(AI[i].number) +390) + "px")
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
                .attr('cx',(d,i)=>{return x(system[i].year)})
                .attr('cy',(d,i)=>{return y(system[i].number,maxy)})
                .attr('r','2')
                .attr('fill','red')
                .attr('opacity',0.5)
                .attr('stroke','red')
                .attr('stroke-width',1.5)
                .attr('stroke-linejoin','round')
              /*  .attr('visibility',(d,i)=>{
                    if(array[1] == 0)
                        return 'hidden';
                    else
                        return 'visible';
                })*/
                .attr('stroke-linecap','round')
                .on('mouseover',function(d,i){
                    let txti = "<br/>" + String(system[i].year)+','+String(system[i].number) + "<p>";
                    let tooltip = d3.select("#tooltip");
                    //  console.log(String(schools[i].longitude)+'\n');
                    tooltip.html(txti)
                        //设置tooltip的位置
                        .style("left", (x(system[i].year) + 10) + "px")
                        .style("top", (y(system[i].number) +390) + "px")
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
                .attr('cx',(d,i)=>{return x(theory[i].year)})
                .attr('cy',(d,i)=>{return y(theory[i].number)})
                .attr('r','2')
                .attr('fill','green')
                .attr('stroke','green')
                .attr('opacity',0.5)
                .attr('stroke-width',1.5)
             /*   .attr('visibility',(d,i)=>{
                    if(array[2] == 0)
                        return 'hidden';
                    else
                        return 'visible';
                })*/
                .attr('stroke-linejoin','round')
                .attr('stroke-linecap','round')
                .on('mouseover',function(d,i){
                    let txti = "<br/>" + String(theory[i].year)+','+String(theory[i].number) + "<p>";
                    let tooltip = d3.select("#tooltip");
                    //  console.log(String(schools[i].longitude)+'\n');
                    tooltip.html(txti)
                        //设置tooltip的位置
                        .style("left", (x(theory[i].year) + 10) + "px")
                        .style("top", (y(theory[i].number) +390) + "px")
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
                .attr('cx',(d,i)=>{return x(inter[i].year)})
                .attr('cy',(d,i)=>{return y(inter[i].number,maxy)})
                .attr('r','2')
                .attr('fill','burlywood')
            /*    .attr('visibility',(d,i)=>{
                    if(array[3] == 0)
                        return 'hidden';
                    else
                        return 'visible';
                })*/
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
                        .style("left", (x(inter[i].year) + 10) + "px")
                        .style("top", (y(inter[i].number) +390) + "px")
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
                .attr('cx',(d,i)=>{return x(mixed[i].year)})
                .attr('cy',(d,i)=>{return y(mixed[i].number)})
                .attr('r','2')
                .attr('opacity',0.5)
                .attr('fill','violet')
                .attr('stroke','violet')
             /*   .attr('visibility',(d,i)=>{
                    if(array[4] == 0)
                        return 'hidden';
                    else
                        return 'visible';
                })*/
                .attr('stroke-width',1.5)
                .attr('stroke-linejoin','round')
                .attr('stroke-linecap','round')
                .on('mouseover',function(d,i){
                    let txti = "<br/>" + String(mixed[i].year)+','+String(mixed[i].number) + "<p>";
                    let tooltip = d3.select("#tooltip");
                    //  console.log(String(schools[i].longitude)+'\n');
                    tooltip.html(txti)
                        //设置tooltip的位置
                        .style("left", (x(mixed[i].year) + 10) + "px")
                        .style("top", (y(mixed[i].number) +390) + "px")
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
                .attr('cx',(d,i)=>{return x(none[i].year)})
                .attr('cy',(d,i)=>{return y(none[i].number)})
                .attr('r','2')
                .attr('fill','salmon')
                .attr('opacity',0.5)
                .attr('stroke','salmon')
                .attr('stroke-width',1.5)
            /*    .attr('visibility',(d,i)=>{
                    if(array[5] == 0)
                        return 'hidden';
                    else
                        return 'visible';
                })*/
                .attr('stroke-linejoin','round')
                .attr('stroke-linecap','round')
                .on('mouseover',function(d,i){
                    let txti = "<br/>" + String(none[i].year)+','+String(none[i].number) + "<p>";
                    let tooltip = d3.select("#tooltip");
                    //  console.log(String(schools[i].longitude)+'\n');
                    tooltip.html(txti)
                        //设置tooltip的位置
                        .style("left", (x(none[i].year) + 10) + "px")
                        .style("top", (y(none[i].number) +390) + "px")
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
                .attr('cx',(d,i)=>{return x(total[i].year)})
                .attr('cy',(d,i)=>{return y(total[i].number)})
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
                        .style("left", (x(total[i].year) + 10) + "px")
                        .style("top", (y(total[i].number) +390) + "px")
                        .style("visibility", "visible");
                })
                .on("mouseout", function (e,d) {
                    d3.select(this)
                        .style("fill", 'blue')
                        .attr('opacity',0.5)
                    let tooltip = d3.select("#tooltip");
                    tooltip.style("visibility", "hidden");
                });
            console.log(total);
            const lineGenerator = d3.line()
                .x(d=>x(parseInt(d.year)))
                .y(d=>y(d.number));
            ggg.append('path')
                .attr('class','line-path')
                .attr('d',lineGenerator(total))
            ggg.append('path')
                .attr('class','line-path2')
                .attr('d',lineGenerator(AI))
            ggg.append('path')
                .attr('class','line-path3')
                .attr('d',lineGenerator(system))
            ggg.append('path')
                .attr('class','line-path4')
                .attr('d',lineGenerator(theory))
            ggg.append('path')
                .attr('class','line-path5')
                .attr('d',lineGenerator(inter))
            ggg.append('path')
                .attr('class','line-path6')
                .attr('d',lineGenerator(mixed))
            ggg.append('path')
                .attr('class','line-path7')
                .attr('d',lineGenerator(none))
        }
    );
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
        sunb.selectAll('.datapath')
            // this can be simplified as .data(root.descendants().filter(d => d.depth))
            .data(data.descendants().filter(d => d.depth !== 0))
            .join('path')
            .attr('class', 'datapath')
            .attr("fill", fill)
            .attr("d", arc);
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
            (d3.hierarchy(data).sum(d => d.publication)
                .sort((a, b) => b.publication - a.publication));
            render(root);
        })
    d3.select("form").selectAll(".checkclass")
        .on("click",function(){
            this.checked = !this.checked;
            console.log(this.class);
            console.log('clicked\n');
            //array=checkNum();
            ggg.selectAll('circle')
                .style("visibility","hidden");
        });
}

main();
