import { describe, expect, it } from "vitest";
import { applyCaptionCuePatch, translatedCuesForLanguage } from "./caption-edits";
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

  it("returns only translated cues for the selected target language", () => {
    const french = { ...cue, id: "translated-fr-cue-1", text: "Bonjour" };
    const german = { ...cue, id: "translated-de-cue-1", text: "Guten Tag" };
    expect(translatedCuesForLanguage([french, german], "de")).toEqual([german]);
    expect(translatedCuesForLanguage([french, german], "none")).toEqual([]);
  });
});
