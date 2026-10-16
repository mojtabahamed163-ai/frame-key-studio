import { describe, expect, it } from "vitest";
import {
  classifyChunkWord,
  expandLongTimestampedChunk,
  clampMultiwordChunkToWindow,
  fitSourceTailWord,
  fitWordToAudioWindow,
  hasSustainedAudioActivityAfterLastWord,
  isDuplicateOverlapWord,
  TRANSCRIPTION_CHUNK_SECONDS,
  TRANSCRIPTION_OVERLAP_SECONDS,
  wordBelongsToChunkWindow,
} from "./analyze-video";
import type { TranscriptWord } from "../types";

const word = (text: string, start: number, end: number): TranscriptWord => ({ id: `${text}-${start}`, text, start, end });

describe("local Whisper audio-window boundaries", () => {
  it("splits a long multiword Whisper chunk without changing its covered interval", () => {
    const words = expandLongTimestampedChunk({ text: "The final phrase is spoken at the end of this recording", start: 2.1, end: 5.2, score: 0.8 });
    expect(words).toHaveLength(11);
    expect(words[0]).toMatchObject({ text: "The", start: 2.1, expanded: true });
    expect(words.at(-1)).toMatchObject({ text: "recording", expanded: true });
    expect(words.at(-1)?.end).toBeCloseTo(5.2, 10);
    expect(words.every((item, index) => index === 0 || item.start >= words[index - 1].end)).toBe(true);
  });

  it("does not expand a normal single-word timestamp", () => {
    expect(expandLongTimestampedChunk({ text: "spoken", start: 2, end: 2.4 })).toEqual([{ text: "spoken", start: 2, end: 2.4, expanded: false }]);
  });

  it("clamps an overlapping padded multiword chunk to decoded audio bounds", () => {
    expect(clampMultiwordChunkToWindow({ text: "final phrase", start: 0, end: 30 }, 0, 5.64)).toMatchObject({ start: 0, end: 5.64 });
    expect(clampMultiwordChunkToWindow({ text: "outside", start: 8, end: 30 }, 0, 5.64)).toBeNull();
  });

  it("accepts only a near-tail word whose start is inside the source", () => {
    expect(fitSourceTailWord(5.04, 11.5, 0, 5.641)).toEqual({ start: 5.04, end: 5.641 });
    expect(fitSourceTailWord(2, 11.5, 0, 5.641)).toBeNull();
  });

  it("keeps manual windows shorter than the model's 30-second internal chunk size", () => {
    expect(TRANSCRIPTION_CHUNK_SECONDS).toBe(24);
    expect(TRANSCRIPTION_OVERLAP_SECONDS).toBe(4);
  });

  it("uses the shared overlap only once and assigns new-window words after it", () => {
    expect(wordBelongsToChunkWindow(20.2, 20.5, 20, 1)).toBe(false);
    expect(wordBelongsToChunkWindow(24.1, 24.5, 20, 1)).toBe(true);
    expect(wordBelongsToChunkWindow(0.2, 0.5, 0, 0)).toBe(true);
    expect(wordBelongsToChunkWindow(-1, 0, 0, 0)).toBe(false);
  });

  it("clamps only a small boundary-rounding drift and rejects a hallucinated overrun", () => {
    expect(fitWordToAudioWindow(4.96, 5.25, 5, 10)).toEqual({ start: 5, end: 5.25 });
    expect(fitWordToAudioWindow(9.7, 10.08, 5, 10)).toEqual({ start: 9.7, end: 10 });
    expect(fitWordToAudioWindow(9.7, 10.4, 5, 10)).toBeNull();
    expect(fitWordToAudioWindow(22.002, 23.901, 0, 24)).toBeNull();
    expect(fitWordToAudioWindow(Number.NaN, 9, 5, 10)).toBeNull();
  });

  it("deduplicates the same token at nearly identical overlap timestamps, but not repeated speech later", () => {
    const existing = [word("spoken", 24.12, 24.42)];
    expect(isDuplicateOverlapWord(word("Spoken,", 24.2, 24.48), existing)).toBe(true);
    expect(isDuplicateOverlapWord(word("spoken", 24.7, 25.0), existing)).toBe(false);
    expect(isDuplicateOverlapWord(word("missing", 24.2, 24.48), existing)).toBe(false);
    expect(isDuplicateOverlapWord(word("which", 21.201, 22.002), [word("Which", 21.288, 21.528)])).toBe(true);
  });

  it("keeps the earlier window's word when overlapping recognitions conflict, but recovers words missing from it", () => {
    const existing = [word("Telescope,", 20.2, 20.968), word("which", 21.288, 21.528)];
    expect(classifyChunkWord(word("Facebook,", 20.662, 21.041), existing, 20, 1)).toBe("conflict");
    expect(classifyChunkWord(word("Which", 21.201, 22.002), existing, 20, 1)).toBe("duplicate");
    expect(classifyChunkWord(word("actually", 22.2, 22.55), existing, 20, 1)).toBe("accept");
    expect(classifyChunkWord(word("new", 24.1, 24.4), existing, 20, 1)).toBe("accept");
  });

  it("flags sustained audible tail activity after the final accepted word", () => {
    const samples = new Float32Array(1_400);
    samples.fill(0.08, 1_030);
    expect(hasSustainedAudioActivityAfterLastWord(samples, 1_000, 0, 0.85, 1.4)).toBe(true);
    expect(hasSustainedAudioActivityAfterLastWord(new Float32Array(1_400), 1_000, 0, 0.85, 1.4)).toBe(false);
  });

  it("does not miss a short but real spoken tail after the final word", () => {
    const samples = new Float32Array(5_700);
    samples.fill(0.08, 5_400);
    expect(hasSustainedAudioActivityAfterLastWord(samples, 1_000, 0, 5.1, 5.7)).toBe(true);
  });
});
