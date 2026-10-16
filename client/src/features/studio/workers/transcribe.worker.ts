/// <reference lib="webworker" />
import { pipeline } from "@huggingface/transformers";

const MULTILINGUAL_MODEL_ID = "Xenova/whisper-tiny";
const ENGLISH_MODEL_ID = "Xenova/whisper-base.en";
type AsrResult = { text?: string; chunks?: Array<{ text?: string; timestamp?: [number | null, number | null]; score?: number }> };
type AsrPipeline = (audio: Float32Array, options: Record<string, unknown>) => Promise<AsrResult>;
let transcriber: AsrPipeline | null = null;
let transcriberModelId: string | null = null;

interface RequestMessage {
  jobId: string;
  audio: Float32Array;
  offsetSeconds: number;
  language?: string;
}

self.onmessage = async (event: MessageEvent<RequestMessage>) => {
  const { jobId, audio, offsetSeconds, language } = event.data;
  try {
    const modelId = language === "en" ? ENGLISH_MODEL_ID : MULTILINGUAL_MODEL_ID;
    if (!transcriber || transcriberModelId !== modelId) {
      transcriber = await pipeline("automatic-speech-recognition", modelId, {
        dtype: "q8",
        progress_callback: (progress: { status?: string; progress?: number; file?: string }) => {
          self.postMessage({ jobId, type: "model-progress", status: progress.status ?? "loading", progress: progress.progress ?? 0, file: progress.file ?? "" });
        },
      }) as unknown as AsrPipeline;
      transcriberModelId = modelId;
    }
    const result = await transcriber(audio, {
      return_timestamps: "word",
      ...(modelId === ENGLISH_MODEL_ID ? {} : {
        ...(language && language !== "auto" ? { language } : {}),
        task: "transcribe",
      }),
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
