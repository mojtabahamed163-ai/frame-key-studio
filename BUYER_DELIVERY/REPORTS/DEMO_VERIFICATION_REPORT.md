# Demo and Media Verification Report

Date: 2026-11-16

All media present in `DEMO/`, `EXPORTS/`, and `SOURCE/` was checked with `ffprobe`, full video decode through FFmpeg, representative-frame extraction, and SHA-256 calculation. Raw command output is in `FFPROBE_REPORT.txt`; hashes are in `SHA256SUMS.txt`; per-file decode stderr files and PNG frames are under `../VERIFICATION/`.

The 2:15.520 WebM and 2:22.960 WebM are valid video-only screen recordings. The edited buyer-demo MP4 is valid video-only H.264. The original source is a valid 6:54.502 WebM with VP8/Vorbis. The source-language-caption export and the bilingual Arabic export are valid portrait WebM files; the latter visibly contains English and Arabic burned captions in the extracted inspection frame.

No Spanish export was found or verified. No claim is made that any available file contains Spanish captions.

Audio limitation: the screen recordings and edited screen-demo MP4 have no audio stream. The source and historical application exports do contain audio where reported by FFprobe. The screen recording should therefore be described as silent.
