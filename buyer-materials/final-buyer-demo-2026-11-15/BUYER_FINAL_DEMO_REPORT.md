# Final Buyer Demonstration Report

**Project:** Frame & Key Studio
**Target buyer:** Clinton Beiter — RETIEB Labs LLC
**Recording date:** 2026-11-15
**Application source baseline:** `1fcbc7f5c202659c80b8e24e9709f430238e6909`
**Repository checkout used:** `e124451451bf91490a892141d168321073d71540`
**Browser:** Chromium 156.0.8078.73
**Final status:** **FAIL**

## Executive result

A new English-language screen recording was made against the actual Frame & Key Studio application using the genuine source video identified by the required SHA-256. The recording demonstrates import, local source handling, the English Whisper configuration, actual Whisper analysis, three real suggested clips, the editable vertical workflow, and an actual caption edit.

The required export acceptance did not pass in the new recording session. The application attempted a genuine 30-second WebM export and returned:

> Export cancelled. No incomplete file was added to the results.

As explicitly permitted by the task, the session then attempted a genuine 5-second WebM export. It returned the same cancellation message. No application-generated exported example was saved during this new session.

Under the supplied acceptance rules, this is **FAIL**, not PASS or PARTIAL: no actual application export succeeded during the new recording session. The prior investigation’s successful WebM exports are not substituted for the required new-session output.

## What the new recording demonstrates

The raw recording and screenshots show the following actions in the actual application:

1. The actual Frame & Key Studio interface was opened in Chromium.
2. The genuine Wikimedia source was imported through the video file input and its preview was displayed.
3. The workflow was configured for English speech and the English-to-Arabic caption workflow.
4. Local Whisper analysis completed and the application reported three distinct candidate clips selected from the timed transcript.
5. The application displayed the generated suggestions and selected a real suggestion for editing.
6. The actual portrait editing workflow was opened and the preview showed the source in a vertical 9:16 presentation.
7. A real caption cue was edited in the application by appending `[reviewed]` to the first generated cue.
8. The export screen showed WebM output and the vertical 608×1080 / 30 fps target.
9. The application attempted the real 30-second export, failed with the cancellation notice, and then attempted the permitted 5-second export, which failed with the same notice.

The recording does not claim that a successful export file was created. It also does not claim successful outside-the-editor playback of an exported file, because no new exported file exists.

## What was independently verified before this recording

The earlier export investigation on the same application code path, revision `1fcbc7f5c202659c80b8e24e9709f430238e6909`, successfully produced and independently decoded separate 5-second and 30-second WebM files. Those historical files were WebM / VP9 + Opus at 608×1080 and 30 fps. That evidence established that the code path can succeed in the previously verified browser environment.

Those historical outputs are not part of the new recording-session deliverable and were not copied into this package. The new session’s result remains a failure.

## Source video

**Path:** `source/Frame-and-Key-Studio-Original-Source.webm`
**Size:** 71,813,058 bytes
**SHA-256:** `3397f97f879f94c83b764aeed916defb83113ce0b0e6994531b1be5989709f1f`
**Format:** WebM / VP8 video / Vorbis stereo audio
**Video:** 1920×1080 at 25 fps
**Audio:** 44.1 kHz stereo
**Duration:** 414.502 seconds

The source is genuine Wikimedia Commons media and was not AI-generated.

## New recording files

### Final buyer-facing MP4

**Path:** `Frame-and-Key-Studio-Final-Buyer-Demo.mp4`
**Size:** 3,574,095 bytes
**SHA-256:** `e32bd175cf1f892fe0b105ae436a5991d32281b856953176ef279650a04d9fe4`
**Format:** MP4 / H.264
**Video:** 1920×1080, 16:9, 30 fps
**Duration:** 144.533 seconds
**Audio:** none; the browser screen recording did not contain an audio track

The MP4 is an edited assembly of an English opening card, the raw screen recording, and an English closing card that explicitly states that the export retry did not complete. It is not presented as a successful product demonstration.

### Original screen recording

**Path:** `Frame-and-Key-Studio-Original-Recording.webm`
**Size:** 19,602,128 bytes
**SHA-256:** `bdc0876d4360c6d2f952cf036ff5a8c1a0ea7b4bcf27bdfff4a540a4f2e4b12d`
**Format:** WebM / VP9
**Video:** 1920×1080, 25 fps
**Duration:** 135.520 seconds
**Audio:** none

### Required exported example

No `Frame-and-Key-Studio-Exported-Example.webm` exists because the real application did not complete either export during this session. The explicit marker `Frame-and-Key-Studio-Exported-Example.NOT_PRODUCED.txt` is included instead. It would be misleading to copy the earlier successful export into the requested filename.

## Failure record

First recording attempt:

- Whisper analysis reported three distinct candidate clips.
- A genuine 30-second application export was initiated.
- The application ended with `Export cancelled. No incomplete file was added to the results.`

Second recording attempt:

- Whisper analysis again reported three distinct candidate clips.
- A genuine 30-second application export was attempted and failed with the same message.
- The permitted genuine 5-second application export was attempted and failed with the same message.

The raw retry recording and both logs are preserved. No failure was concealed and no previous output was substituted.

## Independent verification

FFprobe JSON files are stored under `verification/` for the source, original screen recording, and final buyer-demo MP4. FFmpeg full-decode logs are also stored there.

- Source FFmpeg decode: **PASS**, zero error bytes.
- Original screen recording FFmpeg decode: **PASS**, zero error bytes.
- Final buyer-demo MP4 FFmpeg decode: **PASS**, zero error bytes.
- Application export verification: **NOT AVAILABLE**, because no new application export file was produced.
- Outside-the-editor exported-file playback: **NOT AVAILABLE**, because no new application export file was produced.

## Screenshots

Genuine screenshots from the new recording session are in:

`/home/ubuntu/qa-artifacts/final-buyer-demo-2026-11-15/screenshots/`

They include import, English Whisper/Arabic workflow settings, actual suggestions, vertical editing, caption editing, export settings, and the 30-second and 5-second cancellation outcomes.

## Limitations and non-claims

- This package does not claim a successful export in the new session.
- It does not claim that the Arabic translation was visibly captured as a readable caption in the final recording; the workflow was configured for it and the app’s analysis path was run, but the captured evidence is strongest for the English Whisper transcript and suggestions.
- It does not claim outside-the-editor playback of a new exported file.
- It does not claim MP4 export support by the application; the MP4 is only the screen-recording delivery container assembled with FFmpeg.
- It does not claim universal browser compatibility.
- No application source code, dependencies, configuration, previous recording, or historical report was changed.
- No Git commit or push was performed.

## Required conclusion

The required buyer demonstration cannot honestly be marked PASS because no real application export succeeded during this new recording session. The correct status is **FAIL**. The evidence package preserves the genuine workflow, the genuine source, the exact failure messages, the readable final recording, and independent checks of all media that actually exists.
