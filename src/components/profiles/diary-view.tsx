"use client";

import { CalendarDays, Check, ChevronLeft, ChevronRight, Play } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GameCover } from "@/components/games/game-cover";
import { LoadError, PageSkeleton } from "@/components/layout/require-user";
import { Button } from "@/components/ui/button";
import { Container, EmptyState, PageHeader } from "@/components/ui/primitives";
import { getPlaySessions, getProfileByUsername } from "@/features/app/selectors";
import { loaders, useAppState, useLoad } from "@/features/app/store";
import { SESSION_KIND_LABEL } from "@/lib/library";
import { cn } from "@/lib/utils";
import type { Game, PlaySession } from "@/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthFmt = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const dayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

interface DayEvent {
  session: PlaySession;
  game: Game;
  kind: "started" | "finished";
}

const ym = (iso: string) => iso.slice(0, 7);
function shiftMonth(month: string, delta: number): string {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}

/** Days of the month as a Monday-first grid (null = padding). */
function monthGrid(month: string): Array<string | null> {
  const first = new Date(`${month}-01T00:00:00Z`);
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: Array<string | null> = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** `/users/[username]/diary`: a calendar of when games were started and finished. */
export function DiaryView({ username }: { username: string }) {
  const state = useAppState();
  const status = useLoad(`user:${username.toLowerCase()}`, () => loaders.user(username));
  const profile = getProfileByUsername(state, username);
  const profileId = profile?.id;
  const sessions = useMemo(() => (profileId ? getPlaySessions(state, profileId) : []), [state, profileId]);

  // Events by day: a start and (if any) a finish for each entry.
  const byDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    const add = (day: string, e: DayEvent) => map.set(day, [...(map.get(day) ?? []), e]);
    for (const s of sessions) {
      const game = state.games[s.gameId];
      if (!game) continue;
      add(s.startedOn, { session: s, game, kind: "started" });
      if (s.finishedOn) add(s.finishedOn, { session: s, game, kind: "finished" });
    }
    return map;
  }, [sessions, state.games]);

  const latest = sessions.map((s) => s.finishedOn ?? s.startedOn).sort().at(-1);
  const [month, setMonth] = useState<string | null>(null);
  const shown = month ?? ym(latest ?? new Date().toISOString());
  const [selected, setSelected] = useState<string | null>(null);

  if (status === "error" && !profile) return <LoadError onRetry={() => void loaders.user(username)} />;
  if (!profile) {
    return status === "ready" ? (
      <Container className="py-16">
        <EmptyState title="User not found" description={`There's no one called @${username} on Supabox.`} />
      </Container>
    ) : (
      <PageSkeleton />
    );
  }

  // The profile can be cached before its diary has loaded: wait instead of showing "nothing yet".
  if (status !== "ready" && status !== "error") return <PageSkeleton />;

  const isOwner = state.currentUserId === profile.id;
  const monthDays = [...byDay.keys()].filter((d) => ym(d) === shown).sort();
  const listDays = selected && ym(selected) === shown ? [selected] : monthDays;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Container className="max-w-4xl">
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-muted">
        <Link href={`/users/${profile.username}`} className="inline-flex items-center gap-1 hover:text-fg">
          <ChevronLeft className="h-4 w-4" /> {profile.displayName}
        </Link>
      </nav>
      <PageHeader
        title={isOwner ? "My Diary" : `${profile.displayName}'s Diary`}
        description="Every playthrough, by the day it started and finished."
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarDays />}
          title="No diary entries yet"
          description={isOwner ? "Use the + button or a game's page to log when you start or finish a game." : undefined}
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => (setMonth(shiftMonth(shown, -1)), setSelected(null))} aria-label="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold" aria-live="polite">
              {monthFmt.format(new Date(`${shown}-01T00:00:00Z`))}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => (setMonth(shiftMonth(shown, 1)), setSelected(null))} aria-label="Next month">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-faint" aria-hidden>
            {WEEKDAYS.map((d) => (
              <div key={d} className="pb-1">
                <span className="sm:hidden">{d[0]}</span>
                <span className="max-sm:hidden">{d}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1" aria-label="Diary calendar">
            {monthGrid(shown).map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />;
              const events = byDay.get(day) ?? [];
              const covers = [...new Map(events.map((e) => [e.game.id, e])).values()];
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelected(selected === day ? null : day)}
                  disabled={!events.length}
                  aria-label={`${dayFmt.format(new Date(`${day}T00:00:00Z`))}: ${events.length ? events.map((e) => `${e.kind} ${e.game.title}`).join(", ") : "nothing logged"}`}
                  aria-pressed={selected === day}
                  className={cn(
                    "relative flex aspect-[3/4] flex-col overflow-hidden rounded-md border text-left transition-colors sm:aspect-square",
                    events.length ? "border-border bg-bg-subtle hover:border-accent/60" : "border-transparent bg-surface/40",
                    selected === day && "border-accent ring-1 ring-accent",
                    day === today && "outline outline-1 outline-accent/50",
                  )}
                >
                  {covers[0] ? (
                    <GameCover game={covers[0].game} showTitle={false} className="absolute inset-0 h-full rounded-none opacity-80 ring-0" />
                  ) : null}
                  <span className={cn("relative z-10 m-1 self-start rounded px-1 text-[11px] font-semibold tabular-nums", covers[0] ? "bg-black/70 text-white" : "text-faint")}>
                    {Number(day.slice(8))}
                  </span>
                  {covers.length > 1 ? (
                    <span className="absolute right-1 bottom-1 z-10 rounded bg-black/75 px-1 text-[10px] font-semibold text-white">+{covers.length - 1}</span>
                  ) : null}
                  {events.some((e) => e.kind === "finished") ? (
                    <span className="absolute bottom-1 left-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-fg">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="mt-2 flex items-center gap-3 text-xs text-faint">
            <span className="inline-flex items-center gap-1">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-accent-fg">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
              finished that day
            </span>
            <span>Tap a day to see its entries.</span>
          </p>

          <section aria-label="Entries" className="mt-8 space-y-6">
            {listDays.length === 0 ? (
              <p className="text-sm text-muted">Nothing logged this month.</p>
            ) : (
              listDays.map((day) => (
                <div key={day}>
                  <h3 className="mb-2 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                    {dayFmt.format(new Date(`${day}T00:00:00Z`))}
                  </h3>
                  <ul className="space-y-2">
                    {(byDay.get(day) ?? []).map((e) => (
                      <li key={`${e.session.id}-${e.kind}`}>
                        <Link href={`/games/${e.game.slug}`} className="flex items-center gap-3 rounded-lg border border-border bg-bg-subtle p-2 hover:border-border-strong">
                          <GameCover game={e.game} showTitle={false} className="w-10 shrink-0" />
                          <span className="min-w-0 flex-1 text-sm">
                            <span className="block truncate font-medium text-fg">{e.game.title}</span>
                            <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                              {e.kind === "finished" ? (
                                <span className="inline-flex items-center gap-1 text-accent">
                                  <Check className="h-3 w-3" /> Finished
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  <Play className="h-3 w-3" /> Started
                                </span>
                              )}
                              <span>{SESSION_KIND_LABEL[e.session.kind]}</span>
                              {e.session.platform ? <span>{e.session.platform}</span> : null}
                              {e.session.hours != null ? <span>{e.session.hours} h</span> : null}
                            </span>
                            {e.session.note ? <span className="mt-0.5 block truncate text-xs text-faint">“{e.session.note}”</span> : null}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </Container>
  );
}
