import { Lock } from "lucide-react";
import { SectionHeader } from "@/components/ui/primitives";
import { MEDAL_TIERS, type MedalProgress, type MedalTier, medalProgress, TRACK_LABEL } from "@/lib/medals";
import { cn } from "@/lib/utils";

/** Medal artwork for each tier lives in /public/medals/tier-<level>.png (Supabox originals). */
const MEDAL_ART = true;

export function MedalArt({ tier, size = 64, locked = false, className }: { tier: MedalTier; size?: number; locked?: boolean; className?: string }) {
  const common = cn("shrink-0", locked && "opacity-25 grayscale", className);
  if (MEDAL_ART) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small static artwork
      <img
        src={`/medals/tier-${tier.level}.png`}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        width={size}
        height={size}
        className={cn(common, "object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]")}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={common} aria-hidden>
      <path d="M32 3 L56 13 V32 C56 46 45 56 32 61 C19 56 8 46 8 32 V13 Z" fill={tier.color} fillOpacity="0.22" stroke={tier.color} strokeWidth="3" />
      <path d="M32 10 L49 17 V31 C49 41 41 49 32 53 C23 49 15 41 15 31 V17 Z" fill={tier.color} fillOpacity="0.35" />
      <rect x="19" y="25" width="26" height="14" rx="7" fill="#0c0d10" />
      <path d="M25 29 v6 M22 32 h6" stroke={tier.color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="38" cy="30" r="1.6" fill={tier.color} />
      <circle cx="41" cy="33.5" r="1.6" fill={tier.color} />
    </svg>
  );
}

function TrackCard({ p }: { p: MedalProgress }) {
  const label = TRACK_LABEL[p.track];
  const unit = p.count === 1 ? label.unit[0] : label.unit[1];
  const shown = p.earned ?? MEDAL_TIERS[0];
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-bg-subtle p-4">
      <MedalArt tier={shown} size={64} locked={!p.earned} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold" style={p.earned ? { color: p.earned.color } : undefined}>
          {p.earned ? `${p.earned.name} ${label.title}` : label.title}
          {!p.earned ? <Lock className="ml-1.5 inline h-3.5 w-3.5 text-faint" aria-label="Locked" /> : null}
        </p>
        <p className="text-sm text-muted">
          {p.count} {unit}
        </p>
        {p.next ? (
          <>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface" aria-hidden>
              <div className="h-full rounded-full" style={{ width: `${Math.round(p.progress * 100)}%`, background: p.next.color }} />
            </div>
            <p className="mt-1 text-xs text-faint">
              {p.next.threshold - p.count} more for {p.next.name}
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs text-faint">Highest medal reached.</p>
        )}
      </div>
    </div>
  );
}

/** A profile's medals: reviews written and games completed, with progress to the next tier. */
export function Medals({ reviews, completed }: { reviews: number; completed: number }) {
  const tracks = [medalProgress("reviews", reviews), medalProgress("completed", completed)];
  return (
    <section aria-labelledby="medals-heading">
      <SectionHeader id="medals-heading" title="Medals" />
      <div className="grid gap-3 sm:grid-cols-2">
        {tracks.map((p) => (
          <TrackCard key={p.track} p={p} />
        ))}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs text-faint hover:text-fg">How medals work</summary>
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-9">
          {MEDAL_TIERS.map((t) => (
            <li key={t.level} className="flex flex-col items-center text-center">
              <MedalArt tier={t} size={40} />
              <span className="mt-1 text-xs font-medium" style={{ color: t.color }}>
                {t.name}
              </span>
              <span className="text-[11px] text-faint">{t.threshold}+</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-faint">
          Medals are earned automatically: write reviews to climb as a Critic, finish games to climb as a Completionist.
        </p>
      </details>
    </section>
  );
}
