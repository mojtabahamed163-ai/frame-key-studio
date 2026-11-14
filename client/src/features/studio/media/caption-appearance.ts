import type { StudioSettings } from "../types";

export const ACTIVE_CAPTION_COLOR_PRESETS = [
  { label: "Green", value: "#39D353" },
  { label: "Yellow", value: "#FFD166" },
  { label: "Cyan", value: "#48CAE4" },
  { label: "Coral", value: "#FF6B6B" },
  { label: "White", value: "#FFFFFF" },
] as const;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function safeCaptionColor(
  value: string | undefined,
  fallback: string
): string {
  return value && HEX_COLOR.test(value) ? value : fallback;
}

export function clampCaptionStrokeWidth(value: number | undefined): number {
  if (!Number.isFinite(value)) return 3;
  return Math.max(0, Math.min(10, Number(value)));
}

export function captionStrokePixels(
  settings: Pick<StudioSettings, "captionStrokeWidth">,
  height: number
): number {
  return (
    clampCaptionStrokeWidth(settings.captionStrokeWidth) *
    Math.max(0.75, height / 720)
  );
}
