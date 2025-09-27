export type Mood = "green" | "yellow" | "red"; // Good / Fair / Poor
export type Sample = { t: number; mood: Mood; comment?: string }; // comment is optional
