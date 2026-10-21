/// <reference lib="webworker" />
import { pipeline } from "@huggingface/transformers";
import { withTimeout } from "../analysis/promise-timeout";

const MODEL_ID = "Xenova/whisper-tiny";
const MODEL_LOAD_TIMEOUT_MS = 180_000;
type AsrResult = { text?: string; chunks?: Array<{ text?: string; timestamp?: [number | null, number | null]; score?: number }> };
type AsrPipeline = (audio: Float32Array, options: Record<string, unknown>) => Promise<AsrResult>;
let transcriber: AsrPipeline | null = null;

interface RequestMessage {
  jobId: string;
  audio: Float32Array;
  offsetSeconds: number;
  language?: string;
}

self.onmessage = async (event: MessageEvent<RequestMessage>) => {
  const { jobId, audio, offsetSeconds, language } = event.data;
  try {
    if (!transcriber) {
      const modelLoad = pipeline("automatic-speech-recognition", MODEL_ID, {
        dtype: "q8",
        progress_callback: (progress: { status?: string; progress?: number; file?: string }) => {
          self.postMessage({ jobId, type: "model-progress", status: progress.status ?? "loading", progress: progress.progress ?? 0, file: progress.file ?? "" });
        },
      }) as unknown as Promise<AsrPipeline>;
      transcriber = await withTimeout(
        modelLoad,
        MODEL_LOAD_TIMEOUT_MS,
        "The local speech model did not finish loading within 3 minutes. Check access to Hugging Face and retry, or use manual clip selection.",
      );
    }
    const result = await transcriber(audio, {
      chunk_length_s: 30,
      stride_length_s: 2,
      return_timestamps: "word",
      ...(language && language !== "auto" ? { language } : {}),
      task: "transcribe",
    });
    const chunks = (result.chunks ?? []).map((chunk) => ({
      text: chunk.text ?? "",
      start: chunk.timestamp?.[0] == null ? null : chunk.timestamp[0] + offsetSeconds,
      end: chunk.timestamp?.[1] == null ? null : chunk.timestamp[1] + offsetSeconds,
      score: chunk.score,
    }));
    self.postMessage({ jobId, type: "result", text: result.text ?? "", chunks });
  } catch (error) {
    self.postMessage({ jobId, type: "error", message: error instanceof Error ? error.message : "Transcription failed on this device." });
  }
};
