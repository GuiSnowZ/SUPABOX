"use client";

import { Globe } from "lucide-react";
import { useId } from "react";
import { getAppState } from "@/features/app/store";
import { useLocale, useT } from "@/i18n/client";
import { isLocale, LOCALE_COOKIE, LOCALE_NAMES, LOCALES } from "@/i18n/config";
import { getSupabase } from "@/lib/supabase/client";

/**
 * Saves the chosen language in a cookie (read by the proxy on every request)
 * and on the profile when signed in, then reloads the page in that language.
 */
export function LanguageSwitcher() {
  const t = useT();
  const locale = useLocale();
  const id = useId();

  async function change(next: string) {
    if (!isLocale(next) || next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const userId = getAppState().currentUserId;
    if (userId) await getSupabase().from("profiles").update({ locale: next }).eq("id", userId);
    window.location.reload();
  }

  return (
    <label htmlFor={id} className="inline-flex items-center gap-1.5 hover:text-fg">
      <Globe className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">{t.footer.language}</span>
      <select
        id={id}
        value={locale}
        onChange={(e) => void change(e.target.value)}
        className="cursor-pointer bg-transparent text-xs text-faint hover:text-fg focus:text-fg"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} className="bg-bg-subtle text-fg">
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
