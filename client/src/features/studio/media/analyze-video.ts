import { ALL_FORMATS, AudioSampleSink, BlobSource, Input } from "mediabunny";
import type { TranscriptWord, TranscriptionWarningCode, VideoMetadata } from "../types";

export interface AnalysisProgress {
  stage: "metadata" | "audio" | "model" | "transcribing";
  progress: number;
  detail: string;
}

interface RawWord { text: string; start: number | null; end: number | null; score?: number }
interface WorkerReply {
  jobId: string;
  type: "model-progress" | "progress" | "result" | "error";
  status?: string;
  progress?: number;
  detail?: string;
  text?: string;
  chunks?: RawWord[];
  message?: string;
}

export interface TranscriptionResult {
  words: TranscriptWord[];
  warnings: TranscriptionWarningCode[];
}

export interface FittedWordTime { start: number; end: number }

const TARGET_RATE = 16_000;
const TIMESTAMP_TOLERANCE_SECONDS = 0.18;
const MIN_WORD_DURATION_SECONDS = 0.04;
export const MAX_WORD_DURATION_SECONDS = 1.5;
export const TRANSCRIPTION_CHUNK_SECONDS = 24;
export const TRANSCRIPTION_OVERLAP_SECONDS = 4;

export function wordBelongsToChunkWindow(start: number, end: number, chunkStartSeconds: number, chunkNumber: number): boolean {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return false;
  const ownedFrom = chunkNumber === 0 ? chunkStartSeconds : chunkStartSeconds + TRANSCRIPTION_OVERLAP_SECONDS;
  return (start + end) / 2 >= ownedFrom;
}

export function fitWordToAudioWindow(start: number, end: number, windowStart: number, windowEnd: number): FittedWordTime | null {
  if (![start, end, windowStart, windowEnd].every(Number.isFinite) || end <= start || windowEnd <= windowStart) return null;
  if (end - start > MAX_WORD_DURATION_SECONDS) return null;
  if (start < windowStart - TIMESTAMP_TOLERANCE_SECONDS || end > windowEnd + TIMESTAMP_TOLERANCE_SECONDS) return null;
  if (start >= windowEnd || end <= windowStart) return null;
  const fittedStart = Math.max(windowStart, start);
  const fittedEnd = Math.min(windowEnd, end);
  if (fittedEnd - fittedStart < MIN_WORD_DURATION_SECONDS) return null;
  return { start: fittedStart, end: fittedEnd };
}

function normalizedWord(text: string): string {
  return text.toLocaleLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}']/gu, "");
}

export function isDuplicateOverlapWord(candidate: Pick<TranscriptWord, "text" | "start" | "end">, existing: TranscriptWord[]): boolean {
  const token = normalizedWord(candidate.text);
  if (!token) return false;
  const midpoint = (candidate.start + candidate.end) / 2;
  const candidateDuration = candidate.end - candidate.start;
  return existing.some((word) => {
    if (normalizedWord(word.text) !== token) return false;
    const existingMidpoint = (word.start + word.end) / 2;
    const intersection = Math.min(candidate.end, word.end) - Math.max(candidate.start, word.start);
    const minimumDuration = Math.min(candidateDuration, word.end - word.start);
    return Math.abs(existingMidpoint - midpoint) <= 0.18 || intersection >= minimumDuration * 0.35;
  });
}

function overlapsDifferentWord(candidate: Pick<TranscriptWord, "text" | "start" | "end">, existing: TranscriptWord[]): boolean {
  const token = normalizedWord(candidate.text);
  const candidateDuration = candidate.end - candidate.start;
  return existing.some((word) => {
    if (normalizedWord(word.text) === token) return false;
    const intersection = Math.min(candidate.end, word.end) - Math.max(candidate.start, word.start);
    return intersection >= Math.min(candidateDuration, word.end - word.start) * 0.4;
  });
}

export type ChunkWordDisposition = "accept" | "duplicate" | "conflict";

export function classifyChunkWord(
  candidate: Pick<TranscriptWord, "text" | "start" | "end">,
  existing: TranscriptWord[],
  chunkStartSeconds: number,
  chunkNumber: number,
): ChunkWordDisposition {
  if (chunkNumber === 0) return "accept";
  if (isDuplicateOverlapWord(candidate, existing)) return "duplicate";
  const inLeadingOverlap = !wordBelongsToChunkWindow(candidate.start, candidate.end, chunkStartSeconds, chunkNumber);
  if (inLeadingOverlap && overlapsDifferentWord(candidate, existing)) return "conflict";
  return "accept";
}

