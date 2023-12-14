<script>
  import { onMount} from 'svelte';
  import { csv } from "d3-fetch";
  import { select, selectAll} from 'd3-selection'; 
  import { max } from 'd3-array';
  import Focus from './lib/Focus.svelte';
  import RadioButtons from './lib/RadioButtons.svelte';
  import RadioButtonsInfo from './lib/RadioButtonsInfo.svelte';
  import { recalculateData } from './lib/dataFunctions.js';
  import StackedAreaContainer from './lib/StackedAreaContainer.svelte';
  import { xDomainValue } from './lib/stores.js';
  import { Button,
            Modal,
            ModalBody,
            ModalHeader 
          } from 'sveltestrap';

let d3 = { csv, select, selectAll, max }
let visData = [], labels =[], groups =[], selectionLabels =[], topCharts =[], groupCharts ={}, singleOptionsLabels=[], compareOptionsLabels=[],compareData={},compareDataTop={}, dataTop ={},asn = [];

let dataLoaded = false, first = true, compareLayout = false;

let visSize = "small";
let maxValue = 0;
let selectedLabel;

let layoutOptions = [{id:'totals',label:"Totals"},{id:'percentages',label:"Percentages"},{id:'percentages2',label:"Percentages without remaining resolvers"}];
let selectedCompareOption;
let headerHeight, interactionAreaHeight, timePanelHeight;
let topCompareColumns = {};
let compareColumns =[]
let shareUrl ='';
let xDomain = [];
let tooltip;
$: innerHeight = 0

const url = window.location.href.split('?')[0];
const local = (url.includes('127.0.0.1') || url.includes('localhost'));

const dataDir =(local)?"./data/":"https://dnsthought.nlnetlabs.nl/";

xDomainValue.subscribe(value => {
	xDomain = value;
});

// reading parameters from url
let url2 = new URL(window.location.href)
let selected = decodeURIComponent(url2.searchParams.get("selected"));
let selectedCharts = (selected != "null" )?selected.split(","):[];
let compare = decodeURIComponent(url2.searchParams.get("compare"));
compareColumns = (compare != "null" )?compare.split(","):[];
let layout = decodeURIComponent(url2.searchParams.get("layout"))
let selectedLayout = (layout != "null")?layoutOptions[layout]:layoutOptions[0]; 
let startDate = decodeURIComponent(url2.searchParams.get("startDate"));
let endDate = decodeURIComponent(url2.searchParams.get("endDate"));
let displayOnly = decodeURIComponent(url2.searchParams.get("displayOnly"));
if (isValidDate(new Date(startDate))) {
  xDomainValue.set([new Date(startDate), new Date(endDate)]);
}

