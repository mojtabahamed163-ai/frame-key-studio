import { describe, expect, it } from "vitest";
import { buildCaptionCues, mapSourceTimeToOutput, sentenceGroups, speechKeepRanges, suggestClips, toSrt, toVtt } from "./clip-analysis";
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

  it("drops implausibly long word timings before clips, captions, and silence removal", () => {
    const first = wordsFrom("The first complete explanation gives buyers useful context for the changing property market and shows how monthly costs affect a family's long term housing choice today.".split(" "));
    first[first.length - 1].text = "today.";
    const impossible = { id: "bad-span", text: "all.", start: first[first.length - 1].end + 0.12, end: first[first.length - 1].end + 3.62 };
    const second = wordsFrom("Another separate explanation measures taxes insurance utilities maintenance and lender fees before buyers compare the complete monthly payment for a suitable home.".split(" "), 17.5);
    second[second.length - 1].text = "home.";
    const source = [...first, impossible, ...second];

    expect(sentenceGroups(source, 30).flatMap((sentence) => sentence.words).some((word) => word.id === "bad-span")).toBe(false);
    expect(buildCaptionCues(source).flatMap((cue) => cue.words).some((word) => word.id === "bad-span")).toBe(false);
    const suggestions = suggestClips(source, 10, 30);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((clip) => !(clip.transcript.includes("property market") && clip.transcript.includes("Another separate")))).toBe(true);
    const ranges = speechKeepRanges(source, 0, 30, 1.2, 0);
    expect(ranges.some((range) => range.start <= first[0].start && range.end >= second[second.length - 1].end)).toBe(false);
  });

  it("resolves duplicate overlapping word alignments to one short, usable interval", () => {
    const words: TranscriptWord[] = [
      { id: "the", text: "The", start: 1, end: 1.2 },
      { id: "small", text: "small", start: 1.2, end: 1.4 },
      { id: "room-long", text: "room", start: 1.4, end: 2.2 },
      { id: "room-short", text: "room.", start: 1.408, end: 1.648 },
    ];
    const sentences = sentenceGroups(words);
    expect(sentences).toHaveLength(1);
    expect(sentences[0].text).toBe("The small room.");
    expect(sentences[0].words.at(-1)).toMatchObject({ id: "room-short", start: 1.408, end: 1.648 });
    expect(buildCaptionCues(words).flatMap((cue) => cue.words).map((word) => word.id)).toEqual(["the", "small", "room-short"]);
    expect(speechKeepRanges(words, 0, 3, 0.2, 0).at(-1)?.end).toBe(1.648);
  });

  it("marks a viable clip for review when its source interval contains a pathological word span", () => {
    const source = wordsFrom("Why buyers should compare monthly payments before they choose homes because taxes insurance utilities maintenance and closing fees can change the actual budget for families during unexpected rate shifts across the local property market every year and written offers should show each fixed cost before signing any purchase agreement today.".split(" "));
    source[source.length - 1].text = "today.";
    const baseWord = source[20];
    const impossible = { id: "bad-span", text: "today", start: baseWord.start + 0.1, end: baseWord.start + 3.1 };
    const candidate = suggestClips([...source, impossible], 10, 60).find((clip) => clip.start === source[0].start);
    expect(candidate).toBeDefined();
    expect(candidate?.quality).toBe("review");
    expect(candidate?.qualityWarning).toContain("unreliable word timings");
  });

  it("marks adjacent duplicate transcript words for review instead of calling the clip reliable", () => {
    const source = wordsFrom("Why buyers should compare monthly payments before they choose homes because taxes insurance utilities maintenance and closing fees can change the actual budget for families during unexpected rate shifts across the local property market every year and written offers should show each fixed cost before signing any purchase agreement today.".split(" "));
    source[source.length - 1].text = "today.";
    const original = source.find((word) => word.text === "monthly");
    expect(original).toBeDefined();
    const repeated = { ...original!, id: "duplicate-monthly", start: original!.end + 0.03, end: original!.start + 0.54 };
    const candidate = suggestClips([...source, repeated], 10, 60).find((clip) => clip.start === source[0].start);
    expect(candidate).toBeDefined();
    expect(candidate?.quality).toBe("review");
    expect(candidate?.qualityWarning).toContain("repeats an adjacent word");
  });

  it("deprioritizes a long cut that opens on a context-dependent pronoun", () => {
    const words = wordsFrom("He makes it sort of cozier. The first useful explanation gives buyers context about how property taxes insurance monthly costs and yearly repairs change a family's budget before anyone considers the right home in the local market today.".split(" "));
    words[5].text = "cozier.";
    words[words.length - 1].text = "today.";
    const suggestions = suggestClips(words, 10, 60);
    expect(suggestions.some((clip) => clip.transcript.startsWith("He makes it"))).toBe(false);
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

  it("does not invent a completed passage from an unfinished transcript", () => {
    const unfinished = wordsFrom("A useful explanation continues across several important details but never reaches its conclusion".split(" "));
    expect(suggestClips(unfinished, 3, 30)).toEqual([]);
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

  it("keeps every suggestion inside the source duration", () => {
    const valid = wordsFrom("The complete explanation gives viewers useful context and a practical conclusion for making a better decision today.".split(" "), 0);
    const beyondEnd = wordsFrom("Tomorrow's auditor carefully measures annual expenses because hidden utility charges alter a family budget before buyers compare several coastal properties downtown.".split(" "), 20);
    const suggestions = suggestClips([...valid, ...beyondEnd], 10, 25);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((clip) => clip.start >= 0 && clip.end <= 25)).toBe(true);
  });

  it("does not generate negative source timestamps from inaccurate transcript offsets", () => {
    const words = wordsFrom("The complete explanation gives viewers useful context and a practical conclusion for making a better decision today.".split(" "), -4);
    const suggestions = suggestClips(words, 3, 30);
    expect(suggestions.every((clip) => clip.start >= 0 && clip.end <= 30)).toBe(true);
  });

  it("does not bridge a long pause between otherwise useful passages", () => {
    const opening = wordsFrom("Architects sketch narrow courtyards beside cedar trees while morning sunlight enters through tall windows illuminating handmade tiles across quiet kitchens.".split(" "), 0);
    opening[opening.length - 1].text = "kitchens.";
    const later = wordsFrom("Tomorrow's auditor carefully measures annual expenses because hidden utility charges alter family budgets before buyers compare coastal properties downtown.".split(" "), 28);
    const suggestions = suggestClips([...opening, ...later], 10, 60);
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.every((clip) => !(clip.start < opening[opening.length - 1].end && clip.end > later[0].start))).toBe(true);
  });

  it("returns no suggestions when the requested maximum is zero or invalid", () => {
    const words = wordsFrom("The complete explanation gives viewers useful context and a practical conclusion for making a better decision today.".split(" "));
    expect(suggestClips(words, 0)).toEqual([]);
    expect(suggestClips(words, Number.NaN)).toEqual([]);
  });

  it("keeps question setup with its answer when neither side is long enough alone", () => {
    const question = wordsFrom(["Why", "should", "buyers", "compare", "several", "homes", "before", "choosing", "one?"], 0);
    const answer = wordsFrom(["Because", "monthly", "costs", "include", "taxes", "insurance", "fees", "and", "other", "charges", "that", "change", "the", "total."], 5.1);
    const suggestions = suggestClips([...question, ...answer], 10, 30);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((clip) => clip.transcript.startsWith("Why should buyers") && clip.transcript.endsWith("total."))).toBe(true);
  });

  it("ignores empty and unusable timestamps without fabricating a candidate", () => {
    const invalid = [
      { id: "nan", text: "nonsense", start: Number.NaN, end: 1 },
      { id: "negative", text: "nonsense", start: -3, end: -2 },
      { id: "zero", text: "nonsense", start: 1, end: 1 },
      { id: "infinite", text: "nonsense", start: 1, end: Number.POSITIVE_INFINITY },
    ] as TranscriptWord[];
    expect(suggestClips([])).toEqual([]);
    expect(suggestClips(invalid, 3, 20)).toEqual([]);
    const valid = wordsFrom("The complete explanation gives viewers useful context and a practical conclusion for making a better decision today.".split(" "));
    expect(suggestClips(valid, 3, 6)).toEqual([]);
    expect(suggestClips(valid, 3, 0)).toEqual([]);
    expect(suggestClips(valid, 3, Number.NaN)).toEqual([]);
  });

  it("respects the established 8–60 second candidate range and ranks deterministically", () => {
    const words = Array.from({ length: 120 }, (_, index) => ({
      id: `w${index}`,
      text: index % 10 === 0 ? `The${index}` : index % 10 === 9 ? `word${index}.` : `word${index}`,
      start: index * 0.55,
      end: index * 0.55 + 0.38,
    }));
    const suggestions = suggestClips(words, 10, 90);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((clip) => clip.end - clip.start >= 8 && clip.end - clip.start <= 60)).toBe(true);
    expect(suggestClips(words, 10, 90)).toEqual(suggestions);
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
