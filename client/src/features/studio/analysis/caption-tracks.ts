import type { CaptionCue } from "../types";

/** Combine source and translated captions without changing their timing. */
export function combineCaptionTracks(
  source: CaptionCue[],
  translated: CaptionCue[]
): CaptionCue[] {
  return source.map(sourceCue => {
    const translatedCue = translated.find(cue =>
      cue.id.endsWith(`-${sourceCue.id}`)
    );
    const text = [sourceCue.text.trim(), translatedCue?.text.trim()].filter(
      Boolean
    );
    return {
      ...sourceCue,
      id: `dual-${sourceCue.id}`,
      text: text.join("\n"),
      words: [],
    };
  });
}
