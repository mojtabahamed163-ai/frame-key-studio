# Task 3 — Stage 2 evidence: intermittent caption disappearance fix

Date: 2026-11-14

## Root cause

The existing full-caption snapshot guard correctly rejected results whose source cue ids, text, timing, or word timing no longer matched. A second race remained in the controller lifecycle: changing the target language or display workflow could abort an in-flight translation, while the old promise's `finally` block still unconditionally cleared the shared `translationController` and `isTranslating` state. If a new translation started before the old promise settled, the old cleanup could make the new job appear inactive and allow confusing intermediate preview state. The auto-translation path also did not share the controller reference, so changing the caption workflow could not reliably invalidate that job.

## Fix

The following changes were made:

- Added `translationRunId` in `client/src/pages/Studio.tsx`.
- Changing `targetLanguage` or `captionProcessingMode` now increments the run id and aborts the previous translation controller without clearing saved source or translated tracks.
- Both full-recording auto-translation and selected-clip translation register their controller and capture a run id.
- A result is merged only when its run id, controller signal, source snapshot, and active analysis controller are all still current.
- Each `finally` block clears progress only when it still owns the active controller; an older promise cannot clear a newer run.
- Added `client/src/features/studio/analysis/caption-job.ts` and `caption-job.test.ts` to make the active-run rule independently testable.

The earlier full source-snapshot validation remains in place. Display-mode selection still derives preview/export cues from the saved source and translated tracks; it does not mutate or erase those tracks.

## Regression evidence

The focused and full test command completed successfully after the change:

- `pnpm check` — PASS.
- `pnpm test -- --run` — PASS: 19 files, 128 tests.
- `git diff --check` — PASS.

The browser acceptance run uploaded the same real 5:25 source used by this task and started Whisper in the local worker. The long-source browser run did not produce a usable transcript in this sandbox session; therefore no successful Whisper or translation result is claimed from that attempt. Prior successful real-media evidence remains historical and is not used to claim that this new controller fix has been browser-accepted.
