import { describe, expect, it } from "vitest";
import {
  alignAudioSampleToTimeline,
  classifyChunkWord,
  copyAudioWindowForTail,
  fitWordToAudioWindow,
  hasSustainedAudioActivityAfterLastWord,
  inferMissingWordEnds,
  isDuplicateOverlapWord,
  resampleAudioForWhisper,
  TRANSCRIPTION_CHUNK_SECONDS,
  TRANSCRIPTION_OVERLAP_SECONDS,
  timestampWindowWarningCodes,
  wordBelongsToChunkWindow,
} from "./analyze-video";
import type { TranscriptWord } from "../types";

const word = (text: string, start: number, end: number): TranscriptWord => ({ id: `${text}-${start}`, text, start, end });

describe("local Whisper audio-window boundaries", () => {
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

  it("preserves speech-band audio while suppressing frequencies that would alias below 8 kHz", () => {
    const makeTone = (frequency: number) => Float32Array.from({ length: 48_000 }, (_, index) => 0.2 * Math.sin(2 * Math.PI * frequency * index / 48_000));
    const rms = (samples: Float32Array) => Math.sqrt(samples.reduce((total, sample) => total + sample * sample, 0) / samples.length);
    const speechBand = resampleAudioForWhisper(makeTone(1_000), 48_000);
    const aboveNyquist = resampleAudioForWhisper(makeTone(12_000), 48_000);

    expect(speechBand).toHaveLength(16_000);
    expect(rms(speechBand)).toBeGreaterThan(0.12);
    expect(rms(aboveNyquist)).toBeLessThan(0.005);
  });

  it("bounds an inferred word end before a later out-of-window word", () => {
    const inferred = inferMissingWordEnds([
      { text: "valid", start: 8.4, end: null },
      { text: "hallucinated", start: 9.5, end: 9.8 },
    ], 9.2);
    expect(inferred.words[0].end).toBe(9.2);
    expect(fitWordToAudioWindow(8.4, inferred.words[0].end!, 8, 9.2)).toEqual({ start: 8.4, end: 9.2 });
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

  it("keeps the 16 kHz tail window alive when the worker receives a transferred buffer", () => {
    const source = new Float32Array(1_400);
    source.fill(0.08, 1_030);
    const tail = copyAudioWindowForTail(source);

    structuredClone(source, { transfer: [source.buffer] });

    expect(source.length).toBe(0);
    expect(tail.length).toBe(1_400);
    expect(hasSustainedAudioActivityAfterLastWord(tail, 1_000, 0, 0.85, 1.4)).toBe(true);
  });

  it("inserts silence for PTS gaps and removes overlapping sample frames", () => {
    const afterGap = alignAudioSampleToTimeline(new Float32Array([1, 2]), 1, 0, 10);
    expect(afterGap.gapFrames).toBe(10);
    expect([...afterGap.samples]).toEqual([1, 2]);

    const afterOverlap = alignAudioSampleToTimeline(new Float32Array([1, 2, 3, 4]), 0.8, 1, 10);
    expect(afterOverlap.gapFrames).toBe(0);
    expect(afterOverlap.droppedOverlapFrames).toBe(2);
    expect([...afterOverlap.samples]).toEqual([3, 4]);
  });

  it("warns about a timestamped word after the audio window even when it has no end", () => {
    expect(timestampWindowWarningCodes(25, null, 0, 24, true)).toEqual([
      "timestamp-outside-audio-window",
      "timestamp-outside-source-tail",
    ]);
    expect(timestampWindowWarningCodes(12, null, 0, 24, false)).toEqual([]);
  });

  it("bounds a missing terminal word end without inventing text or exceeding the audio window", () => {
    const result = inferMissingWordEnds([
      { text: "final", start: 8.4, end: null },
      { text: "phrase", start: 8.9, end: null },
    ], 9.2);
    expect(result.inferred).toBe(true);
    expect(result.words.map(({ text, start, end }) => ({ text, start, end }))).toEqual([
      { text: "final", start: 8.4, end: 8.9 },
      { text: "phrase", start: 8.9, end: 9.2 },
    ]);
  });
});