// updating shareUrl when something has changed
 $: {
  let displayOnly = (selectedLabel)?selectedLabel.optionId:undefined
  if (xDomain.length > 0) shareUrl = `?compare=${compareColumns.toString()}&selected=${selectedCharts.toString()}&layout=${layoutOptions.indexOf(selectedLayout)}&displayOnly=${displayOnly}&startDate=${dateForUrl(xDomain[0])}&endDate=${dateForUrl(xDomain[1])}`;
}
const dateForUrl = (date) => date.toISOString().split('T')[0];
function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}
const getData = async(filepath) => {
  if (first) {
      labels = await d3.csv("./data/labelsAll.csv");
      // --- create other arrays related to labels
      groups = [...new Set(labels.map(d=> d.group))];
      labels.forEach(d=> { 
        if(d.id.slice(0,3)==="top") topCharts.push(d.id);
        d.prefix = d.prefixes.split(",");
      })
      groups.forEach(groupName => groupCharts[groupName] = [...new Set (labels.filter(d => d.group == groupName).map(d=> d.id))])
      singleOptionsLabels = labels.filter(d => (d.id.slice(0,3) === "top") || (d.prefix.length === 1) );
      compareOptionsLabels = labels.filter(d => (d.id.slice(0,3) != "top") && (d.prefix.length > 1) );
      ///----
      selectionLabels = await d3.csv("./data/shortAndLongLabels.csv");
      if (displayOnly) selectedLabel = selectionLabels.filter( d => d.optionId === displayOnly)[0];
      ///---
      asn = await d3.csv('./data/asn.csv');
      first=false;
  }
  dataLoaded=false;
  let filepathSlash= (filepath == '')?'':filepath+'/';
  await Promise.all([d3.csv(`${dataDir}${filepathSlash}report-small.csv`),
    d3.csv(`${dataDir}${filepathSlash}${topCharts[0]}.csv`),
    d3.csv(`${dataDir}${filepathSlash}${topCharts[1]}.csv`),
    d3.csv(`${dataDir}${filepathSlash}${topCharts[2]}.csv`),
    d3.csv(`${dataDir}${filepathSlash}${topCharts[3]}.csv`)]
    ).then(function(results){
    visData = results[0];
    for (let i = 1; i< results.length; i++){
      dataTop[topCharts[i-1]] = results[i];
    }
  });
  maxValue = d3.max(visData, d => Number(d['# resolvers']))
  if (selectedCharts.length) displaySelected();
  dataLoaded =true;

  if (compareColumns.length > 0 && compareColumns[0] !== '') {
    loadDataCompare(compareColumns)
    selectedLabel = undefined; //unselect "display only"
    compareLayout = true;
    // define selectedCompareOption
    if (compareColumns[0] === 'is_internal') selectedCompareOption = labels.filter(d => d.id === 'int_fwd_ext')[0];
    else {
      let id = compareColumns[0].split('_')[1];
      selectedCompareOption = labels.filter( d => d.id === id)[0];
    }
  }
  if (displayOnly !== undefined) selectedLabel = singleOptionsLabels.filter( d => d.optionId === displayOnly)[0];

}

const loadDataCompare = async(filepaths) => {
  maxValue = 0; // reset maxValue before loading data
  // initializing topCompareColumns for each topChart
  topCharts.forEach(chart => {topCompareColumns[chart] = []})
  await filepaths.forEach( async(filepath) => {
    let resultsArray =[];
    let filepathSlash= (filepath == '')?'':filepath+'/';
    await Promise.all([d3.csv(`${dataDir}${filepathSlash}report-small.csv`),
      d3.csv(`${dataDir}${filepathSlash}${topCharts[0]}.csv`),
      d3.csv(`${dataDir}${filepathSlash}${topCharts[1]}.csv`),
      d3.csv(`${dataDir}${filepathSlash}${topCharts[2]}.csv`),
      d3.csv(`${dataDir}${filepathSlash}${topCharts[3]}.csv`)]
      )
      .then(function(results){
        resultsArray =results;
      })
    compareData[filepath] = resultsArray[0];
    compareDataTop[filepath] = {};
    for (let i = 1; i < resultsArray.length; i++){
      compareDataTop[filepath][topCharts[i-1]] = resultsArray[i];
      topCompareColumns[topCharts[i-1]].push(...resultsArray[i].columns);
      ["datetime","Remaining"].forEach(value=> {
        const index = topCompareColumns[topCharts[i-1]].indexOf(value);
        if (index > -1)topCompareColumns[topCharts[i-1]].splice(index,1)
      })
      topCompareColumns[topCharts[i-1]] = [...new Set(topCompareColumns[topCharts[i-1]])]
    }
    let newMax = d3.max(compareData[filepath], d => Number(d['# resolvers']))
    maxValue = (newMax > maxValue)?newMax:maxValue;
  })
}

onMount(()=> {
  tooltip = d3.select('.tooltipDiv');
  if (displayOnly !== 'undefined' && displayOnly !== 'null') getData(displayOnly);
  else getData("");
});

function displaySelected(){
  visSize = "large";
  window.scrollTo(0, 0);
}

