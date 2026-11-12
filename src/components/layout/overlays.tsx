"use client";

import { LogIn, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { buttonClasses } from "@/components/ui/button";
import { LogoMark } from "./logo";
import { closeSignInPrompt, dismissToast, useUI } from "@/features/app/ui-store";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/i18n/client";
import { translateMessage } from "@/i18n/errors";

export function Toaster() {
  const t = useT();
  const locale = useLocale();
  const { toasts } = useUI();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          className={cn(
            "animate-fade-in pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-2.5 text-sm shadow-xl shadow-black/40",
            item.tone === "error" ? "border-danger/40 bg-[#2a1717] text-danger" : "border-border bg-surface text-fg",
          )}
        >
          {translateMessage(item.message, locale)}
          <button
            type="button"
            onClick={() => dismissToast(item.id)}
            aria-label={t.toast.dismiss}
            className="text-faint hover:text-fg"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Shown when a signed-out visitor tries to save, rate or follow. */
export function SignInPrompt() {
  const t = useT();
  const { authPrompt } = useUI();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (authPrompt && !d.open) d.showModal();
    if (!authPrompt && d.open) d.close();
  }, [authPrompt]);

  return (
    <dialog
      ref={ref}
      onClose={closeSignInPrompt}
      onClick={(e) => e.target === e.currentTarget && closeSignInPrompt()}
      className="m-auto w-[min(92vw,24rem)] rounded-2xl border border-border bg-bg-subtle p-0 text-fg backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      aria-labelledby="signin-prompt-title"
    >
      <div className="p-6 text-center">
        <LogoMark className="mx-auto h-10 w-10" />
        <h2 id="signin-prompt-title" className="mt-4 text-lg font-semibold">
          {t.signInPrompt.title}
        </h2>
        <p className="mt-1.5 text-sm text-muted">{authPrompt}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/sign-in" onClick={closeSignInPrompt} className={buttonClasses("primary", "md")}>
            <LogIn className="h-4 w-4" /> {t.common.signIn}
          </Link>
          <Link href="/sign-up" onClick={closeSignInPrompt} className={buttonClasses("secondary", "md")}>
            {t.common.createAccount}
          </Link>
          <button type="button" onClick={closeSignInPrompt} className="mt-1 text-sm text-faint hover:text-fg">
            {t.common.notNow}
          </button>
        </div>
      </div>
    </dialog>
  );
}
