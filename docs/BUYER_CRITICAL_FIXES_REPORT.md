# Critical Fixes Report — Whisper and Final Export

**Status:** Operational fixes verified locally in Chromium; changes remain uncommitted and unpushed. This is evidence for the tested environment, not a claim of cross-browser certification.

## Starting revision and preserved work

- Repository: `mojtabahamed163-ai/frame-key-studio`, branch `main`.
- Starting `HEAD` and `origin/main`: `c1d3c29ffcbe2643a3ae5631dd8f0f5f26d2ed45` (`docs: add functional verification reports`).
- Previously tested revision: `442f5c6290b92e65112ae150b758f060617c97b4`; the branch recorded after that test was `59f7083e3e6e6cc00c63e03598015eb77ccb2b50`.
- The diff from the previously tested revision to the starting `main` added four documentation files only: `BUYER_TECHNICAL_OVERVIEW.md`, `BUYER_TECHNICAL_OVERVIEW_AR.md`, and the English/Arabic functional-verification reports. They were preserved and not overwritten or deleted.
- The earlier QA report recorded Whisper as failed after about 601 seconds and 30-second/5-second exports as cancelled. Its browser evidence did not include a stack trace identifying the precise thrown exception for that historical cancellation.

## Whisper diagnosis, fix, and real run

The failure was traced to the development-server dependency optimizer, not to a replacement or failure of the speech model. The first module-Worker import of `@huggingface/transformers` could trigger Vite dependency re-optimization/page reload during the first Analyze action. Studio's unmount cleanup aborts the in-flight analysis, and the in-memory `File`/Worker session is lost before results reach the page. That matches the observed first-run page reset and absence of a Worker error/result. The fix pre-bundles `@huggingface/transformers` at Vite startup via `optimizeDeps.include`, so the first analysis does not trigger that optimizer restart. A regression test protects the setting.

No model, audio-processing, or transcription algorithm was substituted. The actual English model remains `Xenova/whisper-base.en` (`q8`) in the local Transformers.js Worker. On the real 6:54.502 Wikimedia video, the Worker reported model-ready, streamed results through completion, and recorded **zero Worker error events**. The UI displayed **625 timed words** and **3 clip suggestions**; all three were marked for transcript review. The result stream ran from 00:58:14.204Z to 00:59:58.598Z (about **104.4 seconds**); the last result was 107.8 seconds after the recorded model-ready event. Exact click-to-finish time was not present in the saved summary.

The UI also reported review warnings for timestamps outside the decoded audio window, one implausibly long word timestamp excluded from review, and an overlap disagreement near a chunk boundary. These are visible review warnings, not Worker errors or hidden failures.

Files changed for this fix: `vite.config.ts` and the new `client/src/features/studio/workers/transcribe-vite-optimization.test.ts`. `transcribe.worker.ts` and the local model pipeline were not changed.

## Export diagnosis, fix, and real runs

A separate failure was reproduced with live instrumentation. `requestSaveTarget()` races `showSaveFilePicker()` against a 2.5-second timeout. In this embedded browser, the timeout allowed the first export to use the existing in-memory `BufferTarget`, but it did not dismiss/cancel the pending native picker request. The next export was then rejected before `Conversion.init` with `NotAllowedError: Failed to execute 'showSaveFilePicker' on 'Window': File picker already active.` This is the confirmed, reproducible cause of the blocked repeated export in this environment.

The fix treats a synchronous or asynchronous picker `NotAllowedError` as “no direct file target” and continues with the existing in-memory export path; it also clears the timeout once the race settles. This preserves the actual encoder, audio, resolution, and output quality. A regression test asserts that an already-active picker falls back to the buffer target. After the fix, the same 30-second clip exported successfully despite the still-active picker: `Conversion.init` was valid with no discarded tracks, `Conversion.execute` finalized, and `BufferTarget` contained **16,385,100 bytes**.

**Historical-message caveat:** the earlier generic UI text `Export cancelled. No incomplete file was added to the results.` maps multiple abort paths. The old evidence did not record the exception/stage, so it is not possible to prove that the historical message was this exact `NotAllowedError`. The current repeated-picker failure was directly reproduced and fixed; the reports do not retroactively claim more than the evidence proves.

## Integrated workflow and verified outputs

The previous task’s source file was unavailable at its old path, so the same Wikimedia Commons media was downloaded again. Its SHA-256 matches the previous functional report. Commons identifies author/attribution as **ITU** and the license as **CC BY 3.0**. The tests used real speech, not generated media, a prepared transcript, or a paid inference service. The browser processed the media locally.

The actual Whisper text was used to run local English→Arabic OPUS-MT (`onnx-community/opus-mt-en-ar`): ten phrase-timed Arabic lines appeared in the UI. The phrases are machine-generated and require human review; the UI correctly describes timing as phrase-level, not word-level. Face tracking was run on the real 5-second selection; the preview showed `FRAME LEFT`, and the resulting file is portrait. The 30-second clip was subsequently extended, which invalidated the earlier clip-bound keyframes; its verified output therefore uses centered 9:16 framing, not a claim of face tracking across all 30 seconds.

Both exports were initiated in the real `/studio` UI, downloaded from its Save file control, then independently probed and fully decoded with FFmpeg:

| Output | Size | Container / codecs | Duration | Video | Audio | SHA-256 |
|---|---:|---|---:|---|---|---|
| [5-second WebM](/home/ubuntu/qa-artifacts/task5-2026-11-15/outputs/clip-05s.webm) | 3,056,331 B | WebM / VP9 + Opus | 5.029 s | 608×1080, 30 fps, 150 frames | 48 kHz, stereo | `90acd3e3f544feab44f6dbcfbd8bcd9237b35b24f147cad1bccb2f08652e1dd1` |
| [30-second WebM](/home/ubuntu/qa-artifacts/task5-2026-11-15/outputs/clip-30s.webm) | 16,385,100 B | WebM / VP9 + Opus | 30.029 s | 608×1080, 30 fps, 900 frames | 48 kHz, stereo | `064205c933a5cca5418a55a0a0ea9992a063a787236f64dcfbb4aa2d8e89b61b` |

FFmpeg full-decode checks completed without errors. Extracted frames at 2s and 27s visibly show the portrait image and burned-in Arabic captions. Only WebM was tested; no MP4 success is claimed.

## Automated checks and modified files

- `pnpm exec vitest run client/src/features/studio/media/analyze-video.test.ts client/src/features/studio/export/convert-clip.test.ts client/src/features/studio/workers/transcribe-vite-optimization.test.ts` — **26 tests passed** across 3 files.
- `pnpm check` — passed.
- `pnpm build` — passed. Vite emitted non-fatal warnings about `/api/platform/config.js` lacking `type="module"` and large chunks; the build completed.
- `git diff --check` — passed.

Modified/added code files: `vite.config.ts`, `client/src/features/studio/workers/transcribe-vite-optimization.test.ts`, `client/src/features/studio/export/convert-clip.ts`, and `client/src/features/studio/export/convert-clip.test.ts`. The two reports are new files; prior buyer documentation remains intact. No commit or push was performed.

## Evidence location and limits

Evidence is kept outside Git at `/home/ubuntu/qa-artifacts/task5-2026-11-15/`; see its `README.md` for the source fingerprint/license, Worker summary, before/after screenshots, console trace, output metadata, hashes, and extracted frames. This run proves local Whisper transcription and two valid WebM exports in this Chromium environment. It does not certify other browsers, test MP4, guarantee transcript/translation accuracy, or prove the exact exception behind the historical generic cancellation message.
