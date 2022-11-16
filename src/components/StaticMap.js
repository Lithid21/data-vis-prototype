import React, { useRef, useEffect, useState } from "react";

import esriId from "@arcgis/core/identity/IdentityManager";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";

import Legend from "@arcgis/core/widgets/Legend";
import Fullscreen from "@arcgis/core/widgets/Fullscreen";
import LayerList from "@arcgis/core/widgets/LayerList";
import Bookmarks from "@arcgis/core/widgets/Bookmarks";
import Bookmark from "@arcgis/core/webmap/Bookmark";
import Expand from "@arcgis/core/widgets/Expand";

import "../styles/StaticMap.css";
import {stateToFips} from "../helper/stateToFips";

function BuiltMap(props) {

    const mapDiv = useRef(null);
    const [token,setToken] = useState(null);  // ArcGIS OAuth token
    const [countyLayer, setCountyLayer] = useState(null);   // FeatureLayer with county geospatial data
    // Data for the current state
    const [geoData, setGeoData] = useState(null);
    const [centroids, setCentroids] = useState(null);
    const [censusData, setCensusData] = useState(null);
    const [covidData, setCovidData] = useState(null);
    const [fluData, setFluData] = useState(null);
  
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
            .then( (response) => {  //converts the token to a json
                return response.json();
            })
            .then( tokenJSON => {   //registers the token to identity manager
                setToken(tokenJSON.access_token); //Sets the token state
                const regProps = {
                    server: "https://www.arcgis.com/sharing/rest",
                    token: tokenJSON.access_token
                };
                esriId.registerToken(regProps); //Registers the token to the IdentityManager
                return;
            })
            .then( () =>{   // Gets the county map layer and saves it to state
                
                /////////
                // County Layer grabbing
                /////////
                const importLayer = new FeatureLayer({
                    // url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Tracts/FeatureServer/0", // JP's census tract map
                    // url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Census_Tracts/FeatureServer/0", // "Will's" census tract map
                    url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Counties/FeatureServer/0", // "Will's" county map
                    // url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_States/FeatureServer/0", // "will's" state map
                    // outFields: ["STCOFIPS","POPULATION"], // For JP's census map
                    // outFields: ["FIPS","POPULATION"],  //For county map, this is combined state-county FIPS
                    outFields: ["FIPS","STATE_FIPS","STATE_ABBR"],
                    // outFields: ["*"],
                    // opacity: 0.5,
                    id: "county-layer"
                });
                // console.log("county layer");
                // console.log(importLayer);
                setCountyLayer(importLayer);
            })
            .catch( (e) => console.log(e));
    },[]);

    // Get all the data required for the state via API and queryFeatures()
    useEffect(()=>{
        if(mapDiv.current && token){
            //////////////////////////
            // API Calls for state's data by county (census, covid, & flu)
            //////////////////////////

            // the basics
            const baseUrl = "https://s06zux4ss0.execute-api.us-east-1.amazonaws.com/staging/api/environmental/";
            const apiKey = "1gvZdDqRQR9AhQBdSe6d92EXulDs0zxwolGrBOMc"; //Staging API key
            const queryOptions = {
                method: 'GET',
                mode: 'cors',
                headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey 
                }
            };

            //Census Data
            const censusUrl = baseUrl + `?type=census&state=${props.selectedState}`;
            fetch(censusUrl,queryOptions)
                .then( (response) => {
                    // console.log(response);
                    return response.json();
                })
                .then( (dataJSON) => { 
                    // console.log(dataJSON);
                    setCensusData(dataJSON);
                })
                .catch( (e) => console.log(e));

            //Covid Data
            const covidUrl = baseUrl + `?type=covid&state=${props.selectedState}`;
            fetch(covidUrl,queryOptions)
                .then( (response) => {
                    // console.log(response);
                    return response.json();
                })
                .then( (dataJSON) => { 
                    // console.log(dataJSON);
                    setCovidData(dataJSON);
                })
                .catch( (e) => console.log(e));

            //Flu Data
            const fluUrl = baseUrl + `?type=flu&state=${props.selectedState}`;
            fetch(fluUrl,queryOptions)
                .then( (response) => {
                    // console.log(response);
                    return response.json();
                })
                .then( (dataJSON) => { 
                    // console.log(dataJSON);
                    setFluData(dataJSON);
                })
                .catch( (e) => console.log(e));

            //////////
            // Grab the geospatial data for the state. Since the layer is not in a view, this queries directly from the service.
            //////////

            const stateFips = stateToFips[props.selectedState];

            //create the query for the Layer. Just grab all features
            const query = countyLayer.createQuery();
            query.set({
              where: `STATE_FIPS = '${stateFips}'`,
              returnGeometry: true,
              maxRecordCountFactor: 1,
              outFields: ["STATE_FIPS","FIPS","STATE_ABBR"]
            });

            countyLayer.queryFeatures(query).then((featureSet) => {
                const features = featureSet.features;
                setGeoData(features);

                const centroidArray = features.map(f => {
                    return {
                        latitude: f.geometry.centroid.latitude,
                        longitude: f.geometry.centroid.longitude,
                        fips: f.attributes.FIPS
                    }
                });
                setCentroids(centroidArray);

                ///// Debug junk to see geometry and attributes
                const geometries = features.map((f) => f.geometry);
                console.log("geometries");
                console.log(geometries);
                // const attributes = features.map((f) => f.attributes);
                // console.log("attributes");
                // console.log(attributes);
            });
        }
    },[token,props.selectedState,countyLayer]);

    // Map & view rendering
    useEffect( ()=> {
        let view;
        if(censusData && covidData && fluData && geoData){
            console.log("census data");
            console.log(censusData);
            console.log("covid data");
            console.log(covidData);
            console.log("flu data");
            console.log(fluData);

            /////////
            // Map initialization
            /////////

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
            
            // Move the view to the collection of features
            view.goTo(geoData);

            /////////
            // View modifications
            /////////

            // Legend for layer data
            let legend = new Legend({
                view: view
            });
            const legendExpand = new Expand({
                view: view,
                content: legend
            });
            view.ui.add(legendExpand, "bottom-left");
    
            // Button to make the ArcGIS map fullscreen
            let fullscreen = new Fullscreen({
                view: view
            });
            view.ui.add(fullscreen, "top-right");
    
            // List of layers with ability to hide
            let layerList = new LayerList({
                view: view
            });
            view.ui.add(layerList, "top-left");

            // Disables the "zoom to" feature of the popups
            view.popup.viewModel.includeDefaultActions = false;

            ///////////
            // Bookmarks
            ///////////

            // // generate list of bookmarks
            // const stateCodes = Object.keys(stateToFips);
            // const bookmarks = stateCodes.map(code => {
            //     return new Bookmark({
            //         name: code,
            //         viewpoint: {
            //             targetGeometry: view.extent.center
            //         }
            //     });
            // });
            // // console.log(bookmarks);
            // // List of states. When clicked, updates selectedState, which triggers a component update.
            // const bookmarksWidget = new Bookmarks({
            //     view: view,
            //     bookmarks: bookmarks
            // });  
            // const bookmarksExpand = new Expand({
            //     view: view,
            //     content: bookmarksWidget
            // });
            // view.ui.add(bookmarksExpand, "bottom-right");
            // // when the user selects a bookmark
            // bookmarksWidget.on("bookmark-select", function(event){
            //     // console.log(event);
            //     // bookmarksExpand.expanded = false;
            //     setCensusData(null);
            //     setCovidData(null);
            //     setFluData(null);
            //     setGeoData(null);
            //     props.setSelectedState("AZ");
            // });

            ////////////
            // Disabling zooming
            ////////////
            // view.on("mouse-wheel", function(evt){
            //   // prevents zooming with the mouse-wheel event
            //   evt.stopPropagation();
            // });

            /////////////
            // Disabling Panning
            //////////////
            view.on("drag", function(evt){
              // prevents panning with the mouse drag event
              evt.stopPropagation();
            });

            view.on("key-down", function(evt){
              // prevents panning with the arrow keys
              var keyPressed = evt.key;
              if(keyPressed.slice(0,5) === "Arrow"){
                evt.stopPropagation();
              }
            });

            //////////////////////////
            // Census Layer (county geo data + census county demographic info)
            //////////////////////////

            ////////
            // Merge county geo data & census county data
            ////////
            const mergedData = geoData.map((f,index) => {
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
            map.layers.add(censusLayer);

            /////////////////////////
            // Covid Layer
            /////////////////////////

            /////////
            // Covid Layer properties
            /////////

            const covidGraphics = covidData.map((county,index) => {
                const countyCentroid = centroids.find(c => c.fips === county.fips);

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
            map.layers.add(covidLayer);

            /////////////////////////
            // Flu Layer
            /////////////////////////

            if(fluData.length > 0){
                /////////
                // Flu Layer properties
                /////////

                const fluGraphics = fluData.map((county,index) => {
                    const countyCentroid = centroids.find(c => c.fips === county.fips);

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
                map.layers.add(fluLayer);
            }

        } // End of if wrapper
        return () => view?.destroy();
    },[censusData,covidData,fluData,geoData,centroids]);

    return (<div className="staticMap" ref={mapDiv}></div>);
}

export default BuiltMap;