export function hasSustainedAudioActivityAfterLastWord(
  samples: Float32Array,
  sampleRate: number,
  windowStart: number,
  lastWordEnd: number,
  sourceEnd: number,
  rmsThreshold = 0.015,
): boolean {
  if (!samples.length || sampleRate <= 0) return false;
  const reviewStart = Math.max(windowStart, lastWordEnd + 0.18);
  const audioEnd = Math.min(sourceEnd, windowStart + samples.length / sampleRate);
  if (audioEnd - reviewStart < 0.3) return false;
  const firstFrame = Math.max(0, Math.floor((reviewStart - windowStart) * sampleRate));
  const lastFrame = Math.min(samples.length, Math.ceil((audioEnd - windowStart) * sampleRate));
  const blockFrames = Math.max(1, Math.floor(sampleRate * 0.1));
  let consecutiveActiveBlocks = 0;
  for (let offset = firstFrame; offset < lastFrame; offset += blockFrames) {
    const stop = Math.min(lastFrame, offset + blockFrames);
    let squareTotal = 0;
    for (let index = offset; index < stop; index += 1) squareTotal += (samples[index] ?? 0) ** 2;
    const rms = Math.sqrt(squareTotal / Math.max(1, stop - offset));
    consecutiveActiveBlocks = rms >= rmsThreshold ? consecutiveActiveBlocks + 1 : 0;
    if (consecutiveActiveBlocks >= 3) return true;
  }
  return false;
}

export async function inspectVideo(file: File): Promise<VideoMetadata> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) throw new Error("No video track was found in this file.");
    const duration = await input.computeDuration();
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("The video duration could not be read.");
    const audioTrack = await input.getPrimaryAudioTrack();
    return {
      duration,
      width: await videoTrack.getDisplayWidth(),
      height: await videoTrack.getDisplayHeight(),
      hasAudio: Boolean(audioTrack),
      videoCodec: (await videoTrack.getCodec()) ?? undefined,
      audioCodec: audioTrack ? (await audioTrack.getCodec()) ?? undefined : undefined,
    };
  } finally {
    input.dispose();
  }
}

function downmixToMono(sample: import("mediabunny").AudioSample): Float32Array {
  const channels = sample.numberOfChannels;
  const frames = sample.numberOfFrames;
  const bytes = sample.allocationSize({ format: "f32", planeIndex: 0 });
  const interleaved = new Float32Array(bytes / Float32Array.BYTES_PER_ELEMENT);
  sample.copyTo(interleaved, { format: "f32", planeIndex: 0 });
  const mono = new Float32Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    let total = 0;
    for (let channel = 0; channel < channels; channel += 1) total += interleaved[frame * channels + channel] ?? 0;
    mono[frame] = total / Math.max(1, channels);
  }
  return mono;
}

function concatenate(chunks: Float32Array[], totalLength: number): Float32Array {
  const result = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function resampleLinear(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === TARGET_RATE) return input;
  const outputLength = Math.max(1, Math.floor(input.length * TARGET_RATE / inputRate));
  const output = new Float32Array(outputLength);
  const ratio = inputRate / TARGET_RATE;
  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const left = Math.floor(sourceIndex);
    const fraction = sourceIndex - left;
    const a = input[Math.min(left, input.length - 1)] ?? 0;
    const b = input[Math.min(left + 1, input.length - 1)] ?? a;
    output[index] = a + (b - a) * fraction;
  }
  return output;
}

function createWorker(): Worker {
  return new Worker(new URL("../workers/transcribe.worker.ts", import.meta.url), { type: "module", name: "framekey-local-whisper" });
}

