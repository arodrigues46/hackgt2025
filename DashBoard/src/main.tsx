import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import type { Sample, Mood } from "./types";

// toggle mock vs simulated feed
const USE_MOCK = true;

function randomSeries(count = 150): Sample[] {
  const now = Date.now();
  const start = now - 24 * 60 * 60 * 1000;
  const moods: Mood[] = ["red", "yellow", "green"];
  const out: Sample[] = [];
  for (let i = 0; i < count; i++) {
    const t = Math.floor(start + Math.random() * (now - start));
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const comment = Math.random() < 0.2 ? "Mock comment" : undefined;
    out.push({ t, mood, comment });
  }
  return out.sort((a, b) => a.t - b.t);
}

const mockData = randomSeries(160);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App initialSeries={USE_MOCK ? mockData : []} />
  </React.StrictMode>
);
