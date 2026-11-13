"use client";

import { Link2, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/features/app/ui-store";
import { useLocale, useT } from "@/i18n/client";
import { ogPath } from "@/lib/seo/og-lang";

/**
 * Share a review: a Stories image (cover + stars + Supabox branding), sent
 * through the phone's share sheet when it supports files, otherwise
 * downloaded; and a plain "copy link".
 */
export function ShareReview({ reviewId, gameTitle, gameSlug }: { reviewId: string; gameTitle: string; gameSlug: string }) {
  const t = useT();
  const locale = useLocale();
  const [busy, setBusy] = useState(false);

  async function shareStory() {
    setBusy(true);
    try {
      const res = await fetch(ogPath(`/og/story/${reviewId}`, locale));
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const file = new File([blob], `supabox-${gameSlug}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: gameTitle });
        } catch (e) {
          if ((e as Error).name !== "AbortError") throw e;
        }
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      toast(t.og.storySaved);
    } catch {
      toast(t.og.shareError, "error");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast(t.og.linkCopied);
    } catch {
      toast(window.location.href);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={shareStory} disabled={busy}>
        <Share2 className="h-4 w-4" /> {busy ? t.og.preparing : t.og.shareStory}
      </Button>
      <Button size="sm" variant="secondary" onClick={copyLink}>
        <Link2 className="h-4 w-4" /> {t.og.copyLink}
      </Button>
    </div>
  );
}
