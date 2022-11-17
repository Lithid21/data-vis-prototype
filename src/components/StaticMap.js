import React, { useRef, useEffect, useState } from "react";

import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";

// utils
import "../styles/StaticMap.css";
import { authorizeEsriId } from "../utils/auth.js";
import { fetchGeoLayer } from "../utils/fetchGeoLayer.js";
import { fetchEnvData } from "../utils/fetchEnvData.js";
import { getSelectedGeoData } from "../utils/getSelectedGeoData.js";
import { createMapView } from "../utils/createMapView.js";

function StaticMap(props) {
    const mapDiv = useRef(null);
    const [token,setToken] = useState(null);  // ArcGIS OAuth token
    const [geoLayer, setGeoLayer] = useState(null);   // FeatureLayer with county geospatial data
    // geoData for the current state
    const [selectedGeoData, setSelectedGeoData] = useState(null);   // objected with keys: features, centroids
    // Raw data for layers from API for current state
    const [censusData, setCensusData] = useState(null);
    const [covidData, setCovidData] = useState(null);
    const [fluData, setFluData] = useState(null);
    // map state
    const [view, setView] = useState(null);
  
    ///// Effect: Getting the token
    useEffect(()=> {
        setToken(authorizeEsriId());
    },[]);

    ///// Effect: Grab the base geo data layer
    useEffect( () => {
        // Don't run this effect without a token
        if(!token){
            return;
        }
        setGeoLayer(fetchGeoLayer());
    },[token]);

    ///// Effect: Get all the data required for the state via API and queryFeatures()
    useEffect(()=>{
        // Don't run this without a token and geolayer
        if(!token || !geoLayer){
            return;
        }
        //////////////////////////
        // API Calls for state's data by county (census, covid, & flu)
        //////////////////////////

        // Census Demographic Data
        fetchEnvData('census',props.selectedState).then(response => setCensusData(response));
        // Covid Data
        fetchEnvData('covid',props.selectedState).then(response => setCovidData(response));
        // Flu Data
        fetchEnvData('flu',props.selectedState).then(response => setFluData(response));

        // Get the selected state's geo data (polyfill and centroid) from the county map layer
        getSelectedGeoData(geoLayer,props.selectedState).then(response => setSelectedGeoData(response));

    },[token,props.selectedState,geoLayer]);

    ///// Effect: Creates the mapView
    useEffect( () => {
        setView(createMapView(mapDiv.current));
    },[]);
    
    // console.log("census data");
    // console.log(censusData);
    // console.log("covid data");
    // console.log(covidData);
    // console.log("flu data");
    // console.log(fluData);

    ///// Effect: Map & view rendering
    useEffect( ()=> {
        if(mapDiv.current && censusData && covidData && fluData && selectedGeoData && view){
            // Move the view to the collection of features
            view.goTo(selectedGeoData.features);

            //////////////////////////
            // Census Layer (county geo data + census county demographic info)
            //////////////////////////

            ////////
            // Merge county geo data & census county data
            ////////
            const mergedData = selectedGeoData.features.map((f,index) => {
                const matchedData = censusData.find(county => county.fips === f.attributes.FIPS);
                let newF = f;
                if(matchedData){
                    newF.attributes = {
                        objectId: index,
                        fips: f.attributes.FIPS,
                        population: matchedData.population,
                        medianIncome: matchedData.median_income,
                    }
                } else {
                    newF.attributes = {
                        objectId: index,
                        fips: f.attributes.FIPS,
                        population: 0,
                        medianIncome: 0
                    }
                }
                return newF;
            });
            // console.log(mergedData);

            /////////
            // Census Layer properties
            /////////
            const censusPopupTemplate = {   // autocasts as new PopupTemplate()
                title: "{County Name}",
                content: [{
                    type: "fields",
                    fieldInfos: [
                        {
                            fieldName: "fips",
                            label: "FIPS",
                            visible: true
                        },
                        {
                            fieldName: "population",
                            label: "Population",
                            visible: true
                        },
                        {
                            fieldName: "medianIncome",
                            label: "Median Income",
                            visible: true
                        },
                        ]
                    }],
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
                    field: "population",
                    stops: [
                    {
                        value: 20000,
                        color: "#c7dcfc",
                        label: "< 20,000"
                    },
                    {
                        value: 50000,
                        color: "#5799ff",
                        label: "< 50,000"
                    },
                    {
                        value: 100000,
                        color: "#375380",
                        label: "100,000+"
                    }
                    ]
                }
                ]
            };

            ////////
            // Census Layer constructor
            ////////

            const censusLayer = new FeatureLayer({
                source: mergedData,
                title: "Census Demographic Data",
                renderer: censusRenderer,
                popupTemplate: censusPopupTemplate,
                objectIdField: "objectId",
                geometryType: "polygon",
                fields: [
                    {
                        name: "objectId",
                        alias: "ObjectId",
                        type: "oid"
                    },
                    {
                        name: "fips",
                        alias: "FIPS",
                        type: "string"
                    },
                    {
                        name: "population",
                        alias: "Population",
                        type: "integer"
                    },
                    {
                        name: "medianIncome",
                        alias: "Median Income",
                        type: "integer"
                    },
                    ],
                opacity: 0.5
            });
            // Add census layer to map
            view.map.layers.add(censusLayer);

            /////////////////////////
            // Covid Layer
            /////////////////////////

            /////////
            // Covid Layer properties
            /////////

            const covidGraphics = covidData.map((county,index) => {
                const countyCentroid = selectedGeoData.centroids.find(c => c.fips === county.fips);

                return new Graphic({
                    attributes: {
                        objectId: index,
                        cases: county.cases,
                        fips: county.fips
                    },
                    geometry:{
                        type: "point",
                        latitude: countyCentroid.latitude,
                        longitude: countyCentroid.longitude
                    }
                });
            });

            const minMaxCovidRenderer = {
                type: "simple",
                symbol: {                          // autocasts as new SimpleMarkerSymbol()
                    type: "simple-marker",
                    color: "#e87c2a",
                    // outline: {                       // autocasts as new SimpleLineSymbol()
                    //     color: "#598DD8",
                    //     width: 1
                    // }
                },
                visualVariables: [
                    {
                        type: "size",
                        field: "cases",
                        minDataValue: 0,
                        maxDataValue: 4000,
                        minSize: 2,
                        maxSize: 24
                    }
                ]
            };

            const covidPopupTemplate = {   // autocasts as new PopupTemplate()
                title: "{County Name} Covid Data",
                content: [{
                    type: "fields",
                    fieldInfos: [
                        {
                            fieldName: "fips",
                            label: "FIPS",
                            visible: true
                        },
                        {
                            fieldName: "cases",
                            label: "Covid Cases",
                            visible: true
                        }
                    ]
                }],
            };

            ////////
            // Covid Layer constructor
            ////////

            const covidLayer = new FeatureLayer({
                source: covidGraphics,
                title: "Covid Data",
                renderer: minMaxCovidRenderer,
                popupTemplate: covidPopupTemplate,
                objectIdField: "objectId",
                geometryType: "point",
                fields: [
                    {
                        name: "objectId",
                        alias: "ObjectId",
                        type: "oid"
                    },
                    {
                        name: "fips",
                        alias: "FIPS",
                        type: "string"
                    },
                    {
                        name: "cases",
                        alias: "Covid Cases",
                        type: "integer"
                    },
                    ],
                opacity: 0.7
            });
            // Add covid layer to map
            view.map.layers.add(covidLayer);

            /////////////////////////
            // Flu Layer
            /////////////////////////

            if(fluData.length > 0){
                /////////
                // Flu Layer properties
                /////////

                const fluGraphics = fluData.map((county,index) => {
                    const countyCentroid = selectedGeoData.centroids.find(c => c.fips === county.fips);

                    return new Graphic({
                        attributes: {
                            objectId: index,
                            totalFlu: county.total_flu,
                            fips: county.fips
                        },
                        geometry:{
                            type: "point",
                            latitude: countyCentroid.latitude,
                            longitude: countyCentroid.longitude
                        }
                    });
                });

                const minMaxFluRenderer = {
                    type: "simple",
                    symbol: {                          // autocasts as new SimpleMarkerSymbol()
                        type: "simple-marker",
                        color: "#7434eb",
                        // outline: {                       // autocasts as new SimpleLineSymbol()
                        //     color: "#598DD8",
                        //     width: 1
                        // }
                    },
                    visualVariables: [
                        {
                            type: "size",
                            field: "totalFlu", //** */
                            minDataValue: 0,
                            maxDataValue: 2000,
                            minSize: 2,
                            maxSize: 24
                        }
                    ]
                };

                const fluPopupTemplate = {   // autocasts as new PopupTemplate()
                    title: "{County Name} Flu Data",
                    content: [{
                        type: "fields",
                        fieldInfos: [
                            {
                                fieldName: "fips",
                                label: "FIPS",
                                visible: true
                            },
                            {
                                fieldName: "totalFlu",
                                label: "Flu Cases",
                                visible: true
                            }
                        ]
                    }],
                };

                ////////
                // Flu Layer constructor
                ////////

                const fluLayer = new FeatureLayer({
                    source: fluGraphics,
                    title: "Flu Data",
                    renderer: minMaxFluRenderer,
                    popupTemplate: fluPopupTemplate,
                    objectIdField: "objectId",
                    geometryType: "point",
                    fields: [
                        {
                            name: "objectId",
                            alias: "ObjectId",
                            type: "oid"
                        },
                        {
                            name: "fips",
                            alias: "FIPS",
                            type: "string"
                        },
                        {
                            name: "totalFlu",
                            alias: "Flu Cases",
                            type: "integer"
                        },
                        ],
                    opacity: 0.7
                });
                // Add covid layer to map
                view.map.layers.add(fluLayer);
            }

        } // End of if wrapper
    },[censusData,covidData,fluData,selectedGeoData,view]);

    return (<div className="staticMap" ref={mapDiv}></div>);
}

export default StaticMap;