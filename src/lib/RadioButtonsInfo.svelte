<script>
    import { createEventDispatcher } from 'svelte';
    import { select } from 'd3-selection'; 

    let d3={select};

	export let optionsArray;
    export let selectedOption;
    export let disabled;
    export let id;
    export let label;
    export let info;

    let element;
    let tooltip = d3.select('.tooltipDiv');

	const dispatch = createEventDispatcher();

    function submit(){
        dispatch('submit', 
        {value: selectedOption,
        element: element});
    }
    function mouseMoveOption(event, info) {
        tooltip.html(info).style('display','block')
        tooltip
            .style("top", (event.pageY - 15) + "px")
            .style("left", (event.pageX + 20)  + "px")
    }
    function mouseLeave() {
        tooltip.style('display','none')
    }
</script>

{#each optionsArray as option,i}
    <div>
        <input type=radio value={option[id]} id={option[id]} checked = {selectedOption === option} {disabled} on:change={()=> {selectedOption = option; element=i ; submit()}} />
        <label for={option[id]} class="form-check-label" on:mousemove={mouseMoveOption(event, option[info])} on:mouseleave={mouseLeave}> 
            {@html option[label]}
        </label>
    </div>
{/each}
<style>
input[type=radio] {
    float: left;
    margin-top: 5px;
}
label {
    margin-left: 20px;
    display: block;
}
</style>
