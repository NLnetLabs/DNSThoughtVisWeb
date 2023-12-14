<script>
    import { createEventDispatcher } from 'svelte';

	export let optionsArray;
    export let selectedOption;
    export let id;
    export let label;

    let element;

	const dispatch = createEventDispatcher();
    function submit(){
        dispatch('submit', 
        {value: selectedOption,
        element: element});
    }
</script>

{#each optionsArray as option,i}
    <div>
        <input type=radio value={option[id]} id={option[id]} checked = {selectedOption === option} on:change={()=> {selectedOption = option; element=i ; submit()}} />
        <label for={option[id]} class="form-check-label"> 
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
