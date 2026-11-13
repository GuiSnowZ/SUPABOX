import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";
import { verificationEmail } from "./templates";

/**
 * Email confirmation that doesn't block sign-up (see migration
 * 20261119000000_email_verification_queue). New accounts get a row in
 * email_verifications; the confirmation email goes out right away when the
 * daily budget allows, otherwise it waits in the queue for the daily job.
 */

/** Resend's free plan sends 100 emails a day; keep 20 for Supabase's own emails (password resets). */
export const DAILY_VERIFICATION_EMAILS = 80;
/** Links stop working after this long (a new one can be requested). */
export const LINK_VALID_DAYS = 7;
/** Per account: minimum wait between resends, and a daily cap. */
export const RESEND_COOLDOWN_MS = 2 * 60_000;
export const MAX_SENDS_PER_ACCOUNT = 5;

export type VerificationStatus = "queued" | "sent" | "verified";

export interface VerificationRow {
  user_id: string;
  email: string;
  token_hash: string | null;
  status: VerificationStatus;
  send_count: number;
  created_at: string;
  sent_at: string | null;
  verified_at: string | null;
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Send one email through Resend's API. In development without a key, the link is printed instead. */
async function deliver(to: string, subject: string, html: string, link: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email:dev] to ${to}: ${subject}\n  ${link}`);
      return;
    }
    throw new Error("Email sending isn't configured (RESEND_API_KEY).");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || "Supabox <noreply@supaboxd.com>", to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export type SendResult = "sent" | "queued" | "verified" | "cooldown" | "limit";

/**
 * Send (or queue) the confirmation email for an account. Creates the row if
 * needed. Each send makes a fresh link; older links stop working.
 */
export async function sendVerification(
  admin: SupabaseClient,
  user: { id: string; email: string; locale: string; name: string },
  opts: { force?: boolean } = {},
): Promise<SendResult> {
  const { data: existing, error } = await admin.from("email_verifications").select("*").eq("user_id", user.id).maybeSingle<VerificationRow>();
  if (error) throw new Error(error.message);
  if (existing?.status === "verified") return "verified";
  if (existing && !opts.force) {
    if (existing.send_count >= MAX_SENDS_PER_ACCOUNT && existing.sent_at && Date.now() - Date.parse(existing.sent_at) < 86_400_000) return "limit";
    if (existing.sent_at && Date.now() - Date.parse(existing.sent_at) < RESEND_COOLDOWN_MS) return "cooldown";
  }
  if (!existing) {
    const ins = await admin.from("email_verifications").insert({ user_id: user.id, email: user.email, status: "queued" });
    if (ins.error && ins.error.code !== "23505") throw new Error(ins.error.message);
  }

  const { data: slot, error: slotError } = await admin.rpc("claim_email_slot", { p_daily_limit: DAILY_VERIFICATION_EMAILS });
  if (slotError) throw new Error(slotError.message);
  if (!slot) {
    await admin.from("email_verifications").update({ status: "queued", email: user.email }).eq("user_id", user.id).neq("status", "verified");
    return "queued";
  }

  const token = randomBytes(32).toString("base64url");
  const link = `${SITE_URL}/auth/verify?token=${token}`;
  const mail = verificationEmail({ link, name: user.name, locale: user.locale === "en" ? "en" : "pt-BR" });
  await deliver(user.email, mail.subject, mail.html, link);
  const upd = await admin
    .from("email_verifications")
    .update({
      status: "sent",
      email: user.email,
      token_hash: hashToken(token),
      sent_at: new Date().toISOString(),
      send_count: (existing?.send_count ?? 0) + 1,
    })
    .eq("user_id", user.id)
    .neq("status", "verified");
  if (upd.error) throw new Error(upd.error.message);
  return "sent";
}

/** The daily job: send queued confirmations, oldest first, while the budget lasts. */
export async function processQueue(admin: SupabaseClient, max = DAILY_VERIFICATION_EMAILS): Promise<{ sent: number; left: number }> {
  const { data, error } = await admin
    .from("email_verifications")
    .select("user_id, email")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(max);
  if (error) throw new Error(error.message);
  let sent = 0;
  for (const row of data ?? []) {
    const { data: u } = await admin.auth.admin.getUserById(row.user_id);
    const meta = (u.user?.user_metadata ?? {}) as { locale?: string; display_name?: string };
    const r = await sendVerification(
      admin,
      { id: row.user_id, email: u.user?.email ?? row.email, locale: meta.locale ?? "pt-BR", name: meta.display_name ?? "" },
      { force: true },
    );
    if (r === "queued") break; // budget used up for today
    if (r === "sent") sent++;
  }
  const { count } = await admin.from("email_verifications").select("user_id", { count: "exact", head: true }).eq("status", "queued");
  return { sent, left: count ?? 0 };
}

export type VerifyResult = "verified" | "invalid" | "expired";

/** Check a link's token: valid, unused and not expired → the account is confirmed. */
export async function verifyToken(admin: SupabaseClient, token: string): Promise<VerifyResult> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return "invalid";
  const { data, error } = await admin.from("email_verifications").select("*").eq("token_hash", hashToken(token)).maybeSingle<VerificationRow>();
  if (error) throw new Error(error.message);
  if (!data) return "invalid";
  if (data.status === "verified") return "verified";
  if (!data.sent_at || Date.now() - Date.parse(data.sent_at) > LINK_VALID_DAYS * 86_400_000) return "expired";
  const upd = await admin
    .from("email_verifications")
    .update({ status: "verified", verified_at: new Date().toISOString(), token_hash: null })
    .eq("user_id", data.user_id);
  if (upd.error) throw new Error(upd.error.message);
  return "verified";
}
