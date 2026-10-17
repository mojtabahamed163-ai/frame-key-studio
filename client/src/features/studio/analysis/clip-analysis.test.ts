import { describe, expect, it } from "vitest";
import { buildCaptionCues, buildClipSpeechRanges, mapCaptionCuesToOutput, mapSourceTimeToOutput, sentenceGroups, speechKeepRanges, suggestClips, toSrt, toVtt } from "./clip-analysis";
import type { TranscriptWord } from "../types";

function wordsFrom(texts: string[], offset = 0): TranscriptWord[] {
  return texts.map((text, index) => ({ id: `${offset + index}`, text, start: offset + index * 0.55, end: offset + index * 0.55 + 0.38 }));
}

describe("local transcript analysis", () => {
  it("groups punctuation into complete source sentences", () => {
    const words = wordsFrom(["The", "first", "number", "is", "twenty.", "A", "second", "point", "matters!"]);
    const sentences = sentenceGroups(words);
    expect(sentences).toHaveLength(2);
    expect(sentences[0].text).toBe("The first number is twenty.");
    expect(sentences[1].text).toBe("A second point matters!");
  });

  it("only proposes text that appears in the transcript", () => {
    const source = wordsFrom("The housing market changed this year and buyers should compare the actual cost before choosing a property because the details can change the full monthly payment.".split(" "));
    const suggestions = suggestClips(source);
    expect(suggestions.length).toBeGreaterThan(0);
    const original = source.map((word) => word.text.toLowerCase().replace(/[.,!?]/g, ""));
    for (const suggestion of suggestions) {
      for (const token of suggestion.transcript.toLowerCase().split(/\s+/)) {
        const normalized = token.replace(/[“”".,!?]/g, "");
        expect(original).toContain(normalized);
      }
    }
  });

  it("does not offer a cut that starts at an incomplete sentence before a long pause", () => {
    const unfinished = wordsFrom(["A", "thought", "that", "continues"], 0);
    const complete = wordsFrom(["The", "complete", "sentence", "explains", "the", "housing", "market", "for", "new", "buyers", "this", "year", "before", "they", "compare", "total", "monthly", "costs."], 4);
    const suggestions = suggestClips([...unfinished, ...complete]);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((clip) => clip.start >= complete[0].start)).toBe(true);
  });

  it("rejects a repetitive transcript instead of presenting it as a usable clip", () => {
    const repeated = Array.from({ length: 34 }, (_, index) => ["not", "that", "is", "the", "same", "point"][index % 6]);
    repeated[repeated.length - 1] = "point.";
    expect(suggestClips(wordsFrom(repeated))).toHaveLength(0);
  });

  it("rejects a sentence that overlaps the previous sentence and starts mid-thought", () => {
    const words = [
      { id: "previous", text: "The previous thought ends.", start: 0, end: 1 },
      ...wordsFrom(["This", "new", "thought", "should", "not", "start", "inside", "the", "previous", "one", "because", "it", "is", "incomplete."], 0.55),
    ];
    expect(suggestClips(words)).toHaveLength(0);
  });

  it("does not rank a long lowercase continuation as a clean clip opening", () => {
    const words = wordsFrom(["why", "doing", "it", "was", "to", "move", "through", "the", "home.", "The", "complete", "point", "helps", "new", "buyers", "compare", "costs."]);
    expect(suggestClips(words).every((clip) => !clip.transcript.startsWith("why doing"))).toBe(true);
  });
  it("does not claim a later topic word is a hook at the opening", () => {
    const opening = wordsFrom("People often make decisions slowly when they are unsure about the available choices and the details involved.".split(" "));
    const later = wordsFrom("Market prices and property values can change the final cost for buyers.".split(" "), 20);
    const candidate = suggestClips([...opening, ...later], 10).find((clip) => clip.start === opening[0].start);
    expect(candidate).toBeDefined();
    expect(candidate?.reasons).not.toContain("Opens with a specific topic or useful claim");
  });
  it("marks short fallback suggestions for review rather than calling them reliable", () => {
    const words = wordsFrom("Why did 12 buyers change their decision after the home inspection when the roof needed repair?".split(" "));
    const candidate = suggestClips(words, 3).find((clip) => clip.start === words[0].start);
    expect(candidate?.quality).toBe("review");
    expect(candidate?.qualityWarning).toContain("shorter than the preferred 15-second range");
  });
  it("flags suggestions that end near the source tail for possible untranscribed speech", () => {
    const words = wordsFrom(Array.from({ length: 36 }, (_, index) => index === 0 ? "An" : index === 35 ? "point." : `detail${index}`), 10.4);
    const candidate = suggestClips(words, 3, 30.75).find((clip) => clip.start === words[0].start);
    expect(candidate?.quality).toBe("review");
    expect(candidate?.qualityWarning).toContain("speech omitted by transcription");
  });
  it("rejects a one-sentence speaker introduction as an automatic clip", () => {
    const words = wordsFrom("And I'm here on behalf of the Hubble Space Telescope outreach team at NASA's Goddard Space Flight Center.".split(" "));
    expect(suggestClips(words, 3)).toEqual([]);
  });
  it("builds distinct title options from transcript sentences and deprioritizes an introduction", () => {
    const text = "I'm here to introduce this topic. Buyers should ask about the roof age before they make an offer. Compare repair estimates with the local budget and inspect recent permits. This can change the final cost for buyers in that neighbourhood.";
    const candidate = suggestClips(wordsFrom(text.split(" ")), 3)[0];
    expect(candidate).toBeDefined();
    expect(candidate?.titleOptions[0]).toContain("Buyers should ask about the roof age");
    expect(candidate?.titleOptions[1]).toContain("Compare repair estimates with the local budget");
    expect(candidate?.titleOptions[2]).toContain("This can change the final cost for buyers");
  });
  it("accepts a valid clip longer than 45 seconds and never returns a clip over 60 seconds", () => {
    const words = Array.from({ length: 100 }, (_, index) => ({
      id: String(index), text: index === 0 ? "Buyers" : `detail${index}${index === 99 ? "." : ""}`,
      start: index * 0.55, end: index * 0.55 + 0.38,
    }));
    const suggestions = suggestClips(words, 10);
    expect(suggestions.some((clip) => clip.end - clip.start > 45 && clip.end - clip.start <= 60)).toBe(true);
    expect(suggestions.every((clip) => clip.end - clip.start <= 60)).toBe(true);
  });
  it("returns no suggestions when the requested clip count is zero", () => {
    const words = wordsFrom("The housing market changed this year and buyers should compare the actual cost before choosing a property because the details can change the full monthly payment.".split(" "));
    expect(suggestClips(words, 0)).toEqual([]);
  });

  it("does not produce clips from words well beyond the source duration", () => {
    const withinSource = wordsFrom(["The", "housing", "market", "changed", "this", "year", "and", "buyers", "should", "compare", "the", "full", "monthly", "cost", "before", "choosing", "a", "property", "because", "repairs", "change", "the", "final", "payment."]);
    const beyondSource = wordsFrom(["This", "hallucinated", "ending", "must", "not", "extend", "the", "clip", "past", "the", "actual", "video", "duration", "by", "several", "seconds."], 30);
    const suggestions = suggestClips([...withinSource, ...beyondSource], 3, 16);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((clip) => clip.start >= 0 && clip.end <= 16)).toBe(true);
  });

  it("does not recommend the same transcript twice at separated timestamps", () => {
    const sentence = "The housing market changed this year and buyers should compare the full monthly cost before choosing a property because repairs can change the final payment.".split(" ");
    const suggestions = suggestClips([...wordsFrom(sentence, 0), ...wordsFrom(sentence, 30)], 3);
    expect(suggestions).toHaveLength(1);
  });

  it("ties up to three opening choices to safe sentence start times", () => {
    const texts = [
      ["Why", "buyers", "should", "always", "compare", "the", "total", "monthly", "payment", "before", "choosing", "a", "specific", "home", "in", "today's", "market?"],
      ["The", "first", "number", "is", "not", "the", "whole", "story", "because", "taxes", "and", "closing", "fees", "can", "change", "your", "budget."],
      ["Ask", "what", "the", "fees", "include", "before", "you", "make", "a", "written", "offer", "on", "a", "property", "this", "year."],
    ];
    const words = texts.flatMap((sentence, index) => wordsFrom(sentence, index * 9.5));
    const suggestions = suggestClips(words, 10);
    const candidate = suggestions.find((clip) => clip.start === words[0].start && clip.hookOptions.length === 3);
    expect(candidate).toBeDefined();
    expect(candidate?.hookStartOptions).toHaveLength(3);
    expect(candidate?.hookStartOptions?.[0]).toBe(candidate?.start);
  });

  it("builds timed caption cues and valid SRT/VTT output", () => {
    const words = wordsFrom(["A", "clear", "opening", "line", "helps.", "Review", "every", "caption."]);
    const cues = buildCaptionCues(words, 4, 3);
    expect(cues.length).toBeGreaterThan(1);
    expect(toSrt(cues)).toContain("00:00:00,000 -->");
    expect(toVtt(cues)).toContain("WEBVTT\n\n");
  });

  it("maps speech ranges to a compressed output timeline and leaves gaps unmapped", () => {
    const ranges = [{ start: 2, end: 5 }, { start: 8, end: 10 }];
    expect(mapSourceTimeToOutput(3, ranges)).toBe(1);
    expect(mapSourceTimeToOutput(6, ranges)).toBeNull();
    expect(mapSourceTimeToOutput(9, ranges)).toBe(4);
  });
  it("does not map an internal range end and the next range start to the same output time", () => {
    const ranges = [{ start: 0, end: 2 }, { start: 5, end: 7 }];
    expect(mapSourceTimeToOutput(2, ranges)).toBeNull();
    expect(mapSourceTimeToOutput(5, ranges)).toBe(2);
    expect(mapSourceTimeToOutput(7, ranges)).toBe(4);
  });
  it("compresses external subtitle timestamps with the same speech ranges as the rendered video", () => {
    const cue = { id: "cue", start: 10.5, end: 15.5, text: "A line across a removed pause.", words: [] };
    const mapped = mapCaptionCuesToOutput([cue], 10, 16, [{ start: 0, end: 1.5 }, { start: 4, end: 6 }]);
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({ start: 0.5, end: 3, text: cue.text });
  });
  it("aligns captions after a removed pause to the same 30fps export timeline", () => {
    const cue = { id: "cue", start: 3.8, end: 4.4, text: "Second retained line.", words: [] };
    const mapped = mapCaptionCuesToOutput([cue], 0, 6, [{ start: 1.38, end: 2.22 }, { start: 3.68, end: 4.52 }], 30);
    expect(mapped).toHaveLength(1);
    expect(mapped[0].start).toBeCloseTo(26 / 30 + 0.12, 6);
    expect(mapped[0].end).toBeCloseTo(26 / 30 + 0.72, 6);
  });
  it("maps a word at source 10.5–10.8 to output 0.5–0.8 and keeps it active at 0.6", () => {
    const cue = {
      id: "cue-word",
      start: 10.5,
      end: 10.8,
      text: "timed word",
      words: [{ id: "word", text: "timed", start: 10.5, end: 10.8 }],
    };
    const mapped = mapCaptionCuesToOutput([cue], 10, 16, [{ start: 0, end: 1.5 }, { start: 4, end: 6 }]);
    expect(mapped[0].words[0].start).toBeCloseTo(0.5);
    expect(mapped[0].words[0].end).toBeCloseTo(0.8);
    expect(0.6 >= mapped[0].words[0].start && 0.6 <= mapped[0].words[0].end).toBe(true);
  });
  it("omits blank draft caption rows from SRT, VTT, and exported cue timelines", () => {
    const blank = { id: "manual-draft", start: 1, end: 2, text: "   ", words: [] };
    expect(toSrt([blank])).toBe("");
    expect(toVtt([blank])).toBe("WEBVTT\n\n");
    expect(mapCaptionCuesToOutput([blank], 0, 4, [{ start: 0, end: 4 }])).toEqual([]);
  });
  it("preserves a manual clip when transcript speech ranges contain no words", () => {
    const words = wordsFrom(["speech."], 30);
    expect(buildClipSpeechRanges(words, 0, 12, 1.2)).toEqual([{ start: 0, end: 12 }]);
  });

  it("keeps manually corrected caption audio during silence removal", () => {
    const cue = { id: "manual-cue", start: 4, end: 5, text: "Corrected words from the recording.", words: [] };
    expect(buildClipSpeechRanges([], 0, 10, 1.2, [cue])).toEqual([{ start: 3.88, end: 5.12 }]);
  });

  it("preserves small natural boundaries and removes only long pauses", () => {
    const words = [
      { id: "a", text: "Hello.", start: 1, end: 1.5 },
      { id: "b", text: "There.", start: 4, end: 4.5 },
    ];
    const ranges = speechKeepRanges(words, 0, 6, 1.2, 0.1);
    expect(ranges).toHaveLength(2);
    expect(ranges[1].start).toBeGreaterThan(ranges[0].end);
    expect(ranges[0].start).toBe(0);
    expect(ranges[ranges.length - 1].end).toBeLessThan(6);
  });
});
