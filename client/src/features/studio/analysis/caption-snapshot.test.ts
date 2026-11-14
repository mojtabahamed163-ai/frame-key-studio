import { describe, expect, it } from "vitest";
import { sameCaptionSnapshot } from "./caption-snapshot";
import type { CaptionCue } from "../types";

const cue = (overrides: Partial<CaptionCue> = {}): CaptionCue => ({
  id: "cue-1",
  start: 1,
  end: 2,
  text: "A source line",
  words: [{ id: "word-1", text: "A", start: 1, end: 1.2 }],
  ...overrides,
});

describe("sameCaptionSnapshot", () => {
  it("accepts the exact source snapshot", () => {
    expect(sameCaptionSnapshot([cue()], [cue()])).toBe(true);
  });

  it("rejects a late result after cue timing changes", () => {
    expect(sameCaptionSnapshot([cue({ end: 2.4 })], [cue()])).toBe(false);
  });

  it("rejects a late result after word boundaries change", () => {
    expect(
      sameCaptionSnapshot(
        [cue({ words: [{ id: "word-1", text: "A", start: 1.1, end: 1.3 }] })],
        [cue()],
      ),
    ).toBe(false);
  });

  it("accepts small floating-point noise from media timing", () => {
    expect(
      sameCaptionSnapshot(
        [cue({ start: 1.0005, end: 2.0005 })],
        [cue()],
      ),
    ).toBe(true);
  });
});
