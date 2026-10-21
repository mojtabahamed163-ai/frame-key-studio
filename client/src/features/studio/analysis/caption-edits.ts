import type { CaptionCue, TranscriptWord } from "../types";

export function translatedCuesForLanguage(cues: CaptionCue[], targetLanguage: string): CaptionCue[] {
  if (targetLanguage === "none") return [];
  const prefix = `translated-${targetLanguage}-`;
  return cues.filter((cue) => cue.id.startsWith(prefix));
}

export function replaceCueWordsInTranscript(words: TranscriptWord[], previousCue: CaptionCue, nextCue: CaptionCue): TranscriptWord[] {
  if (!previousCue.words.length) return words;
  const replacedIds = new Set(previousCue.words.map((word) => word.id));
  return [...words.filter((word) => !replacedIds.has(word.id)), ...nextCue.words].sort((a, b) => a.start - b.start);
}

export function applyCaptionCuePatch(
  cue: CaptionCue,
  patch: Partial<Pick<CaptionCue, "text" | "start" | "end">>,
  clipStart: number,
  clipEnd: number,
): CaptionCue {
  const next = { ...cue, ...patch };
  const timingChanged = patch.start !== undefined || patch.end !== undefined;

  if (timingChanged) {
    // Clamp only the field the user edited. A source cue may cross the active
    // clip boundaries; changing its out-point must not rewrite its in-point.
    if (patch.start !== undefined) {
      next.start = Math.max(clipStart, Math.min(next.start, Math.min(next.end - 0.05, clipEnd - 0.05)));
    }
    if (patch.end !== undefined) {
      next.end = Math.max(next.start + 0.05, Math.min(next.end, clipEnd));
    }
  }

  if (patch.text !== undefined) {
    next.words = [];
  } else if (timingChanged) {
    // Moving the in-point moves the timed words with the cue. Changing only
    // the out-point must preserve their source timestamps and merely clamp
    // words that now fall outside the edited cue.
    const delta = patch.start !== undefined ? next.start - cue.start : 0;
    next.words = cue.words.flatMap((word) => {
      const start = Math.max(next.start, word.start + delta);
      const end = Math.min(next.end, word.end + delta);
      return end - start >= 0.04 ? [{ ...word, start, end }] : [];
    });
  }

  return next;
}
