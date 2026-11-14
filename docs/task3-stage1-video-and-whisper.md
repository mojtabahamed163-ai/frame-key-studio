# Task 3 — Stage 1 evidence: real test video and Whisper

Date: 2026-11-14

## Test video

- Title: **Raw Video: President Obama in Omaha**
- Wikimedia Commons source page: https://commons.wikimedia.org/wiki/File:Raw_Video-_President_Obama_in_Omaha.webm
- Direct file used in the app: https://upload.wikimedia.org/wikipedia/commons/e/ec/Raw_Video-_President_Obama_in_Omaha.webm
- Original source credited by Wikimedia: The White House YouTube upload, https://www.youtube.com/watch?v=nzbzSbfgQjg
- Content: a real recorded conversation with natural human English speech; not AI-generated and not TTS.
- License: public domain as a work made by an employee of the U.S. Executive Office of the President as part of official duties, as stated on the Wikimedia Commons file page.
- Media facts verified with `ffprobe`: 325.291 seconds (5:25), 1280×720, VP8 video, Vorbis stereo audio at 44.1 kHz, 62,831,446 bytes.

## Practical Whisper run

The exact original WebM was loaded into the local Studio and persisted in the browser's IndexedDB. The application ran its local `Xenova/whisper-base.en` worker against the video's audio; no prepared SRT/VTT or external transcript was supplied. The run completed successfully and produced 445 timed words and three candidate clips. The UI also surfaced the existing honest review warnings: some model timestamps were outside the decoded audio window, an implausibly long timestamp was excluded, and overlapping windows disagreed near a boundary. These warnings are evidence of a completed real run, not a claim that the draft transcript is perfect.

Observed first candidate during the run: `I like what I said about just talking about looking at things that are different. Yeah, And we have the things we need...` (approximately 2:14–2:40). The app displayed the transcript as a machine-generated draft and kept it editable.

## Local evidence

The downloaded source used for the run is intentionally kept outside Git's tracked source files at `qa-artifacts/task3-2026-11-14/obama-human-test.webm` because it is a 60 MB test asset. The report records the source, license, media facts, and actual in-app run so the result is reproducible without committing a large binary.