function resetDisplay(){
  compareLayout = false;
  visSize = "small";
  selectedCharts =[];
  displayAllData();
}

function displayAllData(){
  selectedLabel=undefined;
  selectedCompareOption=undefined;
  compareLayout = false;
  compareColumns=[];
  getData("");
}

function handleSubmitOptionSelection(filePrefix){
  compareColumns = [];
  selectedCompareOption=undefined;
  compareLayout = false;
  getData(`${filePrefix+selectedLabel.optionId}`)
}
function handleSubmitOptionCompare(e){
  let id = e.detail.value.id;
  let prefixes = e.detail.value.prefix;
  compareColumns = prefixes.map(d => ((id != 'int_fwd_ext') && (id.slice(0,3) != "top"))? `${d}_${id}`:d);
  loadDataCompare(compareColumns);
  selectedLabel = undefined; //unselect "display only"
  compareLayout = true;
}

function createOptionsArray(id){
  if (id === 'int_fwd_ext')return selectionLabels.filter(d => d.optionId.split("_",1)[0] === 'is')
  else if (id.slice(0,3) === "top") {
    let optionsArray =[]
    let array = labels.filter(d=> d.id === id)[0]["prefix"]
    array.forEach(topId => optionsArray.push({optionId:topId, labelShort:topId, label:topId,}))
    return optionsArray;
  }
  else return selectionLabels.filter(d => d.optionId.replace(d.optionId.split("_",1)[0]+"_",'') == id )
}
function selectGroupCharts(e, group){
  if (e.target.checked) selectedCharts = [... new Set(selectedCharts.concat(groupCharts[group]))];
  else selectedCharts = removeItemsOnce(selectedCharts,groupCharts[group]);
}
function removeItemsOnce(arr, valuesArray) {
  valuesArray.forEach(value => {
    var index = arr.indexOf(value);
    if (index > -1) arr.splice(index, 1);
  })
  return arr;
}
function makeTitleCompare(compareColumns){
  let title ='Comparing resolvers that: ';
  compareColumns.forEach((column,i) => {
    title += selectionLabels.filter(d=> d.optionId === column)[0].label;
    if (i == compareColumns.length-2) title += ' and '
    else if (i < compareColumns.length-2) title += ', '
  })
  return title;
}
function makeTitleDisplayOnly(selectedLabel){
  let title = 'Displaying resolvers that: ';
  title += selectedLabel.label;
  return title
}
function top10Prefix(data) {
  let prefixes = [...new Set(data.columns)];
  let index = prefixes.indexOf('datetime');
  prefixes.splice(index,1);
  return prefixes;
}
function controlGroupSelect(e){ 
  if (!e.target.checked){
    let id = e.target.defaultValue;
    let group = labels.filter(d=> d.id === id)[0]['group'];
    let index = groups.indexOf(group);
    document.querySelector('#group-'+index).checked = false;
  }
}
/// for modal share
let open = false;
const toggle = () => (open = !open);

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(url+shareUrl);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}
</script>

<svelte:head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="css/app.css">
  <link rel="stylesheet" href="https://use.typekit.net/cxt3dey.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet"> 
</svelte:head>
<svelte:window bind:innerHeight />

