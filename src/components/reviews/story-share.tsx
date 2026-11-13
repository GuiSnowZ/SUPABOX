"use client";

import { Download, Link2, RotateCw, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/primitives";
import { toast } from "@/features/app/ui-store";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

type StoryImage =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; url: string; file: File };

/**
 * The Stories image (cover + stars + Supabox branding) for a review, fetched
 * as soon as it's shown. Having the file ready matters on iPhone: Safari only
 * opens the share sheet if share() runs right away when the button is tapped.
 * `version` (the review's edit time) makes sure an edited rating isn't served
 * from an old cached image.
 */
function useStoryImage(reviewId: string, version: string, fileName: string): [StoryImage, () => void] {
  const locale = useLocale();
  const [attempt, setAttempt] = useState(0);
  const [image, setImage] = useState<StoryImage>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    const qs = new URLSearchParams({ v: version });
    if (locale !== "en") qs.set("lang", locale);
    fetch(`/og/story/${reviewId}?${qs}`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.blob();
      })
      .then((blob) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setImage({ status: "ready", url: objectUrl, file: new File([blob], fileName, { type: "image/png" }) });
      })
      .catch(() => alive && setImage({ status: "error" }));
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [reviewId, version, locale, fileName, attempt]);

  const retry = () => {
    setImage({ status: "loading" });
    setAttempt((n) => n + 1);
  };
  return [image, retry];
}

function download(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

/**
 * Share buttons for a review's Stories image: the phone's share sheet (where
 * Instagram Stories, WhatsApp… appear), saving the image, and copying the link.
 * With `preview`, the image itself is shown above the buttons.
 */
export function StoryShare({
  reviewId,
  version,
  gameTitle,
  gameSlug,
  preview = false,
  className,
}: {
  reviewId: string;
  version: string;
  gameTitle: string;
  gameSlug: string;
  preview?: boolean;
  className?: string;
}) {
  const t = useT();
  const fileName = `supabox-${gameSlug}.png`;
  const [image, retry] = useStoryImage(reviewId, version, fileName);
  const pageUrl = () => `${window.location.origin}/reviews/${reviewId}`;

  async function share() {
    if (image.status !== "ready") return;
    if (navigator.canShare?.({ files: [image.file] })) {
      try {
        await navigator.share({ files: [image.file], title: gameTitle });
      } catch (e) {
        if ((e as Error).name !== "AbortError") toast(t.og.shareError, "error");
      }
      return;
    }
    // No file sharing (most desktops): save the image instead.
    download(image.url, fileName);
    toast(t.og.storySaved);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl());
      toast(t.og.linkCopied);
    } catch {
      toast(pageUrl());
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {preview ? (
        <div className="mx-auto w-full max-w-[13rem] sm:max-w-[15rem]">
          {image.status === "ready" ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL
            <img
              src={image.url}
              alt={t.og.storyAlt(gameTitle)}
              width={1080}
              height={1920}
              className="aspect-[9/16] w-full rounded-xl object-cover shadow-2xl ring-1 ring-border"
            />
          ) : image.status === "loading" ? (
            <Skeleton className="aspect-[9/16] w-full rounded-xl" />
          ) : (
            <div className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-bg-subtle p-4 text-center text-sm text-muted">
              {t.og.imageError}
              <Button size="sm" variant="secondary" onClick={retry}>
                <RotateCw className="h-4 w-4" /> {t.og.retry}
              </Button>
            </div>
          )}
        </div>
      ) : null}
      <div className={cn("flex flex-wrap gap-2", preview && "justify-center")}>
        <Button size={preview ? "md" : "sm"} onClick={share} disabled={image.status !== "ready"}>
          <Share2 className="h-4 w-4" /> {image.status === "loading" ? t.og.preparing : preview ? t.og.share : t.og.shareStory}
        </Button>
        {preview ? (
          <Button
            size="md"
            variant="secondary"
            onClick={() => image.status === "ready" && download(image.url, fileName)}
            disabled={image.status !== "ready"}
          >
            <Download className="h-4 w-4" /> {t.og.saveImage}
          </Button>
        ) : null}
        <Button size={preview ? "md" : "sm"} variant="secondary" onClick={copyLink}>
          <Link2 className="h-4 w-4" /> {t.og.copyLink}
        </Button>
      </div>
    </div>
  );
}

/**
 * "Share my rating" on a game page: opens the same Stories preview as the
 * rating prompt. Only rendered once the viewer has rated the game.
 */
export function ShareRatingButton({
  reviewId,
  version,
  gameTitle,
  gameSlug,
  className,
}: {
  reviewId: string;
  version: string;
  gameTitle: string;
  gameSlug: string;
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" className={className} onClick={() => setOpen(true)}>
        <Share2 className="h-4 w-4" /> {t.og.shareMyRating}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t.og.shareTitle(gameTitle)} description={t.og.shareHint}>
        {open ? (
          <div className="space-y-5">
            <StoryShare reviewId={reviewId} version={version} gameTitle={gameTitle} gameSlug={gameSlug} preview />
            <div className="flex justify-center">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {t.og.done}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
