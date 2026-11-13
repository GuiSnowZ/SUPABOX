/**
 * Carousel navigation, kept free of the DOM so it can be tested. The selected
 * index is the only source of truth: what's shown, the "n / total" counter and
 * the "open game page" link all read from it.
 */

/** Keep an index inside 0…length-1 (0 for an empty list). */
export function clampIndex(index: number, length: number): number {
  if (length <= 0 || !Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(length - 1, Math.trunc(index)));
}

/** Minimum horizontal travel (px) for a touch to count as a swipe. */
export const SWIPE_THRESHOLD = 40;

/**
 * Direction of a finished touch: +1 (swiped left → next), -1 (swiped right →
 * previous) or 0 (a tap, or a mostly vertical scroll).
 */
export function swipeStep(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.2) return 0;
  return dx < 0 ? 1 : -1;
}
