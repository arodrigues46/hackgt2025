import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Scatter,
  Line,
} from "recharts";
import "./App.css";

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const newPoint = {
          x: Date.now(), // or use data.length for a simple index
          y: parsed.number, // must be 0, 1, or 2
        };

        setData((prev) => {
          const updated = [...prev, newPoint];
          // shrink: keep last 50 points (adjust as you like)
          return updated.slice(-50);
        });
      } catch (err) {
        console.error("Invalid JSON", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("Connexion interrompue");
    };

    return () => {
      ws.close();
    };
  }, []);

    return (
    <div className="App">
      <header className="App-header">
        <h1>Patient Mood Board</h1>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(unixTime) =>
                new Date(unixTime).toLocaleTimeString()
              }
            />
            <YAxis dataKey="y" domain={[0, 2]} ticks={[0, 1, 2]} />
            <Tooltip
              labelFormatter={(value) =>
                new Date(value).toLocaleTimeString()
              }
            />
            {/* Dots for each value */}
            <Scatter dataKey="y" fill="#8884d8" />
            {/* Line connecting points */}
            <Line type="monotone" dataKey="y" stroke="#82ca9d" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </header>
    </div>
  );
}


export default App;
