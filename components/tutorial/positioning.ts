export interface TourRect {
  left: number;
  top: number;
  width: number;
  height: number;
}
export interface TourViewport {
  width: number;
  height: number;
}
export interface TourCardSize {
  width: number;
  height: number;
}
export type TourSide = "left" | "right" | "top" | "bottom";

const margin = 16;
const gap = 20;
const safeTop = 72; // Keep the persistent Skip tutorial button clear.
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, Math.max(min, max)));

/** Keep the actual target visible while placing the explanation in free viewport space. */
export function positionTourCard(
  target: TourRect | null,
  viewport: TourViewport,
  card: TourCardSize,
): TourRect & { side: TourSide } {
  const width = Math.min(card.width, viewport.width - margin * 2);
  const height = Math.min(card.height, viewport.height - safeTop - margin);
  const bottom = viewport.height - height - margin;
  if (!target || viewport.width <= 700)
    return { left: (viewport.width - width) / 2, top: bottom, width, height, side: "bottom" };

  const right = target.left + target.width;
  const targetBottom = target.top + target.height;
  const centerX = target.left + target.width / 2;
  const centerY = target.top + target.height / 2;
  const candidates = {
    right: {
      left: right + gap,
      top: clamp(centerY - height / 2, safeTop, bottom),
      width,
      height,
      side: "right" as const,
    },
    left: {
      left: target.left - width - gap,
      top: clamp(centerY - height / 2, safeTop, bottom),
      width,
      height,
      side: "left" as const,
    },
    bottom: {
      left: clamp(centerX - width / 2, margin, viewport.width - width - margin),
      top: targetBottom + gap,
      width,
      height,
      side: "bottom" as const,
    },
    top: {
      left: clamp(centerX - width / 2, margin, viewport.width - width - margin),
      top: target.top - height - gap,
      width,
      height,
      side: "top" as const,
    },
  };
  const order: TourSide[] =
    target.width > viewport.width / 2
      ? ["bottom", "top", "right", "left"]
      : ["right", "left", "bottom", "top"];
  for (const side of order) {
    const candidate = candidates[side];
    if (
      candidate.left >= margin &&
      candidate.top >= safeTop &&
      candidate.left + width <= viewport.width - margin &&
      candidate.top + height <= viewport.height - margin
    )
      return candidate;
  }
  return { left: viewport.width - width - margin, top: bottom, width, height, side: "bottom" };
}

/** Clip the spotlight to the screen, including when a target is taller than the viewport. */
export function spotlightRect(rect: TourRect, viewport: TourViewport): TourRect {
  const left = clamp(rect.left - 7, 4, viewport.width - 4);
  const top = clamp(rect.top - 7, 4, viewport.height - 4);
  const right = clamp(rect.left + rect.width + 7, left, viewport.width - 4);
  const bottom = clamp(rect.top + rect.height + 7, top, viewport.height - 4);
  return { left, top, width: right - left, height: bottom - top };
}
