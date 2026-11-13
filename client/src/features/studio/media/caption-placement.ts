import type { CaptionPosition } from "../types";

export interface CaptionPlacementInput {
  preferred: CaptionPosition;
  faceCenter?: { x: number; y: number } | null;
  previousPosition?: CaptionPosition;
}

const ORDER: CaptionPosition[] = ["bottom", "top", "middle"];
const ANCHORS: Record<CaptionPosition, number> = {
  top: 0.2,
  middle: 0.5,
  bottom: 0.72,
};

/**
 * Keeps the user's preferred caption zone until a tracked face would be covered.
 * The generous vertical exclusion band accounts for a face plus a little
 * headroom; the fallback order avoids rapid top/bottom oscillation.
 */
export function resolveCaptionPosition({
  preferred,
  faceCenter,
  previousPosition,
}: CaptionPlacementInput): CaptionPosition {
  if (!faceCenter || !Number.isFinite(faceCenter.y)) return preferred;
  const faceY = Math.max(0, Math.min(1, faceCenter.y));
  const isUnsafe = (position: CaptionPosition) =>
    Math.abs(ANCHORS[position] - faceY) < (position === "middle" ? 0.24 : 0.18);
  if (previousPosition && !isUnsafe(previousPosition)) return previousPosition;
  if (!previousPosition && !isUnsafe(preferred)) return preferred;
  const safeAlternatives = ORDER.filter(position => !isUnsafe(position));
  return (
    safeAlternatives.sort(
      (a, b) =>
        Math.abs(ANCHORS[a] - ANCHORS[previousPosition ?? preferred]) -
        Math.abs(ANCHORS[b] - ANCHORS[previousPosition ?? preferred])
    )[0] ?? preferred
  );
}

export function captionAnchor(position: CaptionPosition): number {
  return ANCHORS[position];
}
