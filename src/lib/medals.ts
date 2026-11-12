/**
 * Achievement medals, earned automatically from activity (no points or purchases).
 * Two tracks — reviews written and games completed — each with nine tiers.
 */

export type MedalTrack = "reviews" | "completed";

export interface MedalTier {
  level: number; // 1–9
  name: string;
  threshold: number;
  /** Main colour, used for text and the placeholder artwork. */
  color: string;
}

export const MEDAL_TIERS: MedalTier[] = [
  { level: 1, name: "Brass", threshold: 1, color: "#c79a6b" },
  { level: 2, name: "Bronze", threshold: 5, color: "#e0814a" },
  { level: 3, name: "Silver", threshold: 10, color: "#c9d1db" },
  { level: 4, name: "Gold", threshold: 25, color: "#f5b82e" },
  { level: 5, name: "Platinum", threshold: 50, color: "#a9c4f5" },
  { level: 6, name: "Emerald", threshold: 100, color: "#36c85a" },
  { level: 7, name: "Diamond", threshold: 250, color: "#4fb8ff" },
  { level: 8, name: "Ruby", threshold: 500, color: "#ff4d5e" },
  { level: 9, name: "Legendary", threshold: 1000, color: "#c06bff" },
];

export const TRACK_LABEL: Record<MedalTrack, { title: string; unit: [string, string] }> = {
  reviews: { title: "Critic", unit: ["review written", "reviews written"] },
  completed: { title: "Completionist", unit: ["game completed", "games completed"] },
};

export interface MedalProgress {
  track: MedalTrack;
  count: number;
  /** Highest tier reached, or null if none yet. */
  earned: MedalTier | null;
  /** Next tier to reach, or null at the top. */
  next: MedalTier | null;
  /** 0–1 progress from the current tier's threshold to the next one. */
  progress: number;
}

export function medalProgress(track: MedalTrack, count: number): MedalProgress {
  const n = Math.max(0, Math.floor(count));
  const earned = [...MEDAL_TIERS].reverse().find((t) => n >= t.threshold) ?? null;
  const next = MEDAL_TIERS.find((t) => n < t.threshold) ?? null;
  const from = earned?.threshold ?? 0;
  const progress = next ? (n - from) / (next.threshold - from) : 1;
  return { track, count: n, earned, next, progress };
}
