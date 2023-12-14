<script>

import StackedArea from './StackedArea.svelte';
import DownloadCsv from './DownloadCsv.svelte';

export let data;
export let visSize;
export let layout;
export let selectionLabels;
export let id;
export let prefix;
export let compareId;
export let maxValue;
export let compareColumns;
export let asnNames;
let asnNamesObject = {};
if (id ==='top_auth_asns' || id === 'top_nxhj_asns' || id === 'top_resolver_asns' || id === 'top_probe_asns'){
  prefix.filter(k => k !=='Remaining').forEach(k => {
    let name = asnNames.filter(d => d.code === k.replace('AS',''))[0].name
    asnNamesObject[k] = name;
  })
}
</script>

<div class="row {(compareId != '')?'justify-content-between':'justify-content-end'} iconsContainerDiv {(visSize === 'large')?'':'d-none'}">
    {#if compareId != ''}<div class="col-10 g-0 compareColumnTitle">{@html selectionLabels.filter(d=> d.optionId === compareId)[0].label}</div>{/if}
    <div class="col-auto g-0"><DownloadCsv data={data} name={id} /></div>
</div>
<div id= "visId-{id}_{compareId}" class="stArea" >
<StackedArea 
  visSize = {visSize} 
  data= {data}
  layout={layout}
  selectionLabels = {selectionLabels}
  id ={id}
  prefix = {prefix}
  compareId = {compareId}
  compareColumns = {compareColumns}
  maxValue ={maxValue} 
  asnNamesObject = {asnNamesObject}
/>
</div>