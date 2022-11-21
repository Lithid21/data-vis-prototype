import React, { useState } from "react";

import { useAuth0 } from '@auth0/auth0-react';

//custom components
import "./App.css";
import AuthenticationButton from "./components/AuthenticationButton";
import StaticMap from "./components/StaticMap";
import StateSelect from "./components/StateSelect";
import PlotPanel from "./components/PlotPanel";

function App() {
  const { isAuthenticated } = useAuth0();
  const [selectedState,setSelectedState] = useState('PA');

  return(
    <div className="App">
      <AuthenticationButton />
      {isAuthenticated && (
        <>
          <StaticMap selectedState={selectedState}/>
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