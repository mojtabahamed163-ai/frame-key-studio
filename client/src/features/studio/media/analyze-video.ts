import { ALL_FORMATS, AudioSampleSink, BlobSource, Input } from "mediabunny";
import type { TranscriptWord, VideoMetadata } from "../types";

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

const TARGET_RATE = 16_000;
const CHUNK_SECONDS = 30;
const OVERLAP_SECONDS = 2;

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
        onProgress({ stage: "transcribing", progress: 0, detail: data.detail ?? "Transcribing a 30-second audio window" });
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
): Promise<TranscriptWord[]> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const worker = createWorker();
  const outputWords: TranscriptWord[] = [];
  let wordId = 0;
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
      const carryFrames = Math.min(Math.round(sampleRate * OVERLAP_SECONDS), mono.length);
      const carry = mono.slice(mono.length - carryFrames);
      const nextChunkStart = chunkStartSeconds + (mono.length - carryFrames) / sampleRate;
      const audio = resampleLinear(mono, sampleRate);
      const replies = await recognize(worker, audio, chunkStartSeconds, language, signal, onProgress);
      const overlapFloor = chunkNumber === 0 ? chunkStartSeconds : chunkStartSeconds + OVERLAP_SECONDS;
      for (const item of replies) {
        if (!item.text.trim() || item.start == null || item.end == null || item.end <= item.start) continue;
        if (item.start + (item.end - item.start) / 2 < overlapFloor) continue;
        outputWords.push({ id: `w-${wordId++}`, text: item.text, start: item.start, end: item.end, score: item.score });
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
      if (secondsInChunk >= CHUNK_SECONDS) await sendChunk(chunkStart);
    }
    if (chunkNumber === 0 || newFramesSinceChunk > 0) await sendChunk(chunkStart);
    onProgress({ stage: "transcribing", progress: 1, detail: "Speech analysis complete" });
    return outputWords.sort((a, b) => a.start - b.start);
  } finally {
    worker.terminate();
    input.dispose();
  }
}
