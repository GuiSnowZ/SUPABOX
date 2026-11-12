"use client";

/**
 * Changing a game's library status from any screen. Marking a game Completed
 * opens the "rate and review it" prompt, so every place that can complete a
 * game behaves the same way.
 */
import type { Dictionary } from "@/i18n";
import type { Game, LibraryStatus } from "@/types";
import { getUserGame } from "./selectors";
import { actions, getAppState, registerGames } from "./store";
import { openReviewPrompt, toast } from "./ui-store";

export async function changeLibraryStatus(game: Game, status: LibraryStatus | null, t: Dictionary): Promise<boolean> {
  const before = getUserGame(getAppState(), getAppState().currentUserId, game.id)?.status ?? null;
  registerGames([game]);
  const r = await actions.setLibraryStatus(game.id, status);
  if (!r.ok) {
    toast(r.error, "error");
    return false;
  }
  if (status === "completed" && before !== "completed") {
    openReviewPrompt(game.id);
  } else {
    toast(status ? t.panel.markedAs(t.status[status]) : t.panel.removedFromLibrary(game.title));
  }
  return true;
}
