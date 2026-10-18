// Pure helpers for turning a drag on the displayed image into a box in the image's own pixels.

export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/** Scale factors from displayed (CSS) pixels to the image's natural pixels. */
export function scaleFactors(natural, displayed) {
  return { sx: natural.width / displayed.width, sy: natural.height / displayed.height };
}

/** Build a box from two drag points (any corner order), clamped to the displayed image. */
export function boxFromDrag(a, b, displayed) {
  const x1 = clamp(Math.min(a.x, b.x), 0, displayed.width);
  const x2 = clamp(Math.max(a.x, b.x), 0, displayed.width);
  const y1 = clamp(Math.min(a.y, b.y), 0, displayed.height);
  const y2 = clamp(Math.max(a.y, b.y), 0, displayed.height);
  return { x1, y1, x2, y2 };
}

/** Convert a displayed-pixel box to natural image pixels: [xmin, ymin, xmax, ymax]. */
export function toImageBox(box, natural, displayed) {
  const { sx, sy } = scaleFactors(natural, displayed);
  const r = (n) => Math.round(n * 10) / 10;
  return [r(box.x1 * sx), r(box.y1 * sy), r(box.x2 * sx), r(box.y2 * sy)];
}

/** A box is only measurable if it has real width and height. */
export const isMeasurable = (box, minPx = 3) =>
  !!box && box.x2 - box.x1 >= minPx && box.y2 - box.y1 >= minPx;
