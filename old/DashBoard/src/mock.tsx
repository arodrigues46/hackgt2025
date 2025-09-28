import type { Mood, Sample } from "./types";

/** Tiny seedable PRNG so runs can be reproducible */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(items: T[], weights: number[], rnd: () => number): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (let i = 0; i < items.length; i++) {
    if ((r -= weights[i]) <= 0) return items[i];
  }
  return items[items.length - 1];
}

export type MockOptions = {
  /** number of random samples to generate (default 120) */
  count?: number;
  /** window start (ms) and end (ms); default = last 24h */
  startMs?: number;
  endMs?: number;
  /** mood weights (likelihood of picking each mood); default [1,1,1] */
  weights?: { red?: number; yellow?: number; green?: number };
  /** chance to attach a comment to a sample (0..1), default 0.15 */
  commentRate?: number;
  /** seed for reproducible runs; if omitted, uses Date.now() */
  seed?: number;
  /** ensure chronological order (sort timestamps); default true */
  sort?: boolean;
};

/**
 * Generate randomized samples with random timestamps inside a window.
 * - timestamps are uniform random in [startMs, endMs]
 * - moods are sampled with weights
 * - optionally attach comments with probability commentRate
 */
export function generateMockSeries(opts: MockOptions = {}): Sample[] {
  const now = Date.now();
  const startMs = opts.startMs ?? now - 24 * 60 * 60 * 1000;
  const endMs = opts.endMs ?? now;
  const count = opts.count ?? 120;
  const sort = opts.sort ?? true;

  const w = {
    red: opts.weights?.red ?? 1,
    yellow: opts.weights?.yellow ?? 1,
    green: opts.weights?.green ?? 1,
  };

  const seed = opts.seed ?? Math.floor(now % 2_147_483_647);
  const rnd = mulberry32(seed);

  const moods: Mood[] = ["red", "yellow", "green"];
  const weights = [w.red, w.yellow, w.green];

  const samples: Sample[] = [];
  for (let i = 0; i < count; i++) {
    const t = Math.floor(startMs + rnd() * (endMs - startMs));
    const mood = pickWeighted(moods, weights, rnd);
    const attachComment = rnd() < (opts.commentRate ?? 0.15);
    const comment = attachComment ? randomComment(rnd) : undefined;
    samples.push({ t, mood, comment });
  }

  if (sort) samples.sort((a, b) => a.t - b.t);
  return samples;
}

function randomComment(rnd: () => number): string {
  const fragments = [
    "Feeling okay.",
    "Quick note.",
    "Spike after break.",
    "Steady period.",
    "Low energy.",
    "Improved focus.",
    "External factor.",
    "Short dip.",
  ];
  return fragments[Math.floor(rnd() * fragments.length)];
}
