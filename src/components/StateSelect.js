import React from 'react';

import { stateToFips } from '../utils/stateToFips';
import '../styles/StateSelect.css';

function StateSelect (props) {
    // Function for updating select value
    const handleSelectChange = (event) =>{
        props.setSelectedState(event.target.value);
   }

    // Prepping the render
    const states = Object.keys(stateToFips);
    let options = [];
    states.forEach((state) => {
        options.push(
            <option value={state} key={state}>{state}</option>
        );
    });

    return (
        <div className='stateSelect'>
            <p></p>
            Choose a state:
            <p></p>
            <select className = 'stateSelect' name="states" id="stateSelect" onChange={handleSelectChange} value={props.selectedState}>
                {options}
            </select>
        </div>
    );
}

export default StateSelect;