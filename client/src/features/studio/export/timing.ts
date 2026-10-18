import { EXPORT_FRAME_RATE } from "../analysis/clip-analysis";
import type { SpeechRange } from "../types";

export function mapSourceTimeToExportOutput(time: number, ranges: SpeechRange[], frameRate = EXPORT_FRAME_RATE): number | null {
  const ordered = [...ranges].filter((range) => range.end > range.start).sort((left, right) => left.start - right.start);
  let outputCursor = 0;
  for (let index = 0; index < ordered.length; index += 1) {
    const range = ordered[index];
    const isLastRange = index === ordered.length - 1;
    if (time >= range.start && (time < range.end || (isLastRange && time <= range.end))) {
      return outputCursor + time - range.start;
    }
    if (time < range.start) return null;
    outputCursor += range.end - range.start;
    if (index < ordered.length - 1 && Number.isFinite(frameRate) && frameRate > 0) {
      outputCursor = Math.ceil(outputCursor * frameRate - 1e-9) / frameRate;
    }
  }
  return null;
}

export function resolveOutputPreviewSourceTime(localTime: number, ranges: SpeechRange[]): number | null {
  const ordered = [...ranges].filter((range) => range.end > range.start).sort((left, right) => left.start - right.start);
  if (mapSourceTimeToExportOutput(localTime, ordered) != null) return localTime;
  const nextRange = ordered.find((range) => range.start > localTime);
  if (nextRange) return nextRange.start;
  const lastRange = ordered[ordered.length - 1];
  return lastRange && localTime > lastRange.end ? lastRange.end : null;
}
