import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/**
 * Privileged Supabase client using the SECRET key. It bypasses Row Level
 * Security, so it is used only on the server, and only to write catalog data
 * (games). Never use it for user data.
 */
export function getAdminSupabase(): SupabaseClient | null {
  const key = process.env.SUPABASE_SECRET_KEY ?? "";
  if (!SUPABASE_URL || !key) return null;
  client ??= createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
