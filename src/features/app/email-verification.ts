"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useAppState } from "./store";

/**
 * The signed-in account's email-confirmation status, shared by the reminder
 * banner and the comment box. No row = confirmed (older accounts, or Supabase
 * confirmed it). Refreshed when the tab regains focus (e.g. after clicking the
 * link in another tab).
 */
export interface VerificationState {
  userId: string | null;
  status: "unknown" | "verified" | "sent" | "queued";
  email: string | null;
}

let state: VerificationState = { userId: null, status: "unknown", email: null };
const listeners = new Set<() => void>();
const emit = (next: VerificationState) => {
  state = next;
  listeners.forEach((l) => l());
};

export async function refreshVerification(userId: string | null) {
  if (!userId) return emit({ userId: null, status: "unknown", email: null });
  const { data, error } = await getSupabase().from("email_verifications").select("status, email").eq("user_id", userId).maybeSingle();
  if (error) return; // keep what we had (e.g. table not installed yet)
  emit({ userId, status: (data?.status as VerificationState["status"]) ?? "verified", email: data?.email ?? null });
}

export function setVerification(next: Partial<VerificationState>) {
  emit({ ...state, ...next });
}

export function useEmailVerification(): VerificationState {
  const app = useAppState();
  const userId = app.authReady ? app.currentUserId : null;
  const snap = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
  useEffect(() => {
    if (snap.userId === userId && snap.status !== "unknown") return;
    void refreshVerification(userId);
  }, [userId, snap.userId, snap.status]);
  useEffect(() => {
    if (!userId) return;
    const onFocus = () => void refreshVerification(userId);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [userId]);
  return snap.userId === userId ? snap : { userId, status: "unknown", email: null };
}

/** Ask the server to start / resend / change the confirmation email. */
export async function verificationAction(action: "start" | "resend" | "change", email?: string) {
  const res = await fetch("/api/auth/verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, email }),
  });
  const json = (await res.json().catch(() => ({}))) as { result?: string; status?: VerificationState["status"]; email?: string; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Couldn't send the email right now. Try again later.");
  if (json.status) setVerification({ status: json.status, email: json.email ?? null });
  return json;
}
