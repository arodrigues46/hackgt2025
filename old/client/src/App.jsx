import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// ---- Types & helpers ----
type Mood = "green" | "red" | "yellow";

function moodToColor(mood: Mood) {
  switch (mood) {
    case "green":
      return "#2ecc71";
    case "red":
      return "#e74c3c";
    case "yellow":
      return "#f1c40f";
    default:
      return "#bdc3c7";
  }
}

// Example history (oldest → newest). Replace with your live data.
const moodHistory: Mood[] = [
  "green",
  "green",
  "red",
  "red",
  "red",
  "yellow", // most recent
];

// Example time-series for the last day. Replace with your real samples.
const now = Date.now();
const exampleSeries = Array.from({ length: 24 }, (_, i) => {
  // hourly samples; 0..100 scale (0=bad, 100=good)
  const t = now - (23 - i) * 60 * 60 * 1000;
  const value = [35, 40, 45, 60, 70, 65, 55, 50, 48, 52, 40, 38, 30, 28, 25, 30, 35, 45, 55, 62, 70, 68, 60, 58][i];
  return { t, value };
});

// ---- UI ----
export default function App() {
  const mostRecent = moodHistory[moodHistory.length - 1];

  const chartData = useMemo(
    () =>
      exampleSeries.map((d) => ({
        time: new Date(d.t).toLocaleTimeString([], { hour: "2-digit" }),
        value: d.value,
      })),
    []
  );

  return (
    <div style={styles.page}>
      {/* Title */}
      <h1 style={styles.title}>NAME</h1>

      {/* Row: label | color bar | most recent */}
      <div style={styles.row}>
        <div style={styles.leftLabel}>Emotional State</div>

        <div style={styles.barArea}>
          <div style={styles.segmentBar}>
            {moodHistory.map((mood, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.segment,
                  background: moodToColor(mood),
                  // equal widths; if you have durations, set width based on duration proportion
                  width: `${100 / moodHistory.length}%`,
                }}
                title={`Segment ${idx + 1}: ${mood}`}
              />
            ))}
          </div>
          <div style={styles.timeHint}>
            <span>time</span>
            <span style={styles.arrow}>──────────➜</span>
          </div>
        </div>

        <div style={styles.rightLegend}>
          <div
            style={{
              ...styles.recentSwatch,
              background: moodToColor(mostRecent),
            }}
            aria-label="Most recent mood"
          />
          <div style={{ marginLeft: 12, color: "#666" }}>most recent</div>
        </div>
      </div>

      {/* Graph header (matches your mock’s caption) */}
      <div style={styles.graphCaption}>&lt;graph of moods in the last day&gt;</div>

      {/* Graph */}
      <div style={styles.chartCard}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="value" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---- Styles ----
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f7f7f7",
    padding: "36px 28px",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    color: "#222",
  },
  title: {
    textAlign: "center",
    margin: "0 0 28px 0",
    letterSpacing: 1,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "180px 1fr 220px",
    alignItems: "center",
    gap: 16,
  },
  leftLabel: {
    justifySelf: "start",
    fontSize: 18,
    color: "#555",
  },
  barArea: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  segmentBar: {
    display: "flex",
    width: "100%",
    maxWidth: 560,
    height: 28,
    borderRadius: 6,
    overflow: "hidden",
    background: "#e6e6e6",
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
  },
  segment: {
    height: "100%",
  },
  timeHint: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#777",
    fontSize: 14,
    marginTop: 10,
  },
  arrow: {
    letterSpacing: 2,
  },
  rightLegend: {
    display: "flex",
    alignItems: "center",
    justifySelf: "start",
  },
  recentSwatch: {
    width: 90,
    height: 18,
    borderRadius: 4,
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
  },
  graphCaption: {
    textAlign: "center",
    marginTop: 36,
    marginBottom: 8,
    color: "#777",
  },
  chartCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
};
