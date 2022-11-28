import esriId from "@arcgis/core/identity/IdentityManager";

export const authorizeEsriId = (accessToken,setEsriToken) =>{
    if(!accessToken)
        return 0;
    // the basics
    const url = "https://mmrmb4dctk.execute-api.us-east-1.amazonaws.com/dev/api/auth";
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

    // register OAuth token for Esri calls
    const promise = fetch(url,queryOptions)
    .then( (response) => {
        return response.json();
    })
    .then((token) => {
        const regProps = {
            server: "https://www.arcgis.com/sharing/rest",
            token: token
        };
        esriId.registerToken(regProps); //Registers the token to the IdentityManager
        setEsriToken(token);
        return;
    })
    .catch(e => console.log(e));
    return promise;
};

