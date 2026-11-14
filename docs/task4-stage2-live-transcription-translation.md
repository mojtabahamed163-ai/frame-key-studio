# Task 4 — Stage 2: live Whisper and OPUS-MT acceptance

Date: 2026-11-14

## Live Whisper run

The application used the same locally selected `waqa-speech.webm` source documented in Stage 1. No SRT/VTT file or prepared transcript was supplied. Whisper ran in the browser worker using `Xenova/whisper-base.en` and processed the full `414.502` second recording.

The live run completed and produced `623` timed words and three candidate clips. The UI retained the transcript and moved to Pick moments. A reviewed sample from the first candidate began with the actual model output `However, there are areas in which we believe that collaboration between states and non -state actors could produce results...`. The model output is visibly imperfect in places, so the UI correctly labels it as a draft requiring a listen-through rather than claiming 100% accuracy.

The run exposed these honest warnings: timestamps outside the decoded audio window, one implausibly long word timestamp excluded for review, and disagreement near an overlapping-window boundary. The application kept the transcript and surfaced the warnings instead of silently discarding the full result.

## Translation investigation and fix

The first full-recording automatic English→Arabic translation run reached the real OPUS-MT model but returned an empty result for caption 10. The source line was a valid Whisper-produced line (`with the recent natural disaster.`), so the failure was not caused by an empty source. The selected-clip retry then translated all `10/10` lines successfully, including the visible preview `However,` → `ومع ذلك،`.

The root cause addressed in this stage is transient empty-beam output from the browser/ONNX translation call. `client/src/features/studio/workers/translate.worker.ts` now retries a non-empty source line once after normalizing whitespace and uses a bounded token budget based on the input length. It never substitutes the English source or invents a translation. If both attempts remain empty, the existing validation still fails the operation and preserves the source transcript.

## Checks after the fix

`pnpm check`, the full Vitest suite, and `git diff --check` passed after the Worker change. The full suite remains at 19 test files and 132 tests. The live browser result is stronger than a count-only check because it used the new six-minute source, retained the timed transcript, showed actual warning text, and produced a visible Arabic translation from the selected Whisper-derived clip.

This stage does not yet claim the five-cycle persistence/mode acceptance or a final exported media file. Those are the next live checks and must use this same source project.
