import type { CaptionCue } from "../types";

export type CaptionProcessingMode =
  | "transcribe-only"
  | "translate-only"
  | "transcribe-and-translate";

/** Combine source and translated captions without changing their timing. */
export function combineCaptionTracks(
  source: CaptionCue[],
  translated: CaptionCue[]
): CaptionCue[] {
  const translationsBySourceId = new Map(
    translated.flatMap(cue => {
      const match = /^translated-(?:en|ar|fr|es|de)-(.+)$/.exec(cue.id);
      return match ? [[match[1], cue] as const] : [];
    })
  );
  return source.map(sourceCue => {
    const translatedCue = translationsBySourceId.get(sourceCue.id);
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

/** Select one stable preview/export track without mutating saved analysis. */
export function selectCaptionCuesForMode(
  source: CaptionCue[],
  translated: CaptionCue[],
  mode: CaptionProcessingMode
): CaptionCue[] {
  if (mode === "transcribe-only") return source;
  if (mode === "translate-only") return translated;
  return translated.length ? combineCaptionTracks(source, translated) : source;
}
