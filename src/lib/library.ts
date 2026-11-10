import type { LibraryStatus, PlaySessionKind } from "@/types";

export const LIBRARY_STATUSES: LibraryStatus[] = ["want_to_play", "playing", "completed", "dropped"];

export const STATUS_LABEL: Record<LibraryStatus, string> = {
  want_to_play: "Want to Play",
  playing: "Playing",
  completed: "Completed",
  dropped: "Dropped",
};

export const STATUS_TONE: Record<LibraryStatus, "info" | "accent" | "warning" | "danger"> = {
  want_to_play: "info",
  playing: "accent",
  completed: "warning",
  dropped: "danger",
};

export const SESSION_KIND_LABEL: Record<PlaySessionKind, string> = {
  first_playthrough: "First playthrough",
  replay: "Replay",
  returned: "Returned to it",
};
