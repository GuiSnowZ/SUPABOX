import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";


/**
 * Landing point for links in Supabase auth emails (sign-up confirmation,
 * password reset). Exchanges the one-time code for a session cookie, then
 * redirects to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const supabase = await createSupabaseServerClient();

  let error: string | null = searchParams.get("error_description");
  if (!error && code) {
    error = (await supabase.auth.exchangeCodeForSession(code)).error?.message ?? null;
  } else if (!error && tokenHash && type) {
    error = (await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error?.message ?? null;
  } else if (!error) {
    error = "This link is missing its code.";
  }

  if (error) {
    const url = new URL("/sign-in", origin);
    url.searchParams.set("error", "That link is invalid or has expired. Please try again.");
    return NextResponse.redirect(url);
  }
  return NextResponse.redirect(new URL(next, origin));
}
