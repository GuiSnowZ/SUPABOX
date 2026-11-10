"use client";

import { getCurrentProfile } from "./selectors";
import { useAppState } from "./store";

/** The signed-in user's profile, or null (also null while auth is loading — check `authReady`). */
export function useCurrentUser() {
  return getCurrentProfile(useAppState());
}

export { useHydrated } from "@/hooks/use-hydrated";
