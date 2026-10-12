import type { CaptionCue } from "../types";

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
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      worker.removeEventListener("message", onMessage);
      signal?.removeEventListener("abort", onAbort);
      worker.terminate();
    };
    const onAbort = () => { cleanup(); reject(new DOMException("Translation cancelled.", "AbortError")); };
    const onMessage = (event: MessageEvent<WorkerMessage>) => {
      const data = event.data;
      if (data.jobId !== jobId) return;
      if (data.type === "model-progress") {
        onProgress({ stage: "model", progress: Math.max(0, Math.min(1, data.progress ?? 0)), detail: data.status ?? "Downloading local translation model" });
      } else if (data.type === "progress") {
        onProgress({ stage: "translation", progress: (data.completed ?? 0) / Math.max(1, data.total ?? cues.length), detail: `Translated ${data.completed ?? 0} of ${data.total ?? cues.length} caption lines` });
      } else if (data.type === "error") {
        cleanup();
        reject(new Error(data.message ?? "The local translation model failed."));
      } else if (data.type === "result") {
        const translated = (data.translated ?? []).map((text, index) => ({
          ...cues[index],
          id: `translated-${language}-${cues[index]?.id ?? index}`,
          text: text || cues[index]?.text || "",
          words: [],
        }));
        cleanup();
        resolve(translated);
      }
    };
    worker.addEventListener("message", onMessage);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) { onAbort(); return; }
    worker.postMessage({ jobId, language, texts: cues.map((cue) => cue.text) });
  });
}
