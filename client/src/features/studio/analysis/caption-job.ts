import type { CaptionProcessingMode, TranslationLanguage } from "../types";

/**
 * Async caption work is allowed to commit only while its run is still current.
 * A new language/mode selection increments the run id and aborts the old signal.
 */
export function isCurrentCaptionRun(
  runId: number,
  currentRunId: number,
  signal: AbortSignal,
  currentSignal: AbortSignal | null,
): boolean {
  return !signal.aborted && runId === currentRunId && currentSignal === signal;
}

/** Resolve the latest auto-translation choice after an asynchronous transcription. */
export function getAutoTranslationTarget(
  mode: CaptionProcessingMode,
  targetLanguage: TranslationLanguage,
  sourceLanguage: string,
): Exclude<TranslationLanguage, "none"> | null {
  if (
    mode === "transcribe-only" ||
    targetLanguage === "none" ||
    sourceLanguage !== "en"
  )
    return null;
  return targetLanguage;
}
