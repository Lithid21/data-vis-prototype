import React, { useState,useEffect } from "react";

import { useAuth0 } from '@auth0/auth0-react';

import AuthenticationButton from "./components/AuthenticationButton";
import Plot from "./components/Plot";

import "./App.css";

function App() {
  const { isAuthenticated } = useAuth0();
  const [mapId,setMapId] = useState(null);
  const [plotData,setPlotData] = useState(null);
  const [currentFips, setCurrentFips] = useState(null);

  //////////
  // Plot initialization
  //////////

  //Grab the data for the plot
  useEffect( () =>{
    if(isAuthenticated && !plotData){
      // If initializing plotData using API endpoint
      const queryURL = "https://s06zux4ss0.execute-api.us-east-1.amazonaws.com/staging/api/environmental/";
      const apiKey = "1gvZdDqRQR9AhQBdSe6d92EXulDs0zxwolGrBOMc"; //Staging API key

      const standardOptions = {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey 
        }
      };

      fetch(queryURL,standardOptions)
        .then( (response) => {
          // console.log(response);
          return response.json();
        })
        .then( (dataJSON) => { 
          // console.log(dataJSON);
          setPlotData(dataJSON);
        })
        .catch( (e) => console.log(e));
    }
  });

  return(
    <div className="App">
      <AuthenticationButton />
    </div>
  );
}

export default App;