# Demo and Media Verification Report

Date: 2026-11-16

All media present in `DEMO/`, `EXPORTS/`, and `SOURCE/` was checked with `ffprobe`, full video decode through FFmpeg, representative-frame extraction, and SHA-256 calculation. Raw command output is in `FFPROBE_REPORT.txt`; hashes are in `SHA256SUMS.txt`; per-file decode stderr files and PNG frames are under `../VERIFICATION/`.

The 2:15.520 WebM and 2:22.960 WebM are valid video-only screen recordings. The edited buyer-demo MP4 is valid video-only H.264. The original source is a valid 6:54.502 WebM with VP8/Vorbis. The source-language-caption export, bilingual Arabic export, and newly recreated Spanish export are valid portrait WebM files. The Spanish inspection frame visibly contains the English source caption `However,` and the translated caption `Sin embargo,`.

The Spanish export was recreated through the real local Studio workflow from the preserved source: Whisper produced 625 timed words, local OPUS-MT English→Spanish completed for 110 timed caption lines, and the selected 28.989-second clip was rendered and downloaded from the browser. It is independently verified below with FFprobe, FFmpeg decode, SHA-256, and an extracted frame.

Audio limitation: the screen recordings and edited screen-demo MP4 have no audio stream. The source and historical application exports do contain audio where reported by FFprobe. The screen recording should therefore be described as silent.

===== Spanish export visual verification =====
file=BUYER_DELIVERY/VERIFICATION/frames/Frame_and_Key_Studio_Translated_ES_Export.png
observation=Extracted frame visibly shows source caption "However," and Spanish caption "Sin embargo,".
