import esriId from "@arcgis/core/identity/IdentityManager";

export const authorizeEsriId = () =>{
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
    let outToken = fetch("https://www.arcgis.com/sharing/rest/oauth2/token/",{ method: 'POST', body:parameters })
        .then( (response) => {  //converts the token to a json
            return response.json();
        })
        .then( tokenJSON => {   //registers the token to identity manager
            const regProps = {
                server: "https://www.arcgis.com/sharing/rest",
                token: tokenJSON.access_token
            };
            esriId.registerToken(regProps); //Registers the token to the IdentityManager
            return tokenJSON.access_token;
        })
        .catch( (e) => console.log(e));
    return outToken;
};