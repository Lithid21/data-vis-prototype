import React, { useState,useEffect } from "react";

import { useAuth0 } from '@auth0/auth0-react';

//custom components
import "./App.css";
import AuthenticationButton from "./components/AuthenticationButton";
import StaticMap from "./components/StaticMap";
import StateSelect from "./components/StateSelect";
import PlotPanel from "./components/PlotPanel";

function App() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [selectedState,setSelectedState] = useState('PA');
  const [accessToken,setAccessToken] = useState(null);

  useEffect(() => {
    if(!isAuthenticated) //Don't run if not authenticated
      return;
    getAccessTokenSilently({
      audience: "https://mmrmb4dctk.execute-api.us-east-1.amazonaws.com/dev/api/",
      scope: 'read:env'
    }).then(token =>{
      if(token){
        setAccessToken(token);
        return;
      } else {
        return;
      }
    }).catch(e=>console.log(e));
  },[isAuthenticated,getAccessTokenSilently]);

  return(
    <div className="App">
      <AuthenticationButton />
      {isAuthenticated && (
        <>
          <StaticMap selectedState={selectedState} accessToken={accessToken}/>
          <p></p>
          <StateSelect selectedState={selectedState} setSelectedState={setSelectedState}/>
          <PlotPanel selectedState={selectedState}/>
        </>
        )
      }
    </div>
  );
}

export default App;