import type { CaptionCue } from "../types";

const TIME_EPSILON = 0.001;

function sameNumber(left: number, right: number): boolean {
  return Math.abs(left - right) <= TIME_EPSILON;
}

/**
 * Async transcription/translation jobs must only commit against the exact
 * source snapshot they started from. Text and ids alone are insufficient:
 * editing a cue's timing (or its word boundaries) must invalidate a late job.
 */
export function sameCaptionSnapshot(
  current: CaptionCue[],
  expected: CaptionCue[],
): boolean {
  if (current.length !== expected.length) return false;
  return expected.every((cue, index) => {
    const candidate = current[index];
    if (!candidate || candidate.id !== cue.id) return false;
    if (
      candidate.text !== cue.text ||
      !sameNumber(candidate.start, cue.start) ||
      !sameNumber(candidate.end, cue.end) ||
      candidate.words.length !== cue.words.length
    )
      return false;
    return cue.words.every((word, wordIndex) => {
      const currentWord = candidate.words[wordIndex];
      return (
        currentWord?.id === word.id &&
        currentWord.text === word.text &&
        sameNumber(currentWord.start, word.start) &&
        sameNumber(currentWord.end, word.end)
      );
    });
  });
}
