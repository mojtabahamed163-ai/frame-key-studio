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
