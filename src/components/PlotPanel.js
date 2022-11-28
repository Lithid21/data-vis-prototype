import React, {useState,useEffect} from 'react';

import { fetchEnvData } from '../utils/fetchEnvData';
import Plot from "../components/Plot";
import '../styles/PlotPanel.css';

function PlotPanel (props) {
    const [plotData, setPlotData] = useState(null);

    //// Effect: when selectedState changed, update the data
    useEffect( () => {
        if(!props.accessToken)
            return;
        fetchEnvData('covid_timed',props.selectedState,props.accessToken).then(covidData =>{
            let cleanedData = covidData.map(row=> {
                row.cases = row.cases ? parseInt(row.cases) : 0;
                row.vaccinations = row.vaccinations ? parseInt(row.vaccinations) : 0;
                return row;
            });
            setPlotData(cleanedData);
        }).catch(e => {
                console.log(e);
                setPlotData(null);
        }); // End of covid data fetch .then()

    },[props.selectedState,props.accessToken]);

    return (
        <>
        <Plot data={plotData}/>
        </>
    );
}

export default PlotPanel;