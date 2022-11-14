import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import '../styles/Plot.css';

function Plot(props) {
  //props.data
  let subset = [];
  if(props.data && props.currentFips){
    subset = props.data.filter((data) => props.currentFips.includes(data.fips));
  }
  return (
    <div className="container">
      <ResponsiveContainer  width={"100%"} height={300}>
        <BarChart data={subset}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fips" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="population" fill="#8884d8" />
          <Bar dataKey="actuals.vaccinationsCompleted" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Plot;