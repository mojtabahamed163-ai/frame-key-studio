import { describe, expect, it } from "vitest";
import {
  combineCaptionTracks,
  selectCaptionCuesForMode,
} from "./caption-tracks";
import type { CaptionCue } from "../types";

const cue = (id: string, text: string, start: number, end: number): CaptionCue => ({
  id,
  text,
  start,
  end,
  words: [{ id: `word-${id}`, text, start, end }],
});

describe("caption track composition", () => {
  it("places the exact translation beneath its source and preserves timing", () => {
    const source = [cue("source-a", "Hello there.", 1, 2)];
    const translated = [cue("translated-ar-source-a", "مرحبًا بك.", 1, 2)];

    expect(combineCaptionTracks(source, translated)).toEqual([
      {
        ...source[0],
        id: "dual-source-a",
        text: "Hello there.\nمرحبًا بك.",
        words: [],
      },
    ]);
  });

  it("matches by source cue identity instead of array position", () => {
    const source = [
      cue("source-a", "First", 1, 2),
      cue("source-b", "Second", 3, 4),
    ];
    const translated = [
      cue("translated-ar-source-b", "الثاني", 3, 4),
      cue("translated-ar-source-a", "الأول", 1, 2),
    ];

    expect(combineCaptionTracks(source, translated).map(item => item.text)).toEqual([
      "First\nالأول",
      "Second\nالثاني",
    ]);
  });

  it("does not match a source cue by a suffix of another cue identity", () => {
    const source = [cue("b", "Short id", 1, 2), cue("cue-b", "Full id", 3, 4)];
    const translated = [cue("translated-ar-cue-b", "المعرف الكامل", 3, 4)];

    expect(combineCaptionTracks(source, translated).map(item => item.text)).toEqual([
      "Short id",
      "Full id\nالمعرف الكامل",
    ]);
  });

  it("shows only the available source line when a translation is missing", () => {
    const source = [cue("source-a", "Source only", 1, 2)];

    expect(combineCaptionTracks(source, []).map(item => item.text)).toEqual([
      "Source only",
    ]);
  });

  it("switches among all display modes without modifying either saved track", () => {
    const source = [cue("source-a", "Hello", 1, 2)];
    const translated = [cue("translated-fr-source-a", "Bonjour", 1, 2)];

    expect(selectCaptionCuesForMode(source, translated, "transcribe-only")).toBe(
      source
    );
    expect(selectCaptionCuesForMode(source, translated, "translate-only")).toBe(
      translated
    );
    expect(
      selectCaptionCuesForMode(source, translated, "transcribe-and-translate")[0]
        .text
    ).toBe("Hello\nBonjour");
    expect(source[0].text).toBe("Hello");
    expect(translated[0].text).toBe("Bonjour");
  });

  it("shows no source text in translation-only mode before a translation is ready", () => {
    const source = [cue("source-a", "Hello", 1, 2)];
    expect(selectCaptionCuesForMode(source, [], "translate-only")).toEqual([]);
  });
});
