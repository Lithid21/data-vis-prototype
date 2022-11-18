import { stateToFips } from "../utils/stateToFips";

export const getSelectedGeoData = (geoLayer,selectedState) =>{
    //////////
    // Grab the geospatial data for the state. Since the layer is not in a view, this queries directly from the service.
    //////////
    const stateFips = stateToFips[selectedState];   // The states FIPS 2-digit number code

    //create the query parameters
    const query = geoLayer.createQuery();
    query.set({
        where: `STATE_FIPS = '${stateFips}'`,
        returnGeometry: true,
        maxRecordCountFactor: 1,
        outFields: ["STATE_FIPS","FIPS","STATE_ABBR"]
    });

    // Call the query feature function from the ArcGIS online service
    let geoData = geoLayer.queryFeatures(query)
        .then((featureSet) => {
            let output = {features:null, centroids:null};
            output.features = featureSet.features;

            output.centroids = featureSet.features.map(f => {
                return {
                    latitude: f.geometry.centroid.latitude,
                    longitude: f.geometry.centroid.longitude,
                    fips: f.attributes.FIPS
                }
            });
            ///// Debug junk to see geometry and attributes
            // const geometries = featureSet.features.map((f) => f.geometry);
            // console.log("geometries");
            // console.log(geometries);
            // const attributes = featureSet.features.map((f) => f.attributes);
            // console.log("attributes");
            // console.log(attributes);

            return output;
        });

    // Returns a promise that will resolve to an object with features and centroids
    return geoData;
}