function recognize(worker: Worker, audio: Float32Array, offsetSeconds: number, language: string, signal: AbortSignal, onProgress: (progress: AnalysisProgress) => void): Promise<RawWord[]> {
  const jobId = `asr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      worker.removeEventListener("message", handleMessage);
      signal.removeEventListener("abort", handleAbort);
    };
    const handleAbort = () => { cleanup(); reject(new DOMException("Analysis cancelled.", "AbortError")); };
    const handleMessage = (event: MessageEvent<WorkerReply>) => {
      const data = event.data;
      if (data.jobId !== jobId) return;
      if (data.type === "model-progress") {
        onProgress({ stage: "model", progress: Math.max(0, Math.min(1, data.progress ?? 0)), detail: data.status ?? "Downloading the local model" });
      } else if (data.type === "progress") {
        onProgress({ stage: "transcribing", progress: 0, detail: data.detail ?? `Transcribing a ${TRANSCRIPTION_CHUNK_SECONDS}-second audio window` });
      } else if (data.type === "error") {
        cleanup();
        reject(new Error(data.message ?? "The local speech model could not run."));
      } else if (data.type === "result") {
        cleanup();
        resolve(data.chunks ?? []);
      }
    };
    worker.addEventListener("message", handleMessage);
    signal.addEventListener("abort", handleAbort, { once: true });
    if (signal.aborted) { handleAbort(); return; }
    worker.postMessage({ jobId, audio, offsetSeconds, language }, [audio.buffer]);
  });
}

export async function transcribeVideo(
  file: File,
  language: string,
  signal: AbortSignal,
  onProgress: (progress: AnalysisProgress) => void,
): Promise<TranscriptionResult> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const worker = createWorker();
  const outputWords: TranscriptWord[] = [];
  const warningCodes = new Set<TranscriptionWarningCode>();
  let wordId = 0;
  let lastAudioWindow: Float32Array<ArrayBufferLike> = new Float32Array();
  let lastAudioWindowStart = 0;
  let lastAudioWindowEnd = 0;
  try {
    const audioTrack = await input.getPrimaryAudioTrack();
    if (!audioTrack) throw new Error("This video has no audio track. You can still set clip points manually, but speech analysis needs audio.");
    const duration = await input.computeDuration();
    const sampleRate = await audioTrack.getSampleRate();
    const sink = new AudioSampleSink(audioTrack);
    let chunks: Float32Array[] = [];
    let sampleCount = 0;
    let chunkStart = 0;
    let chunkNumber = 0;
    let newFramesSinceChunk = 0;

    const sendChunk = async (chunkStartSeconds: number) => {
      if (!sampleCount) return;
      if (signal.aborted) throw new DOMException("Analysis cancelled.", "AbortError");
      const mono = concatenate(chunks, sampleCount);
      const chunkDuration = mono.length / sampleRate;
      const carryFrames = Math.min(Math.round(sampleRate * TRANSCRIPTION_OVERLAP_SECONDS), mono.length);
      const carry = mono.slice(mono.length - carryFrames);
      const nextChunkStart = chunkStartSeconds + (mono.length - carryFrames) / sampleRate;
      const windowEnd = Math.min(duration, chunkStartSeconds + chunkDuration);
      lastAudioWindow = mono;
      lastAudioWindowStart = chunkStartSeconds;
      lastAudioWindowEnd = windowEnd;
      const audio = resampleLinear(mono, sampleRate);
      const replies = await recognize(worker, audio, chunkStartSeconds, language, signal, onProgress);
      for (const item of replies) {
        if (!item.text.trim() || item.start == null || item.end == null || !Number.isFinite(item.start) || !Number.isFinite(item.end)) continue;
        const outsideWindow = item.start < chunkStartSeconds - 0.05 || item.end > windowEnd + 0.05;
        const inSourceTail = windowEnd >= duration - 0.05;
        if (outsideWindow) {
          warningCodes.add("timestamp-outside-audio-window");
          if (inSourceTail) warningCodes.add("timestamp-outside-source-tail");
        }
        const fitted = fitWordToAudioWindow(item.start, item.end, chunkStartSeconds, windowEnd);
        if (!fitted) {
          if (item.end - item.start > MAX_WORD_DURATION_SECONDS) warningCodes.add("suspicious-word-duration");
          if (item.end > windowEnd + TIMESTAMP_TOLERANCE_SECONDS || item.start < chunkStartSeconds - TIMESTAMP_TOLERANCE_SECONDS) {
            warningCodes.add("timestamp-outside-audio-window");
            if (inSourceTail) warningCodes.add("timestamp-outside-source-tail");
          }
          continue;
        }
        const candidate: TranscriptWord = { id: `w-${wordId}`, text: item.text, start: fitted.start, end: fitted.end, score: item.score };
        const disposition = classifyChunkWord(candidate, outputWords, chunkStartSeconds, chunkNumber);
        if (disposition === "duplicate") continue;
        if (disposition === "conflict") {
          warningCodes.add("conflicting-overlap-words");
          continue;
        }
        outputWords.push(candidate);
        wordId += 1;
      }
      chunkNumber += 1;
      const coveredUntil = Math.min(duration, chunkStartSeconds + chunkDuration);
      onProgress({ stage: "transcribing", progress: Math.min(1, coveredUntil / duration), detail: `Transcribed ${coveredUntil.toFixed(0)} of ${duration.toFixed(0)} seconds` });
      chunks = carry.length ? [carry] : [];
      sampleCount = carry.length;
      chunkStart = nextChunkStart;
      newFramesSinceChunk = 0;
    };

    onProgress({ stage: "audio", progress: 0, detail: "Reading audio locally in short windows" });
    for await (const sample of sink.samples()) {
      if (signal.aborted) throw new DOMException("Analysis cancelled.", "AbortError");
      try {
        if (chunkNumber === 0 && sampleCount === 0) chunkStart = sample.timestamp;
        chunks.push(downmixToMono(sample));
        sampleCount += sample.numberOfFrames;
        newFramesSinceChunk += sample.numberOfFrames;
      } finally {
        sample.close();
      }
      const secondsInChunk = sampleCount / sampleRate;
      if (secondsInChunk >= TRANSCRIPTION_CHUNK_SECONDS) await sendChunk(chunkStart);
    }
    if (chunkNumber === 0 || newFramesSinceChunk > 0) await sendChunk(chunkStart);
    const lastWordEnd = outputWords.reduce((maximum, word) => Math.max(maximum, word.end), 0);
    if (lastAudioWindowEnd >= duration - 0.05 && hasSustainedAudioActivityAfterLastWord(lastAudioWindow, sampleRate, lastAudioWindowStart, lastWordEnd, duration)) {
      warningCodes.add("audio-activity-after-last-word");
    }
    onProgress({ stage: "transcribing", progress: 1, detail: "Speech analysis complete" });
    return { words: outputWords.sort((a, b) => a.start - b.start), warnings: [...warningCodes] };
  } finally {
    worker.terminate();
    input.dispose();
  }
}
