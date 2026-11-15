# Critical Fixes Report — Whisper and Final Export

**Fix commit:** `6a16b048625f87113edfcf1a77a869e227b41517` (`main`, pushed to `origin/main`). The final audit and evidence-packaging step did **not** rerun tests. This report documents the earlier operational verification and does not certify all browsers or devices.

## Starting revision and preserved work

- Repository: `mojtabahamed163-ai/frame-key-studio`, branch `main`.
- The fix work started from `c1d3c29ffcbe2643a3ae5631dd8f0f5f26d2ed45`.
- The prior functional verification tested `442f5c6290b92e65112ae150b758f060617c97b4`; the earlier report recorded a later main revision at `59f7083e3e6e6cc00c63e03598015eb77ccb2b50`.
- The four pre-existing buyer documents were preserved. The fix commit changes only the Vite config, two focused tests, the export helper, and these two fix reports.
- The earlier operational report recorded Whisper as failed after about 601 seconds and 30-second/5-second exports as cancelled. That historical export evidence did not contain a stack trace identifying the exact exception behind the generic cancellation notice.

## Whisper diagnosis, fix, and real run

A leading explanation for the earlier Whisper failure is Vite's dependency optimizer reacting to the first module-Worker import of `@huggingface/transformers`. Operational observations included the first analysis attempt returning the UI to its source state without a Worker result/error and a later successful run after pre-bundling the dependency. Such a development-server optimization can trigger a page reload, which would discard the in-memory analysis session. **This remains the probable explanation, not a conclusively demonstrated causal chain:** the preserved evidence does not include a direct Vite optimizer log linking optimizer restart, page unmount, controller abort, and loss of the source `File`. The regression test checks the configuration, not the page-reload sequence.

The implemented mitigation adds `@huggingface/transformers` to Vite's `optimizeDeps.include`, so it is prepared before the first analysis interaction. No model, audio-processing, or transcription algorithm was substituted. In the previously completed real run, the English model was `Xenova/whisper-base.en` (`q8`) in the local Transformers.js Worker. It reached model-ready, emitted results through completion, and recorded **zero Worker error events**. The UI showed **625 timed words** and **3 clip suggestions**; all three were flagged for transcript review. The result stream ran from 00:58:14.204Z to 00:59:58.598Z (about **104.4 seconds**); the final result was 107.8 seconds after the recorded model-ready event. Exact click-to-completion time was not captured.

The saved UI/Worker evidence includes warnings for timestamps outside the decoded audio window, an implausibly long word timestamp excluded from review, and disagreement near a chunk-overlap boundary. These remain review warnings. Only the English `whisper-base.en` path is claimed as tested here; no successful `whisper-tiny` multilingual run is claimed.

## Export diagnosis, fix, and real runs

Live browser instrumentation reproduced a repeated-export failure. `requestSaveTarget()` races `showSaveFilePicker()` against a 2.5-second timeout. After the first export fell back to the in-memory `BufferTarget`, the native picker request remained active. A subsequent request was rejected before `Conversion.init` with `NotAllowedError: ... File picker already active.` This repeated-picker blocker was directly observed in the tested embedded Chromium session.

The fix treats synchronous or asynchronous picker `NotAllowedError` as the absence of a direct file target and proceeds through the existing `BufferTarget` path; it also clears the timeout when the race settles. The encoder and selected media settings were not replaced. The regression test simulates the active-picker rejection and verifies a `null` target so the caller can use the in-memory path. On the successful 30-second retry, the saved trace recorded valid `Conversion.init`, no discarded tracks, finalized `Conversion.execute`, and **16,385,100 output bytes**.

**Historical-message caveat:** the earlier UI message `Export cancelled. No incomplete file was added to the results.` maps multiple abort paths. The old evidence did not record its originating exception/stage, so this report does not claim that the old notice was definitively caused by the later reproduced `NotAllowedError`.

## Integrated workflow and verified outputs

The same Wikimedia Commons source item was used for the new run; its SHA-256 matches the previous functional report. The source is the H. E. Mr Baron Waqa speech at the Connect Asia-Pacific 2013 Summit. Commons identifies **ITU** as attribution and **CC BY 3.0** as the license. The [Wikimedia Commons source page](https://commons.wikimedia.org/wiki/File:HE_Mr_Baron_Waqa,_MP_President,_Nauru_%28Republic_of%29_-_speech_at_Connect_Asia-Pacific_2013_Summit.webm) and license record are included in the evidence package. The original source video (71,813,058 bytes) is not included in that package; its metadata, license record, and SHA-256 are included so the public source can be retrieved and identified.

The actual Whisper result was passed to local English→Arabic OPUS-MT (`onnx-community/opus-mt-en-ar`), producing ten phrase-timed Arabic lines. The output is machine-generated and requires human review; it is not word-aligned. Face tracking was run on the real 5-second selection; the preview showed `FRAME LEFT`. The later 30-second selection used centered 9:16 framing after the earlier clip-bound keyframes were invalidated; no face-tracking success across all 30 seconds is claimed.

Both exports were initiated in the real `/studio` UI, saved, independently probed, and fully decoded with FFmpeg in the earlier verification run:

| Output in the evidence package | Size | Container / codecs | Duration | Video | Audio | SHA-256 |
|---|---:|---|---:|---|---|---|
| `export/outputs/clip-05s.webm` | 3,056,331 B | WebM / VP9 + Opus | 5.029 s | 608×1080, 30 fps, 150 frames | 48 kHz, stereo | `90acd3e3f544feab44f6dbcfbd8bcd9237b35b24f147cad1bccb2f08652e1dd1` |
| `export/outputs/clip-30s.webm` | 16,385,100 B | WebM / VP9 + Opus | 30.029 s | 608×1080, 30 fps, 900 frames | 48 kHz, stereo | `064205c933a5cca5418a55a0a0ea9992a063a787236f64dcfbb4aa2d8e89b61b` |

The package includes the prior `ffprobe` records, frame-count/video-check JSON, SHA-256 records, UI screenshots, and extracted frames at 2s and 27s. Those frames visibly show the portrait output and burned-in Arabic captions. **Only WebM was tested; MP4 is not tested or claimed.**

## Previously completed checks and repository record

The implementation checks were run before the final audit: the focused Vitest command passed **26 tests across 3 files**, `pnpm check` passed, and `pnpm build` passed with non-fatal Vite warnings about `/api/platform/config.js` lacking `type="module"` and large chunks. `git diff --check` also passed at that time. **None of these tests/checks was rerun during the final audit or evidence packaging.**

The implementation and original versions of these reports are recorded in commit `6a16b048625f87113edfcf1a77a869e227b41517`, pushed to `origin/main`. The four earlier buyer documents remain unchanged. The evidence archive is delivered separately rather than added to GitHub because it contains real video outputs.

## Portable evidence package and limits

The accompanying archive is named `frame-key-studio-evidence-2026-11-15.zip`. Its root `README.md` lists the relative directory structure, explains the verification commands and license, and states what is omitted. It contains the saved Whisper summary and UI/DOM captures, Arabic translation evidence, picker/export screenshots and console summary, both actual WebM outputs, their metadata/hashes/video checks, and extracted captioned frames. The source-video bytes and a full screen-recording of the successful current workflow are not included; the source file is identified by its public Commons page, source SHA-256, ffprobe metadata, and license record, and no full recording was available in this evidence set.

The archive is provided alongside this report; it is not a GitHub-hosted artifact. This run documents local processing in the tested Chromium environment only. It does not certify other browsers, establish MP4 export, guarantee transcript/translation accuracy, or prove the exact exception behind the historical generic cancellation notice.
