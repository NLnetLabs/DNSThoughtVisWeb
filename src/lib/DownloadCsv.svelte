<script>

import { Button } from "sveltestrap";

export let data;
export let name;

function downloadFile(){
    let csv = '';
    for(let row = 0; row < data.length; row++){
        let keysAmount = Object.keys(data[row]).length
        let keysCounter = 0

        // If this is the first row, generate the headings
        if(row === 0){
        // Loop each property of the object
            for(let key in data[row]){
                // This is to not add a comma at the last cell
                // The '\r\n' adds a new line
                csv += key + (keysCounter+1 < keysAmount ? ',' : '\r\n' )
                keysCounter++
            }
        }
        else{
            for(let key in data[row]){
                csv += data[row][key] + (keysCounter+1 < keysAmount ? ',' : '\r\n' )
                keysCounter++
            }
        }
        keysCounter = 0
    }

    var blob = new Blob([csv], {type: "text/csv"});
    
    var url = window.URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name+".csv";
    
    anchor.click();
    window.URL.revokeObjectURL(url);
    anchor.remove();
}


</script>

<Button size="sm" class="iconContainer" title="Download csv file" on:click={downloadFile} >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#FFF"  class="bi bi-download" viewBox="0 0 16 16">
      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
      <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
    </svg>
</Button>

