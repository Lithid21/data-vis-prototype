import { useState, useEffect } from 'react';

import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

export function useCensusLayer(selectedState) {
    const [censusLayer,setCensusLayer] = useState(null);

    useEffect( () => {
        //////////////////
        // Layer properties
        //////////////////
        const popupTemplate = {   // autocasts as new PopupTemplate()
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

        const countyRenderer = {
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

        //////////////////
        // Layer grabbing
        //////////////////
        const featureLayer = new FeatureLayer({
            // url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Tracts/FeatureServer/0", // JP's census tract map
            // url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Census_Tracts/FeatureServer/0", // "Will's" census tract map
            url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Counties/FeatureServer/0", // "Will's" county map
            // url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_States/FeatureServer/0", // "will's" state map
            // outFields: ["STCOFIPS","POPULATION"], // For JP's census map
            outFields: ["FIPS","POPULATION"],  //For county map, this is combined state-county FIPS
            // outFields: ["*"],
            popupTemplate: popupTemplate,
            opacity: 0.5,
            id: "census-layer",
            renderer: countyRenderer
        });
        setCensusLayer(featureLayer);
    },[selectedState]);

    return censusLayer;
}