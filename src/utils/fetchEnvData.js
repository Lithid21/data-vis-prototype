export const fetchEnvData = (type,selectedState,accessToken) =>{
    if(!accessToken)
        return;
    // the basics
    const baseUrl = "https://mmrmb4dctk.execute-api.us-east-1.amazonaws.com/dev/api/env";
    const queryOptions = {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            // 'Access-Control-Allow-Origin': '*',
            // 'Access-Control-Request-Headers': '*',
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