"use client";

import { useEffect } from "react";
import { registerGames } from "@/features/app/store";
import type { Game } from "@/types";

/** Puts server-rendered games into the client cache (used by library, lists, feed…). */
export function RegisterGames({ games }: { games: Game[] }) {
  useEffect(() => registerGames(games), [games]);
  return null;
}
