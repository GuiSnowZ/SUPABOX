"use client";

import { Star } from "lucide-react";
import { type KeyboardEvent, type PointerEvent, useState } from "react";
import { MAX_RATING, MIN_RATING, RATING_STEP } from "@/lib/ratings";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

const starSizes = { xs: "h-3 w-3", sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-7 w-7" };

function StarRow({ value, size }: { value: number; size: keyof typeof starSizes }) {
  return (
    <span className="relative inline-flex">
      {/* empty stars */}
      <span className="flex gap-0.5 text-border-strong">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={cn(starSizes[size], "fill-current")} strokeWidth={0} />
        ))}
      </span>
      {/* filled overlay, clipped to the rating */}
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${(value / 5) * 100}%` }}>
        <span className="flex gap-0.5 text-star">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={cn(starSizes[size], "shrink-0 fill-current")} strokeWidth={0} />
          ))}
        </span>
      </span>
    </span>
  );
}

/**
 * Read-only stars. Uses discrete half-star geometry so 3.5 renders exactly
 * three and a half stars (gap-aware approximation is fine at these sizes).
 */
export function StarRating({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: keyof typeof starSizes;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center", className)} role="img" aria-label={`${value} out of 5 stars`}>
      <StarRow value={value} size={size} />
    </span>
  );
}

/**
 * Half-star rating input exposed as an accessible slider.
 * Click/tap the left or right half of a star; arrow keys change by 0.5;
 * Home/End jump to the ends; Delete/Backspace clears.
 */
export function StarRatingInput({
  value,
  onChange,
  label,
  id,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  label?: string;
  id?: string;
}) {
  const t = useT();
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  function valueFromPointer(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    return Math.max(MIN_RATING, Math.ceil(ratio * 10) / 2);
  }

  function onKeyDown(e: KeyboardEvent) {
    const v = value ?? 0;
    let next: number | null | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(MAX_RATING, Math.max(MIN_RATING, v + RATING_STEP));
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = v <= MIN_RATING ? null : v - RATING_STEP;
    else if (e.key === "Home") next = MIN_RATING;
    else if (e.key === "End") next = MAX_RATING;
    else if (e.key === "Delete" || e.key === "Backspace") next = null;
    if (next !== undefined) {
      e.preventDefault();
      onChange(next);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div
        id={id}
        role="slider"
        tabIndex={0}
        aria-label={label ?? t.rating.yourRating}
        aria-valuemin={0}
        aria-valuemax={MAX_RATING}
        aria-valuenow={value ?? 0}
        aria-valuetext={value ? t.rating.outOf5(value) : t.rating.notRated}
        onKeyDown={onKeyDown}
        onPointerMove={(e) => e.pointerType === "mouse" && setHover(valueFromPointer(e))}
        onPointerLeave={() => setHover(null)}
        onClick={(e) => {
          const next = valueFromPointer(e as unknown as PointerEvent<HTMLDivElement>);
          onChange(next === value ? null : next);
        }}
        className="cursor-pointer touch-manipulation rounded-md py-1"
      >
        <StarRow value={shown} size="lg" />
      </div>
      <span className="min-w-14 text-sm tabular-nums text-muted" aria-hidden>
        {shown ? `${shown.toFixed(1)} / 5` : "—"}
      </span>
    </div>
  );
}
