# Frame & Key Studio — Manual Acceptance Checklist

**Purpose:** repeatable buyer-facing browser check.  
**Rule:** mark `Passed` only after performing the step. Mark `Needs testing` when the browser/device was not actually tested. Do not infer browser support from code alone.

## Test record

- Date:
- Tester:
- Browser and version:
- Operating system/device:
- Project commit:
- Source file name and rights:
- Source duration / resolution / codec / size:
- Available memory (if known):

## A. Open and load the Studio

- [ ] Run `pnpm install --frozen-lockfile`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm test -- --run`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm dev`.
- [ ] Open `http://localhost:3000/studio`.
- [ ] Confirm the Studio shell renders without a fatal error.
- [ ] Record any browser console error separately from non-blocking warnings.

**Expected:** the Studio opens. A successful build or unit test does not by itself prove browser media acceptance.

## B. Upload and inspect a video

- [ ] Choose a legal local video with a known duration and resolution.
- [ ] Confirm the UI displays dimensions, duration, file size, and audio status.
- [ ] Confirm the source video is previewable.
- [ ] Repeat once with a no-audio video if available.
- [ ] Confirm the no-audio message allows manual clip selection.

**Expected:** metadata is read locally. No media upload request should be required by the Studio path.

## C. Whisper transcription

- [ ] Select English as the source language.
- [ ] Start transcription.
- [ ] Record model download progress and time to first result.
- [ ] Confirm timed words/captions appear.
- [ ] Confirm the transcript can be reviewed and edited.
- [ ] Cancel a second analysis while it is running, if practical.
- [ ] Repeat with a non-English sample only if the language is supported by the selected Whisper model.

**Expected:** the local worker returns text or a clear error. Transcript accuracy must be reviewed by a human; do not treat a result as ground truth.

## D. Clip suggestions and editing

- [ ] Confirm one or more suggestions appear when the transcript contains enough speech.
- [ ] Review the rationale/warnings for each suggestion.
- [ ] Select a suggestion.
- [ ] Change its start time and end time.
- [ ] Add a manual clip.
- [ ] Preview the selected clip.

**Expected:** all boundaries remain within the source duration and remain editable.

## E. Captions and post copy

- [ ] Edit one caption text line.
- [ ] Edit one caption start/end time.
- [ ] Switch between block and word timing if available.
- [ ] Try each relevant caption style.
- [ ] Import a small valid SRT file.
- [ ] Import a small valid VTT file.
- [ ] Export SRT.
- [ ] Export VTT.
- [ ] If the import is malformed, confirm a controlled error appears.
- [ ] Review title, description, hashtags, and call-to-action copy before using it.

**Expected:** imported/translated captions remain editable and translated timing is treated as approximate.

## F. Portrait framing

- [ ] Try Fill portrait frame.
- [ ] Move the manual horizontal framing control.
- [ ] Try Show full video/studio background.
- [ ] Confirm the preview is not stretched.
- [ ] Run optional face-assisted framing.
- [ ] If face tracking fails, confirm the UI reports the limitation and manual framing remains available.
- [ ] Inspect the crop at the beginning, middle, and end of a moving-subject clip.

**Expected:** the crop stays inside the source frame. Face tracking is an optional helper, not speaker identity recognition.

## G. Optional translation

- [ ] Use English source captions.
- [ ] Select French, Spanish, or German.
- [ ] Start translation.
- [ ] Record first-use model download size/time if visible.
- [ ] Review the translated lines for meaning.
- [ ] Confirm the UI warns that timing is phrase-level/approximate.
- [ ] Cancel translation if the browser/device permits a safe cancellation check.

**Expected:** translation runs locally after the selected model is available. Other target languages are not implied to work.

## H. Export and output inspection

- [ ] Select 720p output first.
- [ ] Export one short clip.
- [ ] Confirm the progress state changes beyond preparation and reaches Ready or a clear error.
- [ ] Download/save the output.
- [ ] Open the output in a media player.
- [ ] Inspect with `ffprobe` if available:

```bash
ffprobe -hide_banner -show_format -show_streams output.webm
```

- [ ] Confirm video dimensions, duration, codec, and audio presence match the selected workflow.
- [ ] Confirm captions/title/logo are visible if enabled.
- [ ] Try 1080p only when the device has sufficient memory.
- [ ] Select more than one clip and test sequential rendering.
- [ ] Test ZIP creation only when the estimated size is below the in-browser safety limit.

**Expected:** the output is non-empty and playable/inspectable. MP4 is conditional on browser codec support; WebM is the normal fallback.

## I. Cancellation and error recovery

- [ ] Cancel transcription during model load or analysis.
- [ ] Cancel translation during model load or line processing.
- [ ] Cancel export during rendering if practical.
- [ ] Try a missing/unsupported media source.
- [ ] Try a browser/device where direct file saving is unavailable.
- [ ] Confirm the UI gives an actionable error rather than silently reporting success.
- [ ] Reload the page and verify the saved project/settings behavior.
- [ ] If OPFS is used, remove or make the source unavailable and confirm recovery asks for the source again.

## J. Browser compatibility evidence matrix

Only change `Needs testing` to `Passed` after running the corresponding workflow. This repository's automated Node/Vitest run is not browser compatibility evidence.

| Feature | Chrome/Chromium | Edge | Firefox | Safari/macOS/iOS | Evidence required |
|---|---|---|---|---|---|
| Open Studio UI | Passed only if tested | Needs testing | Needs testing | Needs testing | Browser/version and date |
| Local metadata/audio inspection | Passed only if tested | Needs testing | Needs testing | Needs testing | Video + visible metadata |
| Whisper Worker transcription | Passed only if tested | Needs testing | Needs testing | Needs testing | Timed transcript and model result |
| SRT/VTT import/export | Passed only if tested | Needs testing | Needs testing | Needs testing | Imported and downloaded files |
| Fill portrait preview | Passed only if tested | Needs testing | Needs testing | Needs testing | Visible crop check |
| Full-video/studio-background preview | Passed only if tested | Needs testing | Needs testing | Needs testing | Visible non-stretched preview |
| Face-assisted framing | Passed only if tested | Needs testing | Needs testing | Needs testing | Detection or explicit fallback |
| Local translation | Passed only if tested | Needs testing | Needs testing | Needs testing | Selected model and translated output |
| 720p export | Passed only if tested | Needs testing | Needs testing | Needs testing | Playable output + ffprobe |
| 1080p export | Passed only if tested | Needs testing | Needs testing | Needs testing | Playable output + ffprobe |
| Direct-to-file saving | Passed only if tested | Needs testing | Needs testing | Needs testing | Chosen file exists |
| IndexedDB project persistence | Passed only if tested | Needs testing | Needs testing | Needs testing | Reload/reopen behavior |
| OPFS source persistence | Passed only if tested | Needs testing | Needs testing | Needs testing | Source survives browser restart |

## Current repository evidence

As of the current code review, automated checks pass with 13 test files and 90 tests. Historical repository reports document successful Chromium/Sandbox media scenarios, including local transcription, portrait framing, exports, audio, and ZIP behavior. Those reports retain their original dates and should not be read as fresh evidence for a browser/device that has not been tested in the current acceptance run.
