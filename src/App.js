import React, { useState } from "react";

import { useAuth0 } from '@auth0/auth0-react';

import AuthenticationButton from "./components/AuthenticationButton";
import StaticMap from "./components/StaticMap";

import "./App.css";

function App() {
  const { isAuthenticated } = useAuth0();
  const [selectedState,setSelectedState] = useState(42);

  const stateOptions = [
    {value: 42, label: "PA"},
    {value: 25, label: "MA"}
  ];

  return(
    <div className="App">
      <AuthenticationButton />
      {isAuthenticated && (
        <>
          {<StaticMap selectedState={'PA'} setSelectedState={setSelectedState} stateOptions={stateOptions}/>}
        </>
        )
      }
    </div>
  );
}

export default App;