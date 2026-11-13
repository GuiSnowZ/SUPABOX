"use client";

import { MailWarning, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useEmailVerification, verificationAction } from "@/features/app/email-verification";
import { toast } from "@/features/app/ui-store";
import { useT } from "@/i18n/client";

/**
 * Thin reminder under the header while the account's email isn't confirmed:
 * resend the link, or fix a mistyped address. Hidden once confirmed.
 */
export function VerifyEmailBanner() {
  const t = useT();
  const v = useEmailVerification();
  const [hidden, setHidden] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  if (hidden || (v.status !== "sent" && v.status !== "queued") || !v.email) return null;

  async function resend() {
    setBusy(true);
    try {
      const r = await verificationAction("resend");
      toast(
        r.result === "sent" ? t.verify.resent : r.result === "cooldown" ? t.verify.resendWait : r.result === "limit" ? t.verify.resendLimit : t.verify.queuedToast,
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : t.verify.error, "error");
    } finally {
      setBusy(false);
    }
  }

  async function change(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await verificationAction("change", email);
      toast(t.verify.fixed(r.email ?? email));
      setFixing(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : t.verify.error, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="status" className="border-b border-[#f5c518]/25 bg-[#f5c518]/[0.07]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 text-sm sm:px-6">
        <MailWarning className="h-4 w-4 shrink-0 text-[#f5c518]" aria-hidden />
        <p className="min-w-0 flex-1 text-fg/90">{v.status === "queued" ? t.verify.queued(v.email) : t.verify.sent(v.email)}</p>
        {fixing ? (
          <form onSubmit={change} className="flex w-full flex-wrap gap-2 sm:w-auto">
            <label htmlFor="fix-email" className="sr-only">
              {t.verify.fix}
            </label>
            <Input
              id="fix-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.verify.fixPlaceholder}
              className="h-9 min-w-0 flex-1 sm:w-56"
            />
            <Button size="sm" type="submit" disabled={busy}>
              {t.verify.fixSave}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setFixing(false)}>
              {t.verify.cancel}
            </Button>
          </form>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            {v.status === "sent" ? (
              <Button size="sm" variant="secondary" onClick={resend} disabled={busy}>
                {t.verify.resend}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => (setEmail(v.email ?? ""), setFixing(true))}>
              {t.verify.fix}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setHidden(true)} aria-label={t.verify.dismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
