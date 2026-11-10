import type { Review } from "@/types";

export const MIN_RATING = 0.5;
export const MAX_RATING = 5;
export const RATING_STEP = 0.5;

/** Valid ratings are 0.5 … 5.0 in half-star steps. */
export function isValidRating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_RATING &&
    value <= MAX_RATING &&
    Number.isInteger(value / RATING_STEP)
  );
}

export interface RatingSummary {
  average: number | null;
  count: number;
  /** Count per star bucket, index 0 = 0.5 … index 9 = 5.0. */
  distribution: number[];
}

/** Community average computed only from valid published ratings. */
export function summarizeRatings(reviews: Pick<Review, "rating">[]): RatingSummary {
  const distribution = Array.from({ length: 10 }, () => 0);
  let sum = 0;
  let count = 0;
  for (const { rating } of reviews) {
    if (!isValidRating(rating)) continue;
    sum += rating;
    count += 1;
    distribution[rating / RATING_STEP - 1] += 1;
  }
  return { average: count ? Math.round((sum / count) * 10) / 10 : null, count, distribution };
}

export function formatRating(value: number): string {
  return value.toFixed(1);
}
