import { describe, expect, it } from "vitest";
import { combineCaptionTracks } from "./caption-tracks";
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

  it("shows only the available source line when a translation is missing", () => {
    const source = [cue("source-a", "Source only", 1, 2)];

    expect(combineCaptionTracks(source, []).map(item => item.text)).toEqual([
      "Source only",
    ]);
  });
});
