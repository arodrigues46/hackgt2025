import { useEffect, useMemo, useRef, useState } from "react";
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
import type { Mood, Sample } from "./types";

/** Labels & categorical levels for the chart (bottom → top). */
const LEVEL_LABEL = ["Poor", "Fair", "Good"] as const;
const MOOD_LEVEL: Record<Mood, number> = { red: 0, yellow: 1, green: 2 };

function moodToColor(mood: Mood) {
  return mood === "green" ? "#2ecc71" : mood === "yellow" ? "#f1c40f" : "#e74c3c";
}

/** Collapse consecutive moods to runs (for time spans). */
function toMoodRuns(series: Sample[], windowStart: number) {
  const runs: Array<{ mood: Mood; start: number; end: number }> = [];
  let cur: { mood: Mood; start: number } | null = null;

  for (const s of series) {
    const start = Math.max(s.t, windowStart);
    if (!cur) cur = { mood: s.mood, start };
    else if (s.mood !== cur.mood) {
      runs.push({ mood: cur.mood, start: cur.start, end: s.t });
      cur = { mood: s.mood, start: s.t };
    }
  }
  if (cur) runs.push({ mood: cur.mood, start: cur.start, end: Date.now() });
  return runs;
}

/** % of last 24h spent in each mood. */
function runsToPercentages(runs: Array<{ mood: Mood; start: number; end: number }>) {
  const totals = { red: 0, yellow: 0, green: 0 } as Record<Mood, number>;
  let totalMs = 0;
  for (const r of runs) {
    const ms = Math.max(0, r.end - r.start);
    totals[r.mood] += ms;
    totalMs += ms;
  }
  if (totalMs === 0) return { red: 0, yellow: 0, green: 0, totalMs: 0 };
  const toPct = (ms: number) => Math.round((ms / totalMs) * 100);
  return {
    red: toPct(totals.red),
    yellow: toPct(totals.yellow),
    green: toPct(totals.green),
    totalMs,
  };
}

/** Fixed intervals between start..end every stepMs. */
function makeIntervals(start: number, end: number, stepMs: number) {
  const arr: number[] = [];
  for (let t = start; t <= end; t += stepMs) arr.push(t);
  return arr;
}

/** Resample irregular events into fixed buckets (carry-forward last mood/comment). */
function resampleToBuckets(series: Sample[], bucketTimes: number[]): Sample[] {
  const sorted = [...series].sort((a, b) => a.t - b.t);
  const result: Sample[] = [];
  let i = 0;
  let lastMood: Mood = "yellow";
  let lastComment: string | undefined;

  for (const bt of bucketTimes) {
    while (i < sorted.length && sorted[i].t <= bt) {
      lastMood = sorted[i].mood;
      if (sorted[i].comment) lastComment = sorted[i].comment;
      i++;
    }
    result.push({ t: bt, mood: lastMood, comment: lastComment });
  }
  return result;
}

/** Least-squares regression y = a + b*x. */
function linearRegression(levels: number[]) {
  const n = levels.length || 1;
  const xs = levels.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = levels.reduce((a, b) => a + b, 0);
  const sumXX = xs.reduce((a, b) => a + b * b, 0);
  const sumXY = xs.reduce((a, i) => a + i * levels[i], 0);

  const denom = n * sumXX - sumX * sumX || 1;
  const b = (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;

  return { a, b };
}

/** Custom tooltip that only shows for SCATTER points. */
function MoodTooltip(props: any) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;

  const first = payload[0];
  // We ensure trend line uses a different dataKey ("trendY")
  if (first.dataKey === "trendY") return null;

  // Scatter uses dataKey="y" and includes the full point payload
  const p = first.payload;
  if (p == null || typeof p.x !== "number" || typeof p.y !== "number") return null;

  const timeStr = new Date(p.x).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const moodLabel = LEVEL_LABEL[p.y];

  // Respect code-controlled comments toggle
  if (!props.showComments) {
    return (
      <div style={tooltipBox}>
        <div><strong>Mood:</strong> {moodLabel}</div>
        <div><strong>Time:</strong> {timeStr}</div>
      </div>
    );
  }
  return (
    <div style={tooltipBox}>
      <div><strong>Mood:</strong> {moodLabel}</div>
      <div><strong>Time:</strong> {timeStr}</div>
      {p.comment ? <div style={{ marginTop: 4 }}><strong>Comment:</strong> {p.comment}</div> : null}
    </div>
  );
}
const tooltipBox: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.1)",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
};

