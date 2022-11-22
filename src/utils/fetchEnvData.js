export const fetchEnvData = (type,selectedState) =>{
    // the basics
    const baseUrl = "https://mmrmb4dctk.execute-api.us-east-1.amazonaws.com/dev/api/env";
    const apiKey = "vRQrsUJebg4KDP9wtlLG73ImGlGQOOWK3Xmcq4nO"; //Dev backend API key    //*** swap with Auth0 */
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