<main>
  <div class ="container-fluid">
    <div bind:clientHeight={interactionAreaHeight} class="interactionArea sticky-top row">
      <div class="col">
        <div class="row justify-content-center">
          <div class="col-auto layoutOptions">
            <RadioButtons optionsArray={layoutOptions} id="id" label="label" bind:selectedOption={selectedLayout} />
          </div>
          <div class="col-auto buttonsInteraction">
            <Button color="primary" size="lg" class="{(visSize === 'small')?'d-none':''} " on:click={resetDisplay}>Display all charts</Button>
            <Button color="primary" size="lg" class="{(visSize === 'large')?'d-none':''} " disabled={(selectedCharts.length === 0)?true:false} on:click={displaySelected} >Compare selected charts</Button>
          </div>
          <div class="col-auto buttonsInteraction">
            <!-- Button trigger modal -->
            <Button class="{(visSize === 'small')?'d-none':''} " style="margin-top:6px" on:click={toggle}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-share" viewBox="0 0 16 16">
              <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
            </svg></Button>
            <!-- Modal -->
            <Modal isOpen={open} {toggle}>
              <ModalHeader {toggle}>
                  <h5 class="modal-title">Share</h5>
              </ModalHeader>
              <ModalBody>
                <p>Copy link</p>
                <div class="field d-flex align-items-center justify-content-between">
                    <input type="text" value={url+shareUrl} style='width: 490px'>
                    <Button on:click={copyContent}>Copy</Button>
                </div>
              </ModalBody>
            </Modal>
          </div>
        </div>
      </div>
    </div>
    <div class="{visSize}Display row">
      <!------------- left side area for second screen --------------->
      <div class="{(visSize == "small")?'d-none':'col-2'} filterDiv" style="height: {innerHeight - (headerHeight + interactionAreaHeight + timePanelHeight)}px">
        <Button outline size="sm" class="{(selectedLabel === undefined)?'d-none':''} btn-green">{@html (selectedLabel === undefined)?'':selectedLabel.labelShort}
          <span on:click={displayAllData} class="close" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </span>
        </Button>
        <Button outline size="sm" class="{(selectedCompareOption === undefined)?'d-none':''} btn-green">{@html (selectedCompareOption === undefined)?'':selectedCompareOption.label}
          <span on:click={displayAllData} class="close" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </span>
        </Button>
        {#if visSize == 'large'}
        <!---- split radios -->
          <div class="filterTitle">Split resolvers on:</div>
          <div class="filterOptionsDiv">
            <fieldset>
              <RadioButtons optionsArray={compareOptionsLabels.filter(d => !selectedCharts.includes(d.id) && d.compare == 'split')} id="id" label="label" bind:selectedOption={selectedCompareOption} on:submit={handleSubmitOptionCompare}/>
            </fieldset>
          </div>
        <!---- filter radios -->
          <div class="filterTitle">Filter resolvers on support for:</div>
          <div class="filterOptionsDiv">
            <fieldset>
              <RadioButtons optionsArray={compareOptionsLabels.filter(d => !selectedCharts.includes(d.id) && d.compare != 'split')} id="id" label="label" bind:selectedOption={selectedCompareOption} on:submit={handleSubmitOptionCompare}/>
            </fieldset>
          </div>
        <!---- display only radios  -->
          <div class="filterTitle">Display only:</div> 
          {#each singleOptionsLabels as item}
            {#if !selectedCharts.includes(item.id)}
            <!--including options only for not selected charts -->
              <div class="filterOptionsDiv">{item.label}
                <fieldset>
                  <RadioButtonsInfo optionsArray={createOptionsArray(item.id)} id="optionId" label="labelShort" info="label" disabled="{(item.disabled === 'TRUE')?'disabled':''}" bind:selectedOption={selectedLabel} on:submit={handleSubmitOptionSelection(item.filePrefix)} />
                </fieldset>
              </div>
            {/if}
          {/each}
        {/if}
      </div> 
      <!------------- right side area for second screen ---------------> 
      {#if dataLoaded && !compareLayout && asn !== undefined}
        <div class="{(visSize == 'small')?'col-12':'col-10'} visRightSide" style="height: {(visSize == 'small')?'auto':innerHeight - (headerHeight + interactionAreaHeight + timePanelHeight )}px">
          {@html (selectedLabel)?`${makeTitleDisplayOnly(selectedLabel)}`:''}
          <div class="d-flex flex-wrap justify-content-center">
          {#each groups as group, i}
            <div class="col-12 groupTitle {(visSize == "small")?'':'d-none'}">
                <h2 class="home-title">{group}</h2>
                <label for="group-{i}" class="form-check-label select-all">Select all </label><input class="form-check-input" type="checkbox" value="group-{i}" id="group-{i}" 
                on:change={selectGroupCharts(event,group)} >
            </div>
            {#each labels.filter(d => d.group == group) as item}
              <div class="chartDiv {((selectedCharts.includes(item.id)))?"selectedChart":""}" id="divId-{item.id}">
                <div class="row g-0 chartInteractionBar justify-content-between">
                  <div class="col-auto title"><h4>{item.label}</h4></div>
                  <div class="col-auto rightSide {(visSize === 'small')?'':'d-none'}">
                    <input class="form-check-input" type="checkbox" value="{item.id}" id="{item.id+"_check"}" bind:group={selectedCharts} on:change={controlGroupSelect}>
                  </div>
                </div>
                <StackedAreaContainer 
                  data= {(item.id.slice(0,3) != "top")?recalculateData(visData,item.id, item.prefix,true):recalculateData(dataTop[item.id],item.id,top10Prefix(dataTop[item.id]),false)} 
                  layout = {selectedLayout}
                  selectionLabels = {selectionLabels}
                  id = {item.id}
                  prefix = {(item.id.slice(0,3) != "top")?item.prefix:top10Prefix(dataTop[item.id])}
                  compareId = ""
                  compareColumns =""
                  maxValue = {maxValue}
                  visSize = {visSize}
                  asnNames ={asn}
                />
                </div>
              {/each}
            {/each}
          </div>
        </div>
      {/if}
      <!--- alternative screen for compare-->
      {#if compareLayout}
      <div class="col-10 visRightSide">
          {#each labels.filter(d => selectedCharts.includes(d.id)) as item,j}
          <div class="row justify-content-xl-center ">
            <div class="{(compareColumns.length === 2)?'col-xxl-10':''} col-12">
              {@html (j === 0)?`${makeTitleCompare(compareColumns)}`:''}
              <div class="chartDiv {((selectedCharts.includes(item.id)))?"selectedChart":""}">
                <div class="row chartInteractionBar justify-content-center">
                  <div class="col-auto title">{item.label}</div>
                </div>
                <div class="row g-0 compareRow">
                  {#each compareColumns as compareColumn,i}
                  {#if compareData[compareColumn]}
                  <div class="{(compareColumns.length === 2)?'col-6':'col-4'} compareColumn {(i>0)?'compareSeparator':''}">
                    <StackedAreaContainer 
                      data= {(item.id.slice(0,3) != "top")?recalculateData(compareData[compareColumn],item.id,item.prefix,true):recalculateData(compareDataTop[compareColumn][item.id],item.id,top10Prefix(compareDataTop[compareColumn][item.id]),false)}
                      layout={selectedLayout}
                      selectionLabels = {selectionLabels}
                      id ={item.id}
                      prefix = {(item.id.slice(0,3) != "top")?item.prefix:top10Prefix(compareDataTop[compareColumn][item.id])}
                      compareId = {compareColumn}
                      compareColumns = {(item.id.slice(0,3) == "top")?topCompareColumns[item.id]:""}
                      maxValue ={maxValue}
                      visSize = {visSize}
                      asnNames ={asn}               
                    />
                  </div>
                  {/if}
                  {/each}
                </div>
              </div>
            </div>
          </div>
          {/each}
        </div>
        <!--- end compare -->
        {/if}
      {#if dataLoaded}
      <div class="fixed-bottom timePanel" style= "display:{(visSize=='small')?'none':'block'}" bind:clientHeight={timePanelHeight}>
        <Focus visData ={visData} />
      </div>
      {:else}
        <div class="col-10 text-center" style="margin-top:200px">
          <div class="spinner-border" role="status">
          </div>
        </div>
      {/if}
    </div>
  </div>
</main>
<div class="tooltipDiv arrow_box">
</div>
