import React, { useRef, useEffect, useState } from "react";

// 3rd party
import esriId from "@arcgis/core/identity/IdentityManager";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";

// utils
import "../styles/StaticMap.css";
import { authorizeEsriId } from "../utils/authorizeEsriId.js";
import { fetchGeoLayer } from "../utils/fetchGeoLayer.js";
import { fetchEnvData } from "../utils/fetchEnvData.js";
import { getSelectedGeoData } from "../utils/getSelectedGeoData.js";
import { createMapView } from "../utils/createMapView.js";

function StaticMap(props) {
    const mapDiv = useRef(null);
    // Things defined on startup
    const [esriToken, setEsriToken] = useState(null);   // A dummy state to use for tracking if IdentityManager has registered the token.
    const [geoLayer, setGeoLayer] = useState(null);   // FeatureLayer with county geospatial data
    const [view, setView] = useState(null); // mapView state

    ///// Effect: Once at startup stuff => Getting the Esri token and initialize the mapView
    useEffect(()=> {
        // Only run if Auth0 token set
        if(!props.accessToken)
            return;
        authorizeEsriId(props.accessToken,setEsriToken);    // Returns nothing, but registers the token to the identity manager
    },[props.accessToken]);

    ///// Effect: Once the esri token has been registered, actually do stuff.
    useEffect( () =>{
        // Don't run this effect without an esriToken set
        if(!esriToken)
            return;
        esriId.checkSignInStatus("https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Counties/FeatureServer/0").then(() => {
            // Initialize mapview and store in state
            setView(createMapView(mapDiv.current));
            // fetch geoLayer from repository and then store in state
            setGeoLayer(fetchGeoLayer());
        });
    },[esriToken]);

    ///// Effect: State specific effects. Get all the data required for the state via API and queryFeatures(). Draw the layers for the data.
    useEffect(()=>{
        // Don't run this without a token and geolayer
        if(!view || !geoLayer){
            return;
        }

        // Wipe the map of previous state
        view.map.removeAll();

        // Get the selected state's geo data (polyfill and centroid) from the county map layer
        getSelectedGeoData(geoLayer,props.selectedState).then(selectedGeoData => {  // object with keys: features, centroids
            // Move the view to the collection of features
            view.goTo(selectedGeoData.features);

            /* **** Could write a layer creation function and send it the data and a properties object with field array, rendering color and type, etc.
                Then just call it for each layer I want. Do this for the real deal, but for prototype it seems unnecessary since this is already here.
             */
            //////////////////////////
            // Census Layer (county geo data + census county demographic info)
            //////////////////////////

            // Census Demographic Data
            fetchEnvData('census',props.selectedState,props.accessToken).then(censusData => {
                // census source. Merge county geo data & census county data
                const mergedData = selectedGeoData.features.map((f,index) => {
                    const matchedData = censusData.find(county => county.fips === f.attributes.FIPS);
                    let newF = f;
                    if(matchedData){
                        newF.attributes = {
                            objectId: index,
                            fips: f.attributes.FIPS,
                            population: matchedData.population,
                            medianIncome: matchedData.median_income,
                            countyName: matchedData.county
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

                // census popup
                const censusPopupTemplate = {   // autocasts as new PopupTemplate()
                    title: "{countyName}",
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
                            }]
                        }],
                };

                // Census Renderer for the censusLayer
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
                    }]
                };

                // Census Layer constructor
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
                        {
                            name: "countyName",
                            alias: "County Name",
                            type: "string"
                        },],
                    opacity: 0.5
                });
                // Add census layer to map
                view.map.layers.add(censusLayer,0);
            }).catch(e => console.log(e)); // End of census data fetch .then()

            /////////////////////////
            // Covid Layer
            /////////////////////////
            // Covid Data
            fetchEnvData('covid',props.selectedState,props.accessToken).then(covidData => {
                // covid source
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

                // covid renderer
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

                // covid popup
                const covidPopupTemplate = {   // autocasts as new PopupTemplate()
                    title: "Covid Data",
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

                // Covid Layer constructor
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
                view.map.layers.add(covidLayer,1);
            }).catch(e => console.log(e)); // End of covid data fetch .then()

            /////////////////////////
            // Flu Layer
            /////////////////////////
            // Flu Data
            fetchEnvData('flu',props.selectedState,props.accessToken).then(fluData => {
                if(fluData.length > 0){
                    // flu source    
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
                    
                    // flu renderer
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
                                field: "totalFlu",
                                minDataValue: 0,
                                maxDataValue: 2000,
                                minSize: 2,
                                maxSize: 24
                            }
                        ]
                    };
    
                    // flu popup
                    const fluPopupTemplate = {   // autocasts as new PopupTemplate()
                        title: "Flu Data",
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
    
                    // Flu Layer constructor    
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
                    view.map.layers.add(fluLayer,2);
                }
            }).catch(e => console.log(e)); // End of flu data fetch .then()

        }); //End of select geo data .then()

        // return () => view?.destroy();
    },[props.selectedState,view,geoLayer,props.accessToken]);

    return (<div className="staticMap" ref={mapDiv}></div>);
}

export default StaticMap;