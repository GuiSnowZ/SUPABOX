"use client";

import { ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { SquareCrop } from "@/features/app/avatar";
import { clampPosition, type CropState, cropRect, initialCrop, MAX_ZOOM, MIN_ZOOM, scaleFor, zoomTo } from "@/lib/crop";

const VIEW = 280; // px, the square crop window

/**
 * Crop editor for the profile picture: drag to move, slider / buttons / wheel /
 * pinch to zoom. The round mask previews how the avatar will look.
 */
export function AvatarCropper({
  url,
  onCancel,
  onConfirm,
  saving,
}: {
  /** Object URL of the chosen file; the parent creates and revokes it. */
  url: string;
  onCancel: () => void;
  onConfirm: (crop: SquareCrop) => void;
  saving: boolean;
}) {
  // One cropper per file (the parent remounts it with a new key), so state starts fresh.
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<CropState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  const setZoom = (z: number) => size && crop && setCrop(zoomTo(size.w, size.h, VIEW, crop, z));

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && crop) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: crop.zoom };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !size || !crop) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      setCrop(zoomTo(size.w, size.h, VIEW, crop, pinch.current.zoom * (dist / pinch.current.dist)));
      return;
    }
    setCrop(clampPosition(size.w, size.h, VIEW, { ...crop, x: crop.x + e.clientX - prev.x, y: crop.y + e.clientY - prev.y }));
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  }

  const scale = size && crop ? scaleFor(size.w, size.h, VIEW, crop.zoom) : 1;

  return (
    <Dialog open onClose={onCancel} title="Adjust your photo" description="Drag to move it, and zoom to frame it.">
      <div className="flex flex-col items-center">
        <div
          className="relative touch-none overflow-hidden rounded-xl bg-black select-none"
          style={{ width: VIEW, height: VIEW, cursor: crop ? "grab" : "default" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => crop && setZoom(crop.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file
            <img
              src={url}
              alt="Your photo"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setSize({ w: img.naturalWidth, h: img.naturalHeight });
                setCrop(initialCrop(img.naturalWidth, img.naturalHeight, VIEW));
              }}
              onError={() => setError("Your browser can't open this image. Try a JPG or PNG.")}
              className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left"
              style={
                size && crop
                  ? { width: size.w * scale, height: size.h * scale, transform: `translate(${crop.x}px, ${crop.y}px)` }
                  : { opacity: 0 }
              }
            />
          ) : null}
          {/* Round preview mask */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(0,0,0,0.55)] ring-2 ring-white/70" />
        </div>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        <div className="mt-4 flex w-full max-w-[280px] items-center gap-3">
          <button type="button" onClick={() => crop && setZoom(crop.zoom / 1.2)} aria-label="Zoom out" className="text-muted hover:text-fg">
            <ZoomOut className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={crop?.zoom ?? 1}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="h-1.5 flex-1 cursor-pointer accent-[var(--color-accent)]"
            disabled={!crop}
          />
          <button type="button" onClick={() => crop && setZoom(crop.zoom * 1.2)} aria-label="Zoom in" className="text-muted hover:text-fg">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid w-full max-w-[280px] grid-cols-2 gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => size && crop && onConfirm(cropRect(size.w, size.h, VIEW, crop))} disabled={!crop || saving}>
            {saving ? "Saving…" : "Save photo"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
