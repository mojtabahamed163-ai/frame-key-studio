# Final Buyer Demonstration Report

**Project:** `mojtabahamed163-ai/frame-key-studio`  
**Checkout:** `e124451451bf91490a892141d168321073d71540`  
**Evidence directory:** `/home/ubuntu/qa-artifacts/final-buyer-demo-2026-11-15/`  
**Final status:** **FAIL**

## Executive summary

A genuine headed Chromium demonstration was performed against the requested checkout without modifying application source, dependencies, project settings, commits, or GitHub. The verified real source video was imported successfully. Local Whisper transcription completed and produced three real clip suggestions with timed transcript data. An English-to-Arabic translation was then attempted through the application’s actual local OPUS-MT workflow and failed honestly: `The translation model returned an empty result for caption 10.`

A portrait 9:16 preview was shown through the application. A five-second-limited face-tracking requirement was not verified: the real `Find face` operation was started on the manual 30-second clip, but no completed success state was observed. Caption editing could not be demonstrated because the manual clip had no caption lines and the translation failed. No newly exported video was independently verified. Under the supplied acceptance criteria, this is **FAIL**, not PASS or PARTIAL, because no newly generated export can be independently verified.

## Environment evidence

- Chromium: `156.0.8078.73`
- Executable: `/usr/bin/chromium`
- Browser mode: headed (`headless: false`)
- Chromium user agent: `Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36`
- Primary headed browser command line was captured from the running Chromium process in the execution log.
- Xvfb verification: `1440x1000`, 24-bit depth was started for the dedicated headed runs.
- The application server was started locally on port 3000 from the requested detached checkout.
- `git status --short` was clean throughout the project checkout; no commit or push was made.

## Source video verification

The exact source required by the supplied SHA-256 was found from the project’s documented Wikimedia source record and downloaded into the new evidence directory.

- Source file: `source.webm`
- SHA-256: `3397f97f879f94c83b764aeed916defb83113ce0b0e6994531b1be5989709f1f`
- Container: WebM/Matroska
- Video: VP8, `1920x1080`, `25 fps`
- Audio: Vorbis, stereo, `44.1 kHz`
- Duration: `414.502 seconds`
- Size: `71,813,058 bytes`

An initial Obama source URL was also tested but did not match the required hash and was explicitly not used. Its mismatch is preserved in `source-verification.txt`; the verified source used by the application is `source.webm`.

## Demonstration results

### 1. Application introduction and import — PASS

The English interface was opened at `/studio`. The real source was selected through the file input and the application displayed `source.webm`, `68 MB · 1920 × 1080 · audio detected`, and `6:54`. The source was stored in browser-local IndexedDB according to the visible UI.

Evidence: `01-introduction.png`, `02-source-imported.png`, `source-ui.txt`.

### 2. Whisper transcription — PASS with review warnings

The real local Whisper workflow was run to completion. The UI reported `Analysis complete` and created `3 SUGGESTIONS` from `623 timed words`. The visible suggestions included actual transcript text and ranges such as `2:37–3:06`, `6:05–6:25`, and `6:26–6:46`. The application explicitly warned that the machine-generated transcript is a draft and that some model timestamps required review. No claim of perfect accuracy is made.

Evidence: `04-whisper-complete.png`, `whisper-complete-ui.txt`, `whisper-complete-states.txt`, `whisper-complete-status.txt`.

### 3. English-to-Arabic translation — FAIL

The actual workflow was configured as `Transcription + translation — both lines`, speech language `English`, target language `Arabic`, and analysis was run in the visible headed application. Whisper completed, then local OPUS-MT translation was attempted. The final visible error was:

> Whisper transcription is complete and remains available, but local translation failed: The translation model returned an empty result for caption 10. Review the source or retry translation before export.

No Arabic captions are claimed. No manually typed Arabic text was used as evidence.

Evidence: `06-translation-final.png`, `translation-final-ui.txt`, `translation-integrated-states.txt`.

### 4. Vertical framing — PARTIAL

The application was configured to `Vertical 9:16 · crop sides`. The UI showed the portrait preview and stated that the crop uses approximately `608×1080` source pixels and can be enlarged to `1080×1920`. This proves the visible framing control and preview, not a verified exported 1080×1920 file.

Evidence: `09-vertical-preview.png`, `manual-cut-ui.txt`.

### 5. Face tracking — NOT VERIFIED / FAIL FOR ACCEPTANCE

The real `Find face` control was clicked on the real five-second-limited workflow requirement’s manual clip context. The UI remained at the control state and no completed detection result or bounded five-second success report was captured. Therefore no face-tracking success is claimed.

Evidence: `10-face-tracking.png`, `face-export-ui.txt`.

### 6. Caption editing — NOT VERIFIED

The manual 30-second clip had no caption lines because it bypassed transcript generation. The transcript run produced captions in its own flow, but translation failed before a valid translated caption track could be shown and edited. No fabricated or manually typed caption is presented as proof.

### 7. Export — FAIL

The requested native save-picker export was not successfully completed. In the manual-cut path, the expected `Export selected clip` control was not available in the captured state after the face-tracking attempt. No new output file was produced by this demonstration. The existing historical exports in the repository were not reused or presented as new evidence.

No fallback BufferTarget/download export was attempted because there was no completed native export attempt to fall back from in the final run. No output SHA-256, FFprobe record, full FFmpeg decode, or external playback proof exists for a newly generated file.

The raw screen recordings created during setup are preserved, but both MP4 files are incomplete (`moov atom not found`) because their FFmpeg capture processes were terminated. They are not presented as valid final recordings.

## Acceptance decision

**FAIL.** The source import and real Whisper demonstration succeeded, but the Arabic translation failed, face tracking was not verified, caption editing was not demonstrated, and—most importantly—no newly generated export was independently verified. This report does not substitute historical repository media for a new export.

## Evidence inventory

- `source.webm`
- `verified-source.webm` (hash-mismatched initial candidate, not used)
- `source-verification.txt`
- `verification-manifest.txt`
- `01-introduction.png`
- `02-source-imported.png`
- `03-whisper-result.png`
- `03-whisper-stopped.png`
- `04-whisper-complete.png`
- `05-translation-settings-ready.png` (if present)
- `06-translation-final.png`
- `09-vertical-preview.png`
- `10-face-tracking.png`
- `11-export-result.png` (if present)
- UI text and state logs, browser console log, and FFmpeg/Xvfb logs

No project files were modified. No commit was created. No push or deployment was performed.
