import React from "react";
import MyChart from "./MyChart";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Scatter,
  Line,
} from 'recharts';

const y_labels = ["Sad", "Fine", "Happy"]

function MyChart({ data }) {
  const labels = ["Low", "Medium", "High"]; // tags for 0,1,2

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis dataKey="time" />
        <YAxis
          domain={[0, 2]}
          tickFormatter={(value) => labels[value]}
        />
        <Tooltip />
        <Scatter dataKey="value" fill="blue" />
        <Line type="monotone" dataKey="value" stroke="red" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default MyChart;