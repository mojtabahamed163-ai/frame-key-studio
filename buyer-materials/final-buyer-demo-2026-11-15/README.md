# Frame & Key Studio — Final Buyer Demonstration Package

**Target buyer:** Clinton Beiter — RETIEB Labs LLC
**Asking price context:** $4,000 USD
**Recording date:** 2026-11-15
**Application source baseline:** `1fcbc7f5c202659c80b8e24e9709f430238e6909`
**Repository checkout used:** `e124451451bf91490a892141d168321073d71540` (documentation-only commit after the application baseline)

## Honest status: FAIL

This package contains a new English-language Chromium screen recording of the actual Frame & Key Studio application. The session successfully imported the genuine source, ran local Whisper analysis, displayed three real suggested clips, entered the editable vertical workflow, and performed a real caption edit.

The application then attempted a genuine 30-second WebM export and, as allowed by the task, a genuine 5-second WebM export. Both ended with the application message:

> Export cancelled. No incomplete file was added to the results.

No application-generated exported example exists from this recording session. The file `Frame-and-Key-Studio-Exported-Example.NOT_PRODUCED.txt` is an explicit marker; no prior export was copied into its place.

The task therefore does **not** meet the PASS acceptance criteria. The previous investigation’s successful 5-second and 30-second WebM files are historical evidence only and are intentionally not presented as outputs of this new recording session.

## Files

- `Frame-and-Key-Studio-Final-Buyer-Demo.mp4` — edited English buyer-facing screen recording. It contains an English opening card, the raw session, and an English closing card that states the export retry did not complete.
- `Frame-and-Key-Studio-Original-Recording.webm` — unedited Playwright/Chromium recording of the retry session.
- `Frame-and-Key-Studio-Exported-Example.NOT_PRODUCED.txt` — explicit marker that the required new application export was not produced.
- `source/Frame-and-Key-Studio-Original-Source.webm` — genuine Wikimedia Commons source used in the new session.
- `screenshots/` — genuine screenshots captured from the new session, including import, model settings, Whisper suggestions, caption editing, vertical framing, export settings, and both failed export outcomes.
- `recording-session.log` — first recording attempt: transcription and suggestion flow completed; 30-second export failed.
- `recording-retry.log` — second recording attempt: transcription and suggestions completed; 30-second and permitted 5-second exports both failed.
- `verification/` — FFprobe JSON, SHA-256 files, and FFmpeg decode logs for the source, raw recording, and final MP4.

## Source provenance

The source is the genuine Wikimedia Commons file documented by the project:

`https://commons.wikimedia.org/wiki/File:HE_Mr_Baron_Waqa,_MP_President,_Nauru_(Republic_of)_-_speech_at_Connect_Asia-Pacific_2013_Summit.webm`

Its SHA-256 is:

`3397f97f879f94c83b764aeed916defb83113ce0b0e6994531b1be5989709f1f`

It is not AI-generated footage.

## Independent checks

- Source: WebM, VP8 video, 1920×1080, 25 fps, Vorbis stereo audio at 44.1 kHz, 414.502 seconds, 71,813,058 bytes.
- Original screen recording: WebM, VP9 video, 1920×1080, 25 fps, 135.520 seconds, 19,602,128 bytes, no audio track.
- Final buyer-demo MP4: MP4, H.264 video, 1920×1080, 30 fps, 144.533 seconds, 3,574,095 bytes, no audio track.
- FFprobe completed for all available media.
- FFmpeg full decoding completed with zero errors for the source, raw recording, and final MP4.

No MP4 or application-exported WebM was produced during the new session, so no export codec or export playback success is claimed for this package.

## Preservation and Git boundary

No application source code, dependencies, configuration, previous recording, or historical report was modified. No Git commit or push was performed for this task. All files in this package are outside the Git repository under `/home/ubuntu/qa-artifacts/final-buyer-demo-2026-11-15/`.
