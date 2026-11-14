# Task 3 — Stage 2 evidence: intermittent caption disappearance fix

Date: 2026-11-14

## Root cause

The local Whisper/OPUS-MT jobs are asynchronous. Before this change, a late translation result was considered safe when the current source cues had the same ids and text as the snapshot captured when the job started. That was incomplete: editing a line's in/out time or its word boundaries could leave the text unchanged while making the returned translation stale. A late commit could therefore replace the current presentation with an older timing snapshot, producing intermittent missing, stale, or apparently reappearing captions when the user changed modes, reopened the preview, or edited timing while a worker was finishing.

## Fix

`client/src/features/studio/analysis/caption-snapshot.ts` now validates the full source snapshot before an asynchronous translation result is merged. It checks cue order, ids, text, start/end times, and every source word's id, text, start, and end. It tolerates only 1 ms of media-timing floating-point noise. Both full-recording auto-translation and selected-clip translation use this guard; a stale result is discarded instead of overwriting the current project. Saved source and translated tracks remain separate, and display-mode selection continues to derive preview/export cues without mutating the saved analysis.

## Regression evidence

Added `caption-snapshot.test.ts` covering exact matches, changed cue timing, changed word timing, and harmless floating-point noise. After the fix:

- `pnpm check` — PASS.
- `pnpm test -- --run` — PASS: 18 files, 125 tests.
- `pnpm build` — PASS.
- `git diff --check` — PASS.

The browser run also exercised repeated source → select → edit navigation after a completed Arabic translation and showed the saved source and translated track still present. The application continued to display the English source first and Arabic below it in the dual preview.
