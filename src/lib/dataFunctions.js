import { sum } from 'd3-array';
let d3 = { sum };

export function createVisProps(id, prefixes, showProbes){
    const visProps = {};

    //for top10 and int_fwd_ext the prefixes are the names of the columns
    visProps.totals = prefixes.map(d => ((id != 'int_fwd_ext') && showProbes)? `${d}_${id}`:d); 
    let columns = [...visProps.totals]; 

    //copy of visProps after adding prbs it's used for the tooltip content
    if (showProbes) visProps.totals.forEach(key => columns.push(key+"_prbs"));
    visProps.percentages = visProps.totals.map( d => d+'_percent');
    visProps.percentages2 = visProps.totals.map( d => d+'_percent2');
    return visProps;
}

export function recalculateData(allData, id, prefix, showProbes){
    /// calculating percentages and filtering only needed data
    const basicColumns = (showProbes)?["datetime","# probes","# resolvers"]:["datetime"];
    let visProps = createVisProps(id, prefix,showProbes);
    let data = [];

    allData.forEach( datarow => {
        let d ={};
        let sumResolvers = (showProbes)? datarow['# resolvers']:d3.sum(visProps.totals, key => datarow[key] )// only necessary for top10 files because there's no column #resolvers
        let sumResolversNoRem = (showProbes)?d3.sum(visProps.totals, key => datarow[key]):(sumResolvers - datarow['Remaining']);
        if (showProbes) var sumPrbs = d3.sum(visProps.totals, key => datarow[key+'_prbs'] ) //for not top10 files 
        basicColumns.forEach(key => d[key]=datarow[key])
        visProps.totals.forEach(key =>{
            d[key] = +datarow[key]
            // percent calculation (= 0 is sumResolvers = 0)
            d[key+'_percent'] = (sumResolvers > 0 )?datarow[key]/sumResolvers * 100:0;

            // percent2 calculation
            if (key == 'Remaining') d[key+'_percent2'] = 0;
            else d[key+'_percent2'] = (sumResolversNoRem > 0)?datarow[key]/sumResolversNoRem * 100:0

            if(showProbes){
                d[key+'_prbs']= +datarow[key+'_prbs'];
                d[key+'_percent_prbs'] = datarow[key+'_prbs']/datarow['# probes']*100;
                d[key+'_percent2_prbs'] = (sumPrbs > 0)?datarow[key+'_prbs']/sumPrbs*100:0;
            }
        })
        data.push(d);
    }) 
    return data;
}
export function calculateLinesData(data, visProps, showProbes){
    let linesData = {};
    linesData.totals = [];
    linesData.percentages = [];
    linesData.percentages2 = [];
    if (showProbes){
        /// calculating lines data
        visProps.totals.forEach(key => {
            let lineData = data.map(k => ({"date" : k.datetime, "value": k[key+'_prbs']}))
            let lineDataPercent = data.map(k => ({"date" : k.datetime, "value": k[key+'_percent_prbs']}))
            let lineDataPercent2 = data.map(k => ({"date" : k.datetime, "value": k[key+'_percent2_prbs']}))           
            linesData.totals.push({key:key+'_prbs', values:lineData})
            linesData.percentages.push({key:key+'_prbs', values:lineDataPercent})
            linesData.percentages2.push({key:key+'_prbs', values:lineDataPercent2})
        })
    }
    return linesData;
}
