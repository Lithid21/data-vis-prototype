import React, { useState } from "react";

import { useAuth0 } from '@auth0/auth0-react';

import AuthenticationButton from "./components/AuthenticationButton";
import StaticMap from "./components/StaticMap";
import StateSelect from "./components/StateSelect";
import "./App.css";

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
        </>
        )
      }
    </div>
  );
}

export default App;