# Task 3 — Stage 2 evidence: intermittent caption disappearance fix

Date: 2026-11-14

## Root causes

Two asynchronous races could make caption results appear inconsistent.

1. A full-caption translation could be aborted when the user changed its target language or caption workflow. The old promise could then settle after a replacement job had started. Its unconditional `finally` cleanup could clear the shared controller/progress state owned by the newer run. The earlier run-identity guard addressed this cleanup race, and both full-recording and selected-clip translation now use active controller ownership plus source-snapshot validation before merging.
2. A further race remained before that guard became active. `runTranscription` captured the mode and target language before awaiting Whisper. While Whisper was still processing, a user could change Arabic to French, or switch back to transcription-only. At that point no translation controller had been registered yet, so the change could not cancel the pending plan. After Whisper completed, the stale closure could translate into the old language and save it under that language. The current preview selected the newly chosen language and therefore showed no translation, even though the old result existed. Switching to transcription-only could also start an unnecessary stale translation after the transcript completed.

## Fixes

- Added a synchronous `settingsRef` updated by settings changes and saved-project restoration. The asynchronous Whisper continuation now reads the latest caption mode, target language, and source language after transcription completes.
- Added `getAutoTranslationTarget`; it returns only an eligible current target. It prevents stale translation after switching to transcription-only or no target, and prevents OPUS-MT from running for an unsupported non-English source.
- Kept source transcription results even if translation is cancelled or fails. Existing run-id, AbortController-identity, and full source-caption-snapshot checks still reject outdated or mismatched translation results.
- Kept mode selection as a derived view of saved source and translated tracks; changing the view does not clear either saved track. Dual mode matches translated cues to source cues by the source cue ID embedded in the translated cue ID.

The implementation is in `client/src/pages/Studio.tsx` and `client/src/features/studio/analysis/caption-job.ts`. Regression tests are in `client/src/features/studio/analysis/caption-job.test.ts`.

## Regression checks

- `pnpm check` — PASS.
- `pnpm exec vitest run client/src/features/studio/analysis/caption-job.test.ts` — PASS: 7 tests.
- `pnpm exec vitest run` — PASS: 19 test files, 132 tests.
- `git diff --check` — PASS.

The new tests cover latest-target selection after transcription, switching to transcription-only, removing the target, unsupported source language, and active-run ownership. These code-level checks do not replace the full-video Whisper/OPUS-MT and repeated browser-mode acceptance tests, which are recorded in later task stages.
