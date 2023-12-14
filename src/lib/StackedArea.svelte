<script>

import { scaleLinear, scaleOrdinal, scaleTime} from 'd3-scale';
import { timeFormat} from 'd3-time-format';
import { select, selectAll, pointer } from 'd3-selection'; 
import { stack, area, line } from 'd3-shape';
import { extent, bisector, max, sum } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { brushX } from 'd3-brush';
import { easeLinear } from 'd3-ease';
import { json } from "d3-fetch";
import { onMount } from 'svelte';
import { xDomainValue} from './stores.js';
import { calculateLinesData, createVisProps } from './dataFunctions.js';

let d3 = { scaleLinear, scaleOrdinal, scaleTime, select, selectAll, stack, extent, axisBottom, axisLeft, area, brushX, line, bisector, pointer, timeFormat, max, easeLinear,sum, json} 

export let visSize;
export let data;
export let layout;
export let selectionLabels;
export let id;
export let prefix;
export let compareId;
export let compareColumns;
export let maxValue;
export let asnNamesObject;

let xDomain;

xDomainValue.subscribe(value => {
	xDomain = value;
});

let mounted = false;
let maxResolvers = 0;
let stackedData = [];
let tooltipLine;
let tooltip = d3.select('.tooltipDiv');
let gx, gy;
let innerWidth = 0;
// set the dimensions and margins of the graph
let totalWidth, totalHeight, margin, width, height;
const widthSmall = 380, widthLarge = 500;
$: {
    if (visSize === 'large'){
        if (compareId == '') d3.select(`#visId-${id}_${compareId}`).style('width',widthLarge+"px");
        totalWidth = widthLarge, totalHeight = 350;
        margin = {top: 5, right: 20, bottom: 30, left: 50}
    }
    else {
        if (compareId == '') d3.select(`#visId-${id}_${compareId}`).style('width',widthSmall+"px");
        totalWidth = widthSmall, totalHeight = 250;
        margin = {top: 30, right: 20, bottom: 20, left: 45}      
    }
    width = totalWidth - margin.left - margin.right,
    height = totalHeight - margin.top - margin.bottom;
}

// parse the date / time

var formatDateTime = d3.timeFormat("%Y-%m-%dT%H:%M:%SZ")
var bisectDate = d3.bisector(function(d) { return d.datetime; }).left;

$: maxResolvers = (layout.id == 'totals')?maxValue:100;

//////////
// GENERAL //
//////////

const showProbes = (id.slice(0,3) === "top")?false:true;
const visProps = createVisProps(id, prefix, showProbes);
let linesData = calculateLinesData(data, visProps, showProbes);

const probesColors = ["#00665E","#65830C","#F63107","#2C2D7F","#1FC2D7"];
const resolversColors = (showProbes)?["#00a396","#92BD11","#F96D4D","#585AC6","#95E5F0"]:["#f63107","#f96d4d","#00665e","#00a396","#65830c","#92bd11","#2c2d7f","#585ac6","#1fc2d7","#4cd4e6","#9e2105","#fbae9d","#003d38","#00e0ce","#465c0a","#d5f37c","#15153d","#9596db","#19a1b3","#c9f2f7"]

$: domain = (compareColumns=="")?visProps.totals.filter(d=> d !== "Remaining"):compareColumns;

$: recalculateStackedData(layout.id, data);

function recalculateStackedData(layoutId, data){
    //stack the data
    stackedData = d3.stack()
        .keys(visProps[layoutId])(data)
}
// color palette
$: resColor = d3.scaleOrdinal()
    .domain(domain)
    .range(resolversColors)
    .unknown('#c9c3b6'); //for Remaining

const prbsColor = d3.scaleOrdinal()
    .domain(visProps.totals)
    .range(probesColors)

// Scales

$: x = d3.scaleTime()
    .domain(xDomain)
    .range([margin.left, width + margin.left]);

$: y = d3.scaleLinear()
    .domain([0, maxResolvers])
    .range([totalHeight - margin.bottom, margin.top]);

$: xAxis = (g, x) => g
    .call(d3.axisBottom(x)
        .ticks(width / 100)
        .tickSize(5)
        .tickSizeOuter(0)
        ) 

$: yAxis = (g, y) => g
    .call(d3.axisLeft(y)
            .tickSize(-width)
            .ticks(height/100))
    .call(g => g.select(".domain").remove());

// Area generator
$: chartAreaStacked = d3.area()
    .x( d => x(new Date(d.data.datetime)))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))

$: chartAreaSimple = (x, y, height, value) => d3.area()
    .x( d => x(new Date(d.datetime)))
    .y0(height)
    .y1(d => y(d[value]))

$: lineSimple = d3.line()
            .x( d => x(new Date(d.date)))
            .y( d => y(d.value))

$: {
    if (mounted){
        gx.transition().duration(1000).ease(d3.easeLinear).delay(700).call(xAxis, x);
        gy.transition().call(yAxis, y);
    }
}

onMount(async () => {

    let startWidth = (visSize === 'large')?widthLarge:widthSmall;
    
    if (compareId == '') d3.select(`#visId-${id}_${compareId}`).style('width',startWidth+"px");

    const stackedArea = d3.select(`#visId-${id}_${compareId}.stArea svg`)
    tooltipLine = stackedArea.select('.tooltipLine')

    gx = stackedArea.select('g.xAxis')
    gy = stackedArea.select('g.yAxis')

    mounted =true;
})

