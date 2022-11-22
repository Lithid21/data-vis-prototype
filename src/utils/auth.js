import esriId from "@arcgis/core/identity/IdentityManager";

export const authorizeEsriId = () =>{
    // the basics
    const url = "https://mmrmb4dctk.execute-api.us-east-1.amazonaws.com/dev/api/auth";
    const apiKey = "vRQrsUJebg4KDP9wtlLG73ImGlGQOOWK3Xmcq4nO"; //Dev backend API key    ///*** Will replace with OAuth */
    const queryOptions = {
        method: 'GET',
        mode: 'cors',
        headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey 
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
        return token;
    })
    .catch(e => console.log(e));
    return promise;
};

