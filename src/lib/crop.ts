/**
 * Square-crop geometry for the profile picture editor. The image is shown in a
 * square viewport of `view` px, scaled so it always covers the viewport; the
 * user pans (drag) and zooms. `pos` is the image's top-left corner relative to
 * the viewport (always ≤ 0, so no empty space shows).
 */

export interface CropState {
  zoom: number; // 1 = image just covers the viewport
  x: number;
  y: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

/** On-screen scale (screen px per image px) at a zoom level. */
export function scaleFor(imgW: number, imgH: number, view: number, zoom: number): number {
  return (view / Math.min(imgW, imgH)) * zoom;
}

/** Keep the image covering the viewport. */
export function clampPosition(imgW: number, imgH: number, view: number, s: CropState): CropState {
  const scale = scaleFor(imgW, imgH, view, s.zoom);
  const minX = view - imgW * scale;
  const minY = view - imgH * scale;
  return { zoom: s.zoom, x: Math.min(0, Math.max(minX, s.x)), y: Math.min(0, Math.max(minY, s.y)) };
}

/** Initial state: no zoom, image centred. */
export function initialCrop(imgW: number, imgH: number, view: number): CropState {
  const scale = scaleFor(imgW, imgH, view, 1);
  return { zoom: 1, x: (view - imgW * scale) / 2, y: (view - imgH * scale) / 2 };
}

/** Change zoom while keeping the point at the viewport centre fixed. */
export function zoomTo(imgW: number, imgH: number, view: number, s: CropState, zoom: number): CropState {
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  const before = scaleFor(imgW, imgH, view, s.zoom);
  const after = scaleFor(imgW, imgH, view, z);
  const cx = (view / 2 - s.x) / before;
  const cy = (view / 2 - s.y) / before;
  return clampPosition(imgW, imgH, view, { zoom: z, x: view / 2 - cx * after, y: view / 2 - cy * after });
}

/** The selected square in the original image's pixels (whole pixels). */
export function cropRect(imgW: number, imgH: number, view: number, s: CropState): { sx: number; sy: number; side: number } {
  const scale = scaleFor(imgW, imgH, view, s.zoom);
  const side = Math.round(Math.min(view / scale, imgW, imgH));
  return {
    sx: Math.round(Math.max(0, Math.min(imgW - side, -s.x / scale))),
    sy: Math.round(Math.max(0, Math.min(imgH - side, -s.y / scale))),
    side,
  };
}
