"use client";

/**
 * Profile picture upload. The browser crops the image to a centred square,
 * resizes it to AVATAR_SIZE and re-encodes it before uploading, so the stored
 * file is small (the bucket accepts WebP or JPEG up to 512 KB). WebP is used
 * where the browser can make it; Safari can't, so it gets JPEG.
 */
import { getSupabase } from "@/lib/supabase/client";
import { actions, getAppState, type ActionResult } from "./store";

export const AVATAR_SIZE = 320;
export const MAX_AVATAR_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 512 * 1024;

/** Largest centred square inside a w×h image: [sx, sy, side]. */
export function centeredSquare(width: number, height: number): [number, number, number] {
  const side = Math.min(width, height);
  return [Math.floor((width - side) / 2), Math.floor((height - side) / 2), side];
}

type Encoded = { blob: Blob; type: "image/webp" | "image/jpeg"; ext: "webp" | "jpg" };

function encode(canvas: HTMLCanvasElement, type: Encoded["type"], quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function toAvatarImage(file: File): Promise<Encoded> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const [sx, sy, side] = centeredSquare(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images.");
  // JPEG has no transparency: give see-through images the site's background colour.
  ctx.fillStyle = "#0c0d10";
  ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();
  // Browsers that can't encode WebP (Safari) silently return PNG instead, so check the type.
  const probe = await encode(canvas, "image/webp", 0.86);
  const format: Pick<Encoded, "type" | "ext"> =
    probe?.type === "image/webp" ? { type: "image/webp", ext: "webp" } : { type: "image/jpeg", ext: "jpg" };
  for (const quality of [0.86, 0.72, 0.55]) {
    const blob = quality === 0.86 && format.type === "image/webp" ? probe : await encode(canvas, format.type, quality);
    if (!blob || blob.type !== format.type) throw new Error("Your browser couldn't convert that image. Try a JPG or PNG.");
    if (blob.size <= MAX_UPLOAD_BYTES) return { blob, ...format };
  }
  throw new Error("That image is too detailed to shrink. Try another one.");
}

/** The current user's avatar file path (from the profile's public URL), if any. */
function currentAvatarPath(userId: string): string | null {
  const url = getAppState().profiles.find((p) => p.id === userId)?.avatarUrl;
  const marker = "/object/public/avatars/";
  return url && url.includes(marker) ? url.slice(url.indexOf(marker) + marker.length) : null;
}

export async function uploadAvatar(file: File): Promise<ActionResult> {
  const userId = getAppState().currentUserId;
  if (!userId) return { ok: false, error: "You need to sign in first." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Choose an image file (JPG, PNG, WebP…)." };
  if (file.size > MAX_AVATAR_INPUT_BYTES) return { ok: false, error: "That image is over 15 MB. Choose a smaller one." };
  let image: Encoded;
  try {
    image = await toAvatarImage(file);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't read that image." };
  }
  const db = getSupabase();
  const previous = currentAvatarPath(userId);
  const path = `${userId}/${crypto.randomUUID()}.${image.ext}`;
  const { error } = await db.storage
    .from("avatars")
    .upload(path, image.blob, { contentType: image.type, cacheControl: "31536000" });
  if (error) return { ok: false, error: "Couldn't upload the picture. Please try again." };
  const r = await actions.setAvatarPath(path);
  if (!r.ok) {
    await db.storage.from("avatars").remove([path]);
    return r;
  }
  if (previous) await db.storage.from("avatars").remove([previous]);
  return { ok: true, value: undefined };
}

export async function removeAvatar(): Promise<ActionResult> {
  const userId = getAppState().currentUserId;
  if (!userId) return { ok: false, error: "You need to sign in first." };
  const previous = currentAvatarPath(userId);
  const r = await actions.setAvatarPath(null);
  if (r.ok && previous) await getSupabase().storage.from("avatars").remove([previous]);
  return r;
}
