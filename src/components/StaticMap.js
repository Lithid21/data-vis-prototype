import React, { useRef, useEffect, useState } from "react";

import esriId from "@arcgis/core/identity/IdentityManager";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";

import Legend from "@arcgis/core/widgets/Legend";
import Fullscreen from "@arcgis/core/widgets/Fullscreen";
import LayerList from "@arcgis/core/widgets/LayerList";

import "../styles/StaticMap.css";
import userEvent from "@testing-library/user-event";

function BuiltMap(props) {

    const mapDiv = useRef(null);
    const [token,setToken] = useState('');
  
    // Getting the token
    useEffect(()=> {
        ///// Will's OAuth
        const clientId = "w6lIDWNWL3EmLRkJ";
        const clientSecret = "a174ae801bcf41fc8ce361827816f1fa";
        ///// JP's OAuth
        //   const clientId = "q3224G4yMQPVZUqd";
        //   const clientSecret = "e84b18bfa0c84f21a50facbd4cd40756";
    
        // for the body of the token request
        const parameters = new FormData(); 
        parameters.append('f', 'json');
        parameters.append('client_id', clientId);
        parameters.append('client_secret', clientSecret);
        parameters.append('grant_type', 'client_credentials');
        parameters.append('expiration', 1440);    
    
        // POST to token endpoint, then register the token after it is received.
        fetch("https://www.arcgis.com/sharing/rest/oauth2/token/",{ method: 'POST', body:parameters })
            .then( (response) => {
            return response.json();
            })
            .then( tokenJSON => {
            setToken(tokenJSON.access_token); //Sets the token state
            const regProps = {
                server: "https://www.arcgis.com/sharing/rest",
                token: tokenJSON.access_token
            };
            esriId.registerToken(regProps); //Registers the token to the IdentityManager
            })
            .catch( (e) => console.log(e));
        
        return () => {};
    },[]);

    // Load the map
    useEffect( () => {
        let view;
        if (mapDiv.current && token){
            const map = new Map({
                basemap: "dark-gray-vector"
              });
    
            view = new MapView({
                map: map,
                container: mapDiv.current,
                ui: {
                  components: []  // Removes the default components: zoom and attribution
                },
                center: [-75.165,40.003],
                zoom: 9
            });

            //////////////////////////
            // Census Layer
            //////////////////////////

            /////////
            // Census Layer properties
            /////////
            const censusPopupTemplate = {   // autocasts as new PopupTemplate()
                title: "Census County",
                content: [{
                type: "fields",
                fieldInfos: [
                    {
                    fieldName: "FIPS",
                    label: "FIPS",
                    visible: true
                    },
                    {
                    fieldName: "POPULATION",
                    label: "Population in Census Data",
                    visible: true
                    }
                ]
                }]
            };

            const censusRenderer = {
                type: "simple",
                symbol: {
                type: "simple-fill", // autocasts as new SimpleFillSymbol()
                },
                label: "Population",
                visualVariables: [
                {
                    type: "color",
                    field: "POPULATION",
                    stops: [
                    {
                        value: 20000,
                        color: "#c5aee6",
                        label: "< 20,000"
                    },
                    {
                        value: 50000,
                        color: "#8d5ad6",
                        label: "< 50,000"
                    },
                    {
                        value: 100000,
                        color: "#631cc9",
                        label: "100,000+"
                    }
                    ]
                }
                ]
            };

            /////////
            // Census Layer grabbing
            /////////
            const censusLayer = new FeatureLayer({
                // url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Tracts/FeatureServer/0", // JP's census tract map
                // url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Census_Tracts/FeatureServer/0", // "Will's" census tract map
                url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Counties/FeatureServer/0", // "Will's" county map
                // url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_States/FeatureServer/0", // "will's" state map
                // outFields: ["STCOFIPS","POPULATION"], // For JP's census map
                outFields: ["FIPS","POPULATION"],  //For county map, this is combined state-county FIPS
                // outFields: ["*"],
                popupTemplate: censusPopupTemplate,
                opacity: 0.5,
                id: "census-layer",
                renderer: censusRenderer
            });
            map.add(censusLayer);

        }
        return () => view?.destroy();
    },[token]);

    return (<div className="staticMap" ref={mapDiv}></div>);
}

export default BuiltMap;