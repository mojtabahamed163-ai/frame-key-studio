import type { CaptionCue } from "../types";

export function applyCaptionCuePatch(
  cue: CaptionCue,
  patch: Partial<Pick<CaptionCue, "text" | "start" | "end">>,
  clipStart: number,
  clipEnd: number,
): CaptionCue {
  const next = { ...cue, ...patch };
  const timingChanged = patch.start !== undefined || patch.end !== undefined;

  if (timingChanged) {
    next.start = Math.max(clipStart, Math.min(next.start, clipEnd - 0.05));
    next.end = Math.max(next.start + 0.05, Math.min(next.end, clipEnd));
  }

  if (patch.text !== undefined) {
    next.words = [];
  } else if (timingChanged) {
    const delta = patch.start !== undefined ? next.start - cue.start : next.end - cue.end;
    next.words = cue.words.flatMap((word) => {
      const start = Math.max(next.start, word.start + delta);
      const end = Math.min(next.end, word.end + delta);
      return end - start >= 0.04 ? [{ ...word, start, end }] : [];
    });
  }

  return next;
}
