"use client";

/**
 * Authentication with Supabase Auth. Supabox never stores or sees password
 * hashes. Sessions live in cookies managed by @supabase/ssr.
 */
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthResult = { ok: true } | { ok: false; error: string };

export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
export const MIN_PASSWORD_LENGTH = 8;

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox for the link.";
  if (m.includes("user already registered")) return "An account with this email already exists. Try signing in.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("password")) return message;
  if (m.includes("database error saving new user")) return "That username can't be used. Try another one.";
  return message;
}

function notConfigured(): AuthResult {
  return { ok: false, error: "Supabox isn't connected to its database yet." };
}

/** Where email links (confirmation, password reset) should land. */
function callbackUrl(next: string) {
  return `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return notConfigured();
  const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
  return error ? { ok: false, error: friendly(error.message) } : { ok: true };
}

export interface SignUpInput {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

/** Returns `needsConfirmation` when Supabase requires email confirmation before sign-in. */
export async function signUp(input: SignUpInput): Promise<AuthResult & { needsConfirmation?: boolean }> {
  if (!isSupabaseConfigured) return notConfigured();
  const username = input.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, error: "Usernames are 3–30 characters: lowercase letters, numbers and underscores." };
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  const db = getSupabase();
  const { data: available, error: checkError } = await db.rpc("is_username_available", { p_username: username });
  if (checkError) return { ok: false, error: friendly(checkError.message) };
  if (!available) return { ok: false, error: `@${username} is taken. Try another username.` };

  const { data, error } = await db.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: { username, display_name: input.displayName.trim() || username },
      emailRedirectTo: callbackUrl("/profile"),
    },
  });
  if (error) return { ok: false, error: friendly(error.message) };
  // With email confirmation enabled, Supabase returns a user but no session.
  // (It also returns a user with no identities if the email is already registered.)
  if (data.user && data.user.identities?.length === 0) {
    return { ok: false, error: "An account with this email already exists. Try signing in." };
  }
  return { ok: true, needsConfirmation: !data.session };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await getSupabase().auth.signOut();
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return notConfigured();
  const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: callbackUrl("/account/password"),
  });
  return error ? { ok: false, error: friendly(error.message) } : { ok: true };
}

export async function updatePassword(password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return notConfigured();
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  const { error } = await getSupabase().auth.updateUser({ password });
  return error ? { ok: false, error: friendly(error.message) } : { ok: true };
}
