# Demo and Media Verification Report

Date: 2026-11-16

All previously supplied media measurements remain preserved in `REPORTS/FFPROBE_REPORT.txt`, hashes remain in `REPORTS/SHA256SUMS.txt`, and older decode/frame evidence remains in `../VERIFICATION/`. New measurements and frame evidence for this delivery are appended below and in the same verification directory.

## New continuous buyer demonstrations

## Cursor-visibility enhancement

`DEMO/Frame-and-Key-Studio-Complete-Buyer-Demo-Cursor-Enhanced.mp4` is H.264, 1920×1080 at 25 fps, 300.920 seconds, video-only/silent. Full FFmpeg decode completed successfully. A small halo emphasizes the pointer visible in the source, and five brief callouts align to visible UI-state changes. The capture does not provide reliable cursor movement/click telemetry, so no unsupported movement or exact click location is represented. See `REPORTS/CURSOR_ENHANCEMENT_NOTES.md` for timestamps and scope.

The original MP4 remains unchanged at `DEMO/Backup/Original-Complete-Buyer-Demo-UNCHANGED.mp4`; its SHA-256 matches the source MP4: `69c2906303d5ec4630987b9583cd14ec36ed73f4da68e19a31f0849af78c6120`. The enhanced output SHA-256 is `f06fb41cefa8c31d32e65f52b909179179a063a5f2944f22562be09450080d4c`.

The root-level recording `DEMO/Frame-and-Key-Studio-Complete-Buyer-Demo.mp4` is 300.920 seconds (5:00.920), H.264/yuv420p, 1920×1080 at 25 fps, 18,823,088 bytes. FFprobe reports a single video stream and no audio stream; full FFmpeg decode returned exit code 0. Its SHA-256 is `69c2906303d5ec4630987b9583cd14ec36ed73f4da68e19a31f0849af78c6120`.

The visually verified, buyer-preferred retake `DEMO/Visual-Retake/Frame-and-Key-Studio-Complete-Buyer-Demo.mp4` is 313.040 seconds (5:13.040), H.264/yuv420p, 1920×1080 at 25 fps, 19,570,523 bytes. FFprobe reports a single video stream and no audio stream; full FFmpeg decode returned exit code 0. Its SHA-256 is `2caad9b7275618a53c5cb9bbf28b17816ac454d0e8844d1c18c41f72c4d4868b`.

Both recordings are one continuous capture of the actual local Studio application in Chromium. They show import of the preserved 6:54 source, duration/resolution, the local Whisper run (625 timed words), transcript and generated suggestions, opening a suggested clip, a 9:16 portrait editor, a caption edit, navigation away and reopening with the edit preserved, English speech and Spanish target settings, local translation, and the application-generated export. The preferred retake additionally keeps the portrait preview visible on screen when `Sin embargo,` is shown. Its representative start, middle, and end frames are `VERIFICATION/frames/Visual-Retake/start.png`, `middle.png`, and `end.png`; the middle frame visibly shows the translated phrase over the 9:16 canvas, and the end frame shows the exported WebM's local path in Chromium.

The new application export is a selected 28.989-second WebM at 608×1080/30 fps, VP9 video + Opus stereo 48 kHz, 15,976,653 bytes. FFmpeg full decode returned exit code 0. The extracted `VERIFICATION/frames/Visual-Retake/export-spanish-caption.png` visibly shows the Spanish caption `Sin embargo,` in the exported clip. The files named `Frame-and-Key-Studio-Complete-Demo-Translated-ES-Export.webm`, `...-Export-Retake.webm`, and `...-Export-Visual-Retake.webm` are byte-identical app-generated exports with the same SHA-256.

The original source remains `SOURCE/Frame-and-Key-Studio-Original-Source.webm`: 414.502 seconds (6:54.502), 1920×1080/25 fps, VP8 video + Vorbis stereo audio. The prior source-language-caption export, bilingual Arabic export, and Spanish export are also retained and independently checked; the historical Spanish inspection frame visibly contains English `However,` with Spanish `Sin embargo,` below it.

## Audio limitation

The source and historical/new application exports carry audio where FFprobe reports it, but the two new screen-recording MP4s are video-only and silent. No usable system-audio capture device was available in the sandbox, so no narration or fabricated audio was added.

## Historical recording status

The requested original 70-second screen recording was not found in the repository, Git history, or inspected sandbox filesystem. `DEMO/70-Second-Recording.NOT_FOUND.txt` remains in place. Neither new recording is labeled as that original file. The earlier genuine 2:15.520 and 2:22.960 screen recordings and the edited historical buyer-demo MP4 remain preserved; the edited MP4 is not presented as an application export.