export default function App({ initialSeries = [] }: { initialSeries?: Sample[] }) {
  const [series, setSeries] = useState<Sample[]>(initialSeries);
  const mounted = useRef(false);

  /** Code-controlled flags */
  const SHOW_COMMENTS = true;

  /** Window + bucket config */
  const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
  const BUCKET_MS = 15 * 60 * 1000;      // 15 min

  /** Simulated feed if none provided. */
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    if (initialSeries.length > 0) return;

    const MOODS: Mood[] = ["red", "yellow", "green"];
    let current: Mood = "yellow";

    const id = setInterval(() => {
      if (Math.random() < 0.3) {
        const idx = MOODS.indexOf(current);
        const nextIdx = Math.max(0, Math.min(2, idx + (Math.random() < 0.5 ? -1 : 1)));
        current = MOODS[nextIdx];
      }
      const t = Date.now();
      const comment = Math.random() < 0.15 ? "Note at this time." : undefined;

      setSeries((s) => {
        const next = [...s, { t, mood: current, comment }];
        return next.filter((p) => p.t >= t - WINDOW_MS);
      });
    }, 3000);

    return () => clearInterval(id);
  }, [initialSeries]);

  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  /** Percent bar */
  const runs = useMemo(() => toMoodRuns(series, windowStart), [series, windowStart]);
  const pct = useMemo(() => runsToPercentages(runs), [runs]);
  const mostRecent = series[series.length - 1]?.mood ?? "yellow";

  /** Scatter + trend (fixed buckets) */
  const bucketTimes = useMemo(() => makeIntervals(windowStart, now, BUCKET_MS), [windowStart, now, BUCKET_MS]);
  const bucketed = useMemo(() => resampleToBuckets(series, bucketTimes), [series, bucketTimes]);

  const scatterData = useMemo(
    () =>
      bucketed.map((s) => ({
        x: s.t,                               // used for the time in tooltip
        y: MOOD_LEVEL[s.mood],                // 0/1/2 for Y
        mood: s.mood,
        label: LEVEL_LABEL[MOOD_LEVEL[s.mood]],
        comment: s.comment,
      })),
    [bucketed]
  );

  // Hourly ticks on X
  const hourlyTicks = useMemo(
    () => makeIntervals(windowStart, now, 60 * 60 * 1000),
    [windowStart, now]
  );

  // Trend line data under a DIFFERENT key ("trendY") so tooltip ignores it
  const levels = scatterData.map((d) => d.y);
  const { a, b } = linearRegression(levels);
  const trendData = useMemo(() => {
    if (scatterData.length === 0) return [];
    const clamp = (n: number) => Math.max(0, Math.min(2, n));
    return [
      { x: scatterData[0].x, trendY: clamp(a + b * 0) },
      { x: scatterData[scatterData.length - 1].x, trendY: clamp(a + b * (scatterData.length - 1)) },
    ];
  }, [a, b, scatterData]);

  /** Graph title = current day */
  const todayStr = new Date().toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Bind SHOW_COMMENTS into tooltip
  const renderTooltip = (props: any) => <MoodTooltip {...props} showComments={SHOW_COMMENTS} />;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>NAME</h1>

      {/* Top row: percentage bar */}
      <div style={styles.row}>
        <div style={styles.leftLabel}>Emotional State</div>

        <div style={styles.barArea}>
          <div style={styles.segmentBar} role="img" aria-label="Percentage of moods in the last 24 hours">
            <div style={{ ...styles.segment, width: `${pct.red}%`, background: moodToColor("red") }} title={`Poor: ${pct.red}%`} />
            <div style={{ ...styles.segment, width: `${pct.yellow}%`, background: moodToColor("yellow") }} title={`Fair: ${pct.yellow}%`} />
            <div style={{ ...styles.segment, width: `${pct.green}%`, background: moodToColor("green") }} title={`Good: ${pct.green}%`} />
          </div>
          <div style={styles.timeHint}><span>last 24h</span></div>
        </div>

        <div style={styles.rightLegend}>
          <div style={{ ...styles.recentSwatch, background: moodToColor(mostRecent) }} />
          <div style={{ marginLeft: 12, color: "#666" }}>most recent</div>
        </div>
      </div>

      {/* Graph title: current day */}
      <div style={styles.graphCaption}>{todayStr}</div>

      {/* Scatter + trend */}
      <div style={styles.chartCard}>
        <ResponsiveContainer width="100%" height={330}>
          <ComposedChart data={scatterData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[windowStart, now]}
              ticks={hourlyTicks}
              tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit" })}
            />
            <YAxis
              type="number"
              domain={[0, 2]}
              ticks={[0, 1, 2]}
              tickFormatter={(v) => LEVEL_LABEL[v]}
            />

            {/* 👇 Tooltip shows only for dots (ignores trend because dataKey differs) */}
            <Tooltip content={renderTooltip} cursor={{ strokeDasharray: "3 3" }} />

            {/* Scatter points */}
            <Scatter
              dataKey="y"
              name="Mood"
              isAnimationActive={false}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={moodToColor(payload.mood)}
                    stroke="rgba(0,0,0,0.25)"
                  />
                );
              }}
            />

            {/* Trend line (separate data & key so tooltip ignores it) */}
            <Line
              data={trendData}
              type="linear"
              dataKey="trendY"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------- styles ---------- */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f7f7f7",
    padding: "36px 28px",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    color: "#222",
  },
  title: { textAlign: "center", margin: "0 0 28px 0", letterSpacing: 1 },
  row: {
    display: "grid",
    gridTemplateColumns: "180px 1fr 220px",
    alignItems: "center",
    gap: 16,
  },
  leftLabel: { justifySelf: "start", fontSize: 18, color: "#555" },
  barArea: { display: "flex", flexDirection: "column", alignItems: "center", width: "100%" },
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
  segment: { height: "100%" },
  timeHint: { marginTop: 6, fontSize: 14, color: "#777" },
  rightLegend: { display: "flex", alignItems: "center", justifySelf: "start" },
  recentSwatch: {
    width: 90,
    height: 18,
    borderRadius: 4,
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
  },
  graphCaption: { textAlign: "center", marginTop: 36, marginBottom: 8, color: "#555", fontSize: 16, fontWeight: 500 },
  chartCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
};