function mouseMove(event) {
	var x0 = x.invert(d3.pointer(event,this)[0]),
		i = bisectDate(data, formatDateTime(x0), 1),
		d0 = data[i - 1],
		d1 = data[i],
		d = ((x(x0) - x(new Date(d0.datetime))) > (x(new Date(d1.datetime)) - x(x0))) ? d1 : d0;

    let content = tooltipContent(d,visProps[layout.id]);

    tooltipLine.style('display','block')
    tooltip.html(content).style('display','block')
    
    let divWidth = tooltip.node().getBoundingClientRect().width;
    let divHeight = tooltip.node().getBoundingClientRect().height;

    let xPos= ((event.pageX + 20 + divWidth) < innerWidth)? event.pageX +20 : event.pageX - divWidth -20;

    tooltip
        .style("top", (event.pageY - divHeight/2 - 15) + "px")
		.style("left", xPos  + "px")
    
    tooltipLine
        .attr('x1', x(x0))
        .attr('x2', x(x0))
}

function tooltipContent(d,props){
    let datetime = new Date(d.datetime)
    let content = datetime.toDateString() +"<br>"
    let reversedProps = props.slice().reverse();
    //let remaining = 
    if (layout.id == 'percentages2'){
        let index = reversedProps.indexOf("Remaining_percent2");
        if (index > -1) reversedProps.splice(index,1);
    }
    reversedProps.forEach(k => content += `<div class="legendTtDiv" style='border-left:solid 10px ${resColor(k.replace('_percent2','').replace('_percent',''))}'>${extractLabel(k.replace('_percent2','').replace('_percent',''))} = ${(layout.id == 'totals')?d[k]:d[k].toFixed(2)+'%'}</div>`)
    if (showProbes){
        reversedProps.forEach(k => content += `<div class="legendTtPrbsDiv" style='border-left:solid 5px ${prbsColor(k.replace('_percent2','').replace('_percent',''))}'>${extractProbesLabel(k.replace('_percent2','').replace('_percent',''))} = ${(layout.id == 'totals')?d[k+'_prbs']:d[k+'_prbs'].toFixed(2)+'%'}</div>`)
    }
    return content;
}
function extractLabel(label){
    let row = selectionLabels.filter(d => d.optionId === label);
    if (row.length > 0) return row[0]["labelShort"];
    else return label;
}
function extractProbesLabel(label){
    let row = selectionLabels.filter(d => d.optionId === label);
    return "probes "+row[0]["probesLabel"]+ " " +row[0]["labelShort"];
}
function mouseLeave() {
    tooltip.style('display','none')
    tooltipLine.style('display','none')
}
</script>
<svelte:window bind:innerWidth />
<svg viewBox="0 0 {totalWidth} {totalHeight}" style="display:block;" on:mouseleave={mouseLeave} >
    <clipPath id="clip-{id}_{compareId}">
        <rect x={margin.left} y="{margin.top}" height={height} width={width}></rect>
    </clipPath>
    {#if layout.id.slice(0,7) != "percent"}
    <path 
        clip-path="url(#clip-{id}_{compareId})" 
        class="resolversPath transition"
        d={chartAreaSimple(x, y, totalHeight - margin.bottom, "# resolvers")(data)}>
    </path>
    {:else}
        <rect x={margin.left} y="{margin.top}" height={height} width={width} class="resolversPath" ></rect>
    {/if}
    {#each stackedData as d}
        <path
            clip-path="url(#clip-{id}_{compareId})" 
            class="transition stackedArea"                    
            style="fill: {resColor(d.key.replace('_percent2','').replace('_percent',''))}"
            d={chartAreaStacked(d)}                  
        >
        </path>
    {/each}
    {#each linesData[layout.id] as d}
        <path 
            clip-path="url(#clip-{id}_{compareId})" 
            class="prbsLine transition"                     
            stroke="{prbsColor(d.key.replace('_prbs',''))}"
            d={lineSimple(d.values)}
        >
        </path>
    {/each}
    <rect x={margin.left} y="{margin.top}" height={height} width={width} opacity=0 on:mousemove={mouseMove}></rect>
    <g class="xAxis" transform="translate(0,{totalHeight - margin.bottom})"></g>
    <g class="yAxis" transform="translate({margin.left},0)"></g>
    <line class="tooltipLine" y1="{margin.top}" y2="{totalHeight - margin.bottom}" style="display: none"></line>
    <text class="yaxisTitle" y="{-totalWidth+15}" x="30" transform=rotate(90) >Resolvers</text>
</svg>
<div class="legend d-flex flex-wrap">
  {#if showProbes}
    <div class='legendDiv' style='border-bottom:solid 5px #c9c3b6'>Remaining </div>
  {/if}
  {#each visProps['totals'].slice().reverse() as k}
      <div class={`legendDiv ${extractLabel(k)}`}
        style={`border-bottom:solid 5px ${resColor(k)}`} 
        on:mousemove={(event) => {;
            let name = asnNamesObject[extractLabel(k)]
            if (name !== undefined)
            tooltip.html(name).style('display','block')
            tooltip
              .style("top", (event.pageY - 20) + "px")
		          .style("left", (event.pageX + 10) + "px")
          }
        }
        on:mouseleave={mouseLeave}
      >
        {extractLabel(k)}
      </div>
  {/each}
  {#each visProps['totals'].slice().reverse() as k}
    {#if showProbes}
      <div class="legendPrbsDiv" style={`border-bottom:solid 2px ${prbsColor(k)}`}> {extractProbesLabel(k)}</div>
    {/if}
  {/each}
</div>
<style>
  .transition {
    transition: all 1s linear;
  }
</style>
