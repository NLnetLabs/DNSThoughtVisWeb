<script>
    import { onMount} from 'svelte';
    import { scaleLinear, scaleTime, scaleUtc} from 'd3-scale';
    import { area} from 'd3-shape';
    import { select, selectAll } from 'd3-selection'; 
    import { brushX } from 'd3-brush';
    import { axisBottom} from 'd3-axis';
    import { xDomainValue } from './stores.js';
    import { Button } from 'sveltestrap'

export let visData;

let d3 = { scaleLinear, scaleTime,scaleUtc, area, select, selectAll, brushX, axisBottom }
let idleTimeout;

///for time panel ---
let totalWidth = 450, focusHeight =60,
    margin = {top: 5, right: 2, bottom: 20, left: 2},
    width = totalWidth - margin.left - margin.right;
let xDomain;
xDomainValue.subscribe(value => {
	xDomain = value;
});

let gxFocus, brush, brushGroup;
let mounted = false;

onMount(()=> {

    const focus = d3.select(`.focusBar svg`)
    gxFocus = focus.select(".xAxis")
    gxFocus.call(xAxis, xFocus, focusHeight);
      
    brush = d3.brushX()
              .handleSize(2)
              .on("end", brushended);

    brushGroup = focus.append("g").attr('class','brushSelection')

    // domain x ---
    if (xDomain.length === 0) {
        xDomain = [new Date(visData[0].datetime), new Date(visData[visData.length-1].datetime)];
    }

    brushGroup.call(brush).call(brush.move, [xFocus(xDomain[0]),xFocus(xDomain[1])]);
    mounted = true;
});

const chartAreaSimple = (x, y, height, value) => d3.area()
    .x( d => x(new Date(d.datetime)))
    .y0(height)
    .y1(d => y(d[value]))
    
const xFocus = d3.scaleTime()
    .domain([new Date(visData[0].datetime), new Date(visData[visData.length-1].datetime)])
    .range([margin.left, width + margin.left]);

const y2 = d3.scaleLinear()
    .domain([0, 24000])
    .range([focusHeight - margin.bottom, margin.top])

const xAxis = (g, x) => g
    .call(d3.axisBottom(x)
        .ticks(width / 100)
        .tickSize(5)
        .tickSizeOuter(0)
    )

function updatePeriod(e){
    let startDate;
    if (e.target.value === 'all') startDate = new Date(visData[0].datetime);
    else if (e.target.value === '0') startDate = new Date(new Date(visData[visData.length-1].datetime).setFullYear(new Date(visData[visData.length-1].datetime).getFullYear() - 1))
    else startDate =subtractMonths(Number(e.target.value),new Date(visData[visData.length-1].datetime))
    let selection = [xFocus(startDate),xFocus(new Date(visData[visData.length-1].datetime))]
    brushGroup.call(brush.move, selection)
}
function moveForward(){
    // check if last date after adding one month is not > than actual date
    let firstDateArrow = subtractMonths(-1,xDomain[0])
    let lastDateArrow = (subtractMonths(-1,xDomain[1]).getTime() > new Date(visData[visData.length-1].datetime).getTime())?new Date(visData[visData.length-1].datetime):subtractMonths(-1,xDomain[1]);
    let selection = [xFocus(firstDateArrow),xFocus(lastDateArrow)];
    brushGroup.call(brush.move, selection)
}
function moveBackward(){
    let firstDateArrow = (subtractMonths(1,xDomain[0]).getTime() < new Date(visData[0].datetime).getTime())? new Date(visData[0].datetime):subtractMonths(1,xDomain[0])
    let lastDateArrow = subtractMonths(1,xDomain[1])
    let selection = [xFocus(firstDateArrow),xFocus(lastDateArrow)];
    brushGroup.call(brush.move, selection)
}
function subtractMonths(numOfMonths, date = new Date()) {
    date.setMonth(date.getMonth() - numOfMonths);
    return date;
}

function idled() { idleTimeout = null; }

function brushended({selection}) {
    if(!selection){
        if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
        xDomain = [new Date(visData[0].datetime), new Date(visData[visData.length-1].datetime)];
    }
    else{
        xDomain =[new Date(xFocus.invert(selection[0])), new Date(xFocus.invert(selection[1]))];
    }
    xDomainValue.set(xDomain); 
}
</script>

<div class="row justify-content-center">
    <div class="col-12 col-lg-6">
        <div class="row g-0 justify-content-center justify-content-lg-end">
            <div class="col-auto focusArrow" on:click={moveBackward}>
                <svg width="30" height="30" class="bi bi-caret-left-fill" viewBox="0 0 16 16">
                    <path d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"/>
                  </svg>
            </div>
            <div class="col-auto focusBar">
                <svg width="{totalWidth}" height="{focusHeight}" style="display: block;">
                    <g class="xAxis" transform="translate(0,{focusHeight - margin.bottom})"></g>
                    <g class="yAxis"></g>
    
                    <path 
                        class="focusPath"
                        d={chartAreaSimple(xFocus, y2, focusHeight - margin.bottom, "# resolvers")(visData)}
                    >
                    </path>
                </svg>
            </div>
            <div class="col-auto focusArrow" on:click={moveForward} value="0">
                <svg width="30" height="30" class="bi bi-caret-right-fill" viewBox="0 0 16 16">
                    <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
                  </svg>
            </div>
        </div>
    </div>
    <div class="col-12 col-lg-6">
        <div class="row justify-content-center justify-content-lg-start">
            <div class="col-auto time-button"><Button size="sm" on:click={updatePeriod} value="all">All</Button></div>
            <div class="col-auto time-button"><Button size="sm" on:click={updatePeriod} value="0">1 year</Button></div>
            <div class="col-auto time-button"><Button size="sm" on:click={updatePeriod} value="6">6 months</Button></div>
            <div class="col-auto time-button"><Button size="sm" on:click={updatePeriod} value="3">3 months</Button></div>
            <div class="col-auto time-button"><Button size="sm" on:click={updatePeriod} value="1">1 month</Button></div>            
        </div>
    </div>
</div>
