import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

export const fetchGeoLayer = () =>{
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

    return importLayer;
};