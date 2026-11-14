import { describe, expect, it } from "vitest";
import {
  copyEnglishCues,
  mapTranslationResults,
  mergeTranslatedCues,
} from "./translate-cues";
import type { CaptionCue } from "../types";

const cues: CaptionCue[] = [
  {
    id: "cue-a",
    start: 1.25,
    end: 3.5,
    text: "The meeting starts now.",
    words: [{ id: "w-a", text: "The", start: 1.25, end: 1.5 }],
  },
  {
    id: "cue-b",
    start: 4,
    end: 5.75,
    text: "We can help.",
    words: [],
  },
];

describe("translation cue mapping", () => {
  it("uses actual translated strings and keeps source phrase timing", () => {
    const translated = mapTranslationResults(cues, "fr", [
      "La réunion commence maintenant.",
      "Nous pouvons aider.",
    ]);
    expect(translated.map(cue => cue.text)).toEqual([
      "La réunion commence maintenant.",
      "Nous pouvons aider.",
    ]);
    expect(translated.map(({ start, end }) => [start, end])).toEqual([
      [1.25, 3.5],
      [4, 5.75],
    ]);
    expect(translated.map(cue => cue.id)).toEqual([
      "translated-fr-cue-a",
      "translated-fr-cue-b",
    ]);
    expect(translated.every(cue => cue.words.length === 0)).toBe(true);
  });

  it("does not silently replace a missing translation with source text", () => {
    expect(() => mapTranslationResults(cues, "ar", ["ترجمة فعلية", "  "])).toThrow(
      /empty result for caption 2/i
    );
  });

  it("rejects a mismatched number of model outputs", () => {
    expect(() => mapTranslationResults(cues, "de", ["Eine Übersetzung."])).toThrow(
      /returned 1 lines for 2 captions/i
    );
  });

  it("copies English captions without a translation model call or timing change", () => {
    const copied = copyEnglishCues(cues);
    expect(copied.map(cue => cue.text)).toEqual(cues.map(cue => cue.text));
    expect(copied.map(({ start, end }) => [start, end])).toEqual([
      [1.25, 3.5],
      [4, 5.75],
    ]);
    expect(copied.map(cue => cue.id)).toEqual([
      "translated-en-cue-a",
      "translated-en-cue-b",
    ]);
  });

  it("preserves other language tracks when a new language is translated", () => {
    const arabic = mapTranslationResults(cues, "ar", ["نبدأ الاجتماع الآن.", "يمكننا المساعدة."]);
    const french = mapTranslationResults(cues.slice(0, 1), "fr", ["La réunion commence maintenant."]);
    const merged = mergeTranslatedCues(arabic, "ar", french, "fr", ["cue-a"]);
    const byId = Object.fromEntries(merged.map(cue => [cue.id, cue.text]));
    expect(byId).toEqual({
      "translated-fr-cue-a": "La réunion commence maintenant.",
      "translated-ar-cue-a": "نبدأ الاجتماع الآن.",
      "translated-ar-cue-b": "يمكننا المساعدة.",
    });
  });

  it("replaces only the selected source line in the selected language", () => {
    const existing = [
      ...mapTranslationResults(cues, "fr", ["Réunion.", "Aider."]),
      ...mapTranslationResults(cues, "ar", ["اجتماع.", "مساعدة."]),
    ];
    const revised = mapTranslationResults(cues.slice(0, 1), "fr", ["La réunion."]);
    const merged = mergeTranslatedCues(existing, "ar", revised, "fr", ["cue-a"]);
    const byId = Object.fromEntries(merged.map(cue => [cue.id, cue.text]));
    expect(byId).toEqual({
      "translated-fr-cue-a": "La réunion.",
      "translated-fr-cue-b": "Aider.",
      "translated-ar-cue-a": "اجتماع.",
      "translated-ar-cue-b": "مساعدة.",
    });
  });

  it("updates one same-language clip while preserving other translated captions", () => {
    const existing = mapTranslationResults(cues, "de", ["Das Treffen beginnt.", "Wir können helfen."]);
    const updated = mapTranslationResults(cues.slice(0, 1), "de", ["Die Besprechung beginnt jetzt."]);
    const merged = mergeTranslatedCues(existing, "de", updated, "de", ["cue-a"]);
    expect(merged.map(cue => cue.text)).toEqual([
      "Die Besprechung beginnt jetzt.",
      "Wir können helfen.",
    ]);
  });
});
