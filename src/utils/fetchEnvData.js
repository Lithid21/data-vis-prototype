export const fetchEnvData = (type,selectedState) =>{
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

    //Data fetch
    const fetchUrl = baseUrl + `?type=${type}&state=${selectedState}`;
    let dataJSON = fetch(fetchUrl,queryOptions)
        .then( (response) => {
            // console.log(response);
            return response.json();
        })
        .catch( (e) => console.log(e));
    
    // Returns a promise that will resolve to the JSON for the data
    return dataJSON;
};