import { describe, expect, it } from "vitest";
import { applyCaptionCuePatch, replaceCueWordsInTranscript, translatedCuesForLanguage } from "./caption-edits";
import { buildClipSpeechRanges } from "./clip-analysis";
import type { CaptionCue } from "../types";

const cue: CaptionCue = {
  id: "cue-1",
  start: 4,
  end: 6,
  text: "A source caption",
  words: [
    { id: "w1", text: "A", start: 4.1, end: 4.5 },
    { id: "w2", text: "source", start: 5, end: 5.5 },
  ],
};

describe("caption cue editing", () => {
  it("changes only text when the cue crosses the active clip boundaries", () => {
    const crossingCue = { ...cue, start: 2, end: 8 };
    const updated = applyCaptionCuePatch(crossingCue, { text: "Corrected words" }, 3, 7);
    expect(updated).toMatchObject({ start: 2, end: 8, text: "Corrected words" });
    expect(updated.words).toEqual([]);
  });

  it("keeps word timing valid when a cue start is moved forward", () => {
    const updated = applyCaptionCuePatch(cue, { start: 5.45 }, 3, 7);
    expect(updated.start).toBe(5.45);
    expect(updated.words.every((word) => word.end > word.start)).toBe(true);
    expect(updated.words.every((word) => word.end - word.start >= 0.04)).toBe(true);
  });

  it("does not shift timed words when only the cue end is extended", () => {
    const updated = applyCaptionCuePatch(cue, { end: 7 }, 3, 7);
    expect(updated.start).toBe(4);
    expect(updated.end).toBe(7);
    expect(updated.words).toEqual(cue.words);
  });

  it("does not clamp a source cue start when only its end is edited", () => {
    const crossingCue = { ...cue, start: 2, end: 8 };
    const updated = applyCaptionCuePatch(crossingCue, { end: 7 }, 3, 7);
    expect(updated.start).toBe(2);
    expect(updated.end).toBe(7);
  });

  it("uses the edited word timing for silence removal instead of retaining stale source timing", () => {
    const updated = applyCaptionCuePatch(cue, { start: 5 }, 3, 7);
    const updatedWords = replaceCueWordsInTranscript(cue.words, cue, updated);
    const ranges = buildClipSpeechRanges(updatedWords, 3, 7, 0.1, [updated]);

    expect(ranges[0]?.start).toBeGreaterThanOrEqual(1.9);
    expect(updatedWords.map((word) => word.start)).toEqual([5.1]);
  });

  it("does not add a moved text-only source cue as a second speech range after text editing", () => {
    const textEdited = applyCaptionCuePatch(cue, { text: "Corrected source line." }, 3, 7);
    const moved = applyCaptionCuePatch(textEdited, { start: 5 }, 3, 7);

    expect(moved.words).toEqual([]);
    expect(buildClipSpeechRanges(cue.words, 3, 7, 0.1, [moved])).toEqual(buildClipSpeechRanges(cue.words, 3, 7, 0.1));
  });

  it("replaces only the transcript words owned by the edited cue", () => {
    const unrelated = { id: "w3", text: "elsewhere", start: 6.5, end: 6.8 };
    const updated = applyCaptionCuePatch(cue, { start: 5 }, 3, 7);
    const words = replaceCueWordsInTranscript([...cue.words, unrelated], cue, updated);

    expect(words).toEqual([...updated.words, unrelated].sort((a, b) => a.start - b.start));
  });

  it("returns only translated cues for the selected target language", () => {
    const french = { ...cue, id: "translated-fr-cue-1", text: "Bonjour" };
    const german = { ...cue, id: "translated-de-cue-1", text: "Guten Tag" };
    expect(translatedCuesForLanguage([french, german], "de")).toEqual([german]);
    expect(translatedCuesForLanguage([french, german], "none")).toEqual([]);
  });
});
