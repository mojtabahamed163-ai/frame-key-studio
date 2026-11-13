import type { CaptionCue, TranslationLanguage } from "../types";

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

export interface TranslationProgress {
  stage: "model" | "translation";
  progress: number;
  detail: string;
}

const WORKER_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export function mapTranslationResults(
  cues: CaptionCue[],
  language: "fr" | "es" | "de" | "ar",
  translatedTexts: string[]
): CaptionCue[] {
  if (translatedTexts.length !== cues.length) {
    throw new Error(
      `The translation model returned ${translatedTexts.length} lines for ${cues.length} captions. Retry translation before export.`
    );
  }
  return cues.map((cue, index) => {
    const text = translatedTexts[index]?.trim();
    if (!text) {
      throw new Error(
        `The translation model returned an empty result for caption ${index + 1}. Review the source or retry translation before export.`
      );
    }
    return {
      ...cue,
      id: `translated-${language}-${cue.id}`,
      text,
      words: [],
    };
  });
}

export function copyEnglishCues(cues: CaptionCue[]): CaptionCue[] {
  return cues.map(cue => ({
    ...cue,
    id: `translated-en-${cue.id}`,
    words: [],
  }));
}

export function mergeTranslatedCues(
  existingCues: CaptionCue[],
  existingLanguage: TranslationLanguage,
  translatedCues: CaptionCue[],
  nextLanguage: TranslationLanguage,
  replacedSourceCueIds: string[]
): CaptionCue[] {
  const keep =
    existingLanguage === nextLanguage
      ? existingCues.filter(
          cue =>
            cue.id.startsWith(`translated-${nextLanguage}-`) &&
            !replacedSourceCueIds.some(
              sourceId => cue.id === `translated-${nextLanguage}-${sourceId}`
            )
        )
      : [];
  return [...keep, ...translatedCues].sort((a, b) => a.start - b.start);
}

export function translateCues(
  cues: CaptionCue[],
  language: "fr" | "es" | "de" | "ar",
  onProgress: (progress: TranslationProgress) => void,
  signal?: AbortSignal
): Promise<CaptionCue[]> {
  const worker = new Worker(
    new URL("../workers/translate.worker.ts", import.meta.url),
    { type: "module", name: "framekey-local-translation" }
  );
  const jobId = `translate-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return new Promise((resolve, reject) => {
    let idleTimeout: ReturnType<typeof setTimeout>;
    const resetIdleTimeout = () => {
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        fail(
          new Error(
            "The local translation worker stopped reporting progress for 5 minutes. Check model access and retry; your transcript remains available."
          )
        );
      }, WORKER_IDLE_TIMEOUT_MS);
    };
    const cleanup = () => {
      clearTimeout(idleTimeout);
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      worker.removeEventListener("messageerror", onMessageError);
      signal?.removeEventListener("abort", onAbort);
      worker.terminate();
    };
    const fail = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException("Translation cancelled.", "AbortError"));
    };
    const onError = (event: ErrorEvent) => {
      event.preventDefault();
      fail(
        new Error(
          event.message ||
            "The local translation worker failed to load or run. Your transcript remains available; retry translation."
        )
      );
    };
    const onMessageError = () => {
      fail(
        new Error(
          "The local translation worker returned unreadable data. Your transcript remains available; retry translation."
        )
      );
    };
    const onMessage = (event: MessageEvent<WorkerMessage>) => {
      const data = event.data;
      if (data.jobId !== jobId) return;
      resetIdleTimeout();
      if (data.type === "model-progress") {
        onProgress({
          stage: "model",
          progress: Math.max(0, Math.min(1, data.progress ?? 0)),
          detail: data.status ?? "Downloading local translation model",
        });
      } else if (data.type === "progress") {
        onProgress({
          stage: "translation",
          progress:
            (data.completed ?? 0) / Math.max(1, data.total ?? cues.length),
          detail: `Translated ${data.completed ?? 0} of ${data.total ?? cues.length} caption lines`,
        });
      } else if (data.type === "error") {
        fail(new Error(data.message ?? "The local translation model failed."));
      } else if (data.type === "result") {
        try {
          const translated = mapTranslationResults(
            cues,
            language,
            data.translated ?? []
          );
          cleanup();
          resolve(translated);
        } catch (error) {
          fail(
            error instanceof Error
              ? error
              : new Error("The local translation result could not be validated.")
          );
        }
      }
    };
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.addEventListener("messageerror", onMessageError);
    signal?.addEventListener("abort", onAbort, { once: true });
    resetIdleTimeout();
    if (signal?.aborted) {
      onAbort();
      return;
    }
    try {
      worker.postMessage({
        jobId,
        language,
        texts: cues.map(cue => cue.text),
      });
    } catch (error) {
      fail(
        error instanceof Error
          ? error
          : new Error("The local translation worker could not be started.")
      );
    }
  });
}
