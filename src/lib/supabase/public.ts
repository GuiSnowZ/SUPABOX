import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, SUPABASE_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/**
 * Anonymous server-side client (no user session) for public data such as page
 * metadata. RLS limits it to what any visitor could see.
 */
export function getPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/**
 * A new anonymous client. Use inside "use cache" functions: the shared client
 * holds a module-level startup promise, and cached functions may not await
 * promises created outside them.
 */
export function createPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
