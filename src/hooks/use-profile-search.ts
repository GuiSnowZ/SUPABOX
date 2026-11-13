"use client";

import { useEffect, useState } from "react";
import { toProfile } from "@/features/app/db";
import { registerProfiles } from "@/features/app/store";
import { getSupabase } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export const MAX_PROFILE_RESULTS = 8;

/**
 * Turn what was typed into a safe search term for a PostgREST `or` filter:
 * only letters, digits, spaces, "_" and "-" survive (so commas, parentheses or
 * wildcards can't change the query), and "_" is escaped for LIKE.
 */
export function profileSearchTerm(query: string): string {
  return query
    .trim()
    .replace(/^@/, "")
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, 40)
    .replace(/_/g, "\\_");
}

export type ProfileSearchState = { status: "idle" | "loading" | "done" | "error"; profiles: Profile[] };

/** Debounced search of public profiles by display name or @username, most followed and active first. */
export function useProfileSearch(query: string, delay = 250): ProfileSearchState {
  const [state, setState] = useState<ProfileSearchState>({ status: "idle", profiles: [] });
  const term = profileSearchTerm(query);

  useEffect(() => {
    if (term.replace(/\\/g, "").length < 2) return;
    let alive = true;
    const timer = setTimeout(async () => {
      setState((s) => ({ status: "loading", profiles: s.profiles }));
      const db = getSupabase();
      // Ranked search (most followed / active first, see migration search_profiles)…
      let { data, error } = await db.rpc("search_profiles", { p_query: query.trim(), p_limit: MAX_PROFILE_RESULTS });
      // …or a plain name match if that database function isn't installed yet.
      if (error?.code === "PGRST202" || error?.code === "42883") {
        const pattern = `*${term}*`;
        ({ data, error } = await db
          .from("profiles")
          .select("id, username, display_name, bio, avatar_hue, avatar_path, created_at")
          .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
          .order("username")
          .limit(MAX_PROFILE_RESULTS));
      }
      if (!alive) return;
      if (error) return setState({ status: "error", profiles: [] });
      const profiles = (data ?? []).map(toProfile);
      registerProfiles(profiles);
      setState({ status: "done", profiles });
    }, delay);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // The raw query is sent to the database function, which escapes it itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, delay]);

  return term.replace(/\\/g, "").length < 2 ? { status: "idle", profiles: [] } : state;
}
