import type { CaptionCue } from "../types";
import { requestWorkerResult } from "../worker-request";

interface WorkerMessage {
  jobId: string;
  type: "model-progress" | "progress" | "result" | "error";
  status?: string;
  progress?: number;
  completed?: number;
  total?: number;
  translated?: string[];
  message?: string;
}

export interface TranslationProgress { stage: "model" | "translation"; progress: number; detail: string }

export function translateCues(cues: CaptionCue[], language: "fr" | "es" | "de", onProgress: (progress: TranslationProgress) => void, signal?: AbortSignal): Promise<CaptionCue[]> {
  const worker = new Worker(new URL("../workers/translate.worker.ts", import.meta.url), { type: "module", name: "framekey-local-translation" });
  const jobId = `translate-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return requestWorkerResult<WorkerMessage>(
    worker,
    jobId,
    () => worker.postMessage({ jobId, language, texts: cues.map((cue) => cue.text) }),
    {
      signal,
      terminateOnResult: true,
      onProgress: (data) => {
        if (data.type === "model-progress") {
          onProgress({ stage: "model", progress: Math.max(0, Math.min(1, data.progress ?? 0)), detail: data.status ?? "Downloading local translation model" });
        } else {
          onProgress({ stage: "translation", progress: (data.completed ?? 0) / Math.max(1, data.total ?? cues.length), detail: `Translated ${data.completed ?? 0} of ${data.total ?? cues.length} caption lines` });
        }
      },
    },
  ).then((data) => (data.translated ?? []).map((text, index) => ({
    ...cues[index],
    id: `translated-${language}-${cues[index]?.id ?? index}`,
    text: text || cues[index]?.text || "",
    words: [],
  })));
}
