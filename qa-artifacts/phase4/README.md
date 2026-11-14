# Phase 4 — QA proof artifacts

These files document the live Studio export and are retained for visual regression review.

- `dual-caption-export.webm`: output downloaded from the Studio export UI.
- `frame-t1-no-caption.png`: extracted at 1 second, before the imported test cue begins.
- `frame-t4-dual-caption.png`: extracted at 4 seconds, while both caption tracks are active.
- `dual-caption-test.srt`: the synthetic SRT fixture imported for the layout test.

The source video is the repository sample `deliverables/mission2/candidates/clip-1.webm`. The SRT wording is deliberately synthetic and is not a transcript of the source audio. Arabic is the output of the local English-to-Arabic OPUS-MT model in this test. These artifacts validate caption ordering, line layout, timing and export encoding only; they do **not** validate transcript accuracy or translation quality.

Export inspection with `ffprobe`: WebM, VP9 video, Opus stereo audio at 48 kHz, 405×720, 30 fps, 23.667 seconds, 11,208,872 bytes. No caption is visible at 1 second; at 4 seconds the English source appears above the Arabic line, with Arabic wrapping to two lines.
