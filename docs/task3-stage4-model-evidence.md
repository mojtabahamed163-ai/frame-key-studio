# Task 3 — Stage 4 evidence: real Whisper and translation-model checks

Date: 2026-11-14

## Real source and Whisper

The full pinned source is the 5:25, 1280×720 Wikimedia Commons recording documented in `docs/task3-test-video-source.md`. It was uploaded to the Studio UI and selected with English speech. A full-source run in this browser session reached the local worker path but was too slow to produce a stable saved result in the available run window.

To diagnose the worker without replacing the source, a 35.035-second WebM excerpt was created from the same source recording at approximately 00:70. It was uploaded through the Studio UI, with no SRT/VTT input. Whisper Base English ran in the browser and produced a saved timed transcript of **88 words**. The UI surfaced the actual warnings about tail recovery, overlapping windows, and an implausibly long timestamp instead of presenting the text as guaranteed verbatim speech.

During the first run, the progress bar reached 100% while the final tail-recovery recognition promise was still pending. The code now bounds every worker recognition call with a two-minute timeout, cleans up its message and abort listeners, and rejects with an actionable retry/manual-clip message. This prevents an indefinitely pending analysis state and always lets the outer `finally` terminate the worker.

## OPUS-MT evidence

The application still uses the local Helsinki-NLP OPUS-MT models listed in the UI for English→Arabic, English→French, English→Spanish, and English→German. Existing historical acceptance records document actual runs on Whisper-derived text for all four target languages plus English-copy behavior. This stage does not claim that the still-running Arabic browser attempt completed; it will be recorded only if a non-empty model result is visibly saved.

## Automated checks after the change

- `pnpm check` — PASS.
- `pnpm test -- --run` — PASS: 19 files, 128 tests.
- `pnpm build` — PASS; only the existing non-blocking script/chunk-size warnings remain.
- `pnpm audit --prod` — PASS: no known vulnerabilities.
- `git diff --check` — PASS.

The source excerpt and generated media stay outside Git. Only the test metadata and report are committed.
