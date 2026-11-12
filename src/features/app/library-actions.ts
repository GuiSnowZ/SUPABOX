"use client";

/**
 * Changing a game's library status from any screen. Marking a game Completed
 * opens the "rate and review it" prompt, so every place that can complete a
 * game behaves the same way.
 */
import { STATUS_LABEL } from "@/lib/library";
import type { Game, LibraryStatus } from "@/types";
import { getUserGame } from "./selectors";
import { actions, getAppState, registerGames } from "./store";
import { openReviewPrompt, toast } from "./ui-store";

export async function changeLibraryStatus(game: Game, status: LibraryStatus | null): Promise<boolean> {
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
    toast(status ? `Marked as ${STATUS_LABEL[status]}` : `Removed ${game.title} from your library`);
  }
  return true;
}
