import React from "react";
import {
  LineChart ,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import '../styles/Plot.css';

function Plot({data}) {
  console.log(data);
  return (
    <div className="container">
      <ResponsiveContainer  width={"100%"} height={270}>
        <LineChart data={data} margin={{top:0, bottom:0,left:25,right:10}}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line dataKey="cases" stroke="#e87c2a" strokeWidth={2} dot={false}/>
          <Line dataKey="vaccinations" stroke="#82ca9d" strokeWidth={2} dot={false}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Plot;