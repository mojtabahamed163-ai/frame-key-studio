# Frame & Key — Portrait framing and quality report

Date: 2026-10-15

## Final conclusion

Two separate causes were confirmed:

1. **Framing risk:** converting a 16:9 source to 9:16 necessarily removes most horizontal pixels. A fixed center crop can miss a moving subject. The project already had an optional local face-tracking path; I improved its motion stability and preserved the manual horizontal crop fallback.
2. **Softness:** the source is already compressed and the portrait crop contains only about 608×1080 source pixels for a 1920×1080 input. A 1080×1920 output therefore enlarges that crop by about 1.78×. Increasing output dimensions cannot restore source detail. The existing 720p profile also had a relatively conservative 4 Mbps target; it was raised to 6 Mbps, while 1080p was raised from 8 Mbps to 12 Mbps to reduce unnecessary compression headroom loss.

The final real export completed successfully. The real face detector test did **not** produce reliable detections on this particular video, so the final tested export used the stable manual/center fallback. I do not claim automatic subject tracking succeeded on this clip.

## Implementation changes

### `client/src/features/studio/media/face-tracking.ts`

- Changed MediaPipe Face Detector from the `short` model to the `full` model to better support smaller/distant faces.
- Added `limitSubjectShift()` and applied it between sampled detections to prevent abrupt crop jumps.
- Kept largest-face ranking, confidence scoring, interpolation, framing bounds, and the manual fallback.
- The detector remains local and optional; no paid API or external encoding service was added.

### `client/src/features/studio/export/convert-clip.ts`

- Added `portraitCropQuality()` to calculate source crop dimensions, output dimensions, and whether enlargement is required.
- Kept the original-file path, 9:16 crop, canvas processing, captions, audio, timing, cancellation, VP9/AVC selection, and bitrate profiles.
- The existing bitrate adjustment remains centralized through `videoBitrateForHeight()`:
  - 720×1280: 6 Mbps
  - 1080×1920: 12 Mbps

### `client/src/pages/Studio.tsx`

- Added a quality warning in the edit screen when the selected portrait output enlarges the available source crop.
- The warning explicitly states that a larger output cannot restore missing source detail.
- The existing preview remains the correction surface: the horizontal manual slider is available, and its normalized center is used by both preview and export.

### Tests

- `client/src/features/studio/export/convert-clip.test.ts`: added crop-enlargement and bitrate-profile tests.
- `client/src/features/studio/media/face-tracking.test.ts`: added a test preventing abrupt subject-center jumps.

## Real source and exports

Source:

- `/home/ubuntu/frame-key-test/blockchain-un.webm`
- 1920×1080 VP9, 29.97 fps, Opus audio
- approximately 1.25 Mbps container bitrate

Previous 720p export:

- `/home/ubuntu/frame-key-test/exported-clip-baseline-4mbps.webm`
- 720×1280, 30 fps, VP9 + Opus
- 22.141 seconds, 8,671,197 bytes
- 3,133,082 bps container bitrate

Higher-bitrate 720p export:

- `/home/ubuntu/frame-key-test/exported-clip-high-bitrate.webm`
- 720×1280, 30 fps, VP9 + Opus
- 22.141 seconds, 10,917,453 bytes
- 3,944,700 bps container bitrate

Higher-bitrate 1080p export:

- `/home/ubuntu/frame-key-test/exported-clip-1080-high-bitrate.webm`
- 1080×1920, 30 fps, VP9 + Opus, 48 kHz stereo audio
- 22.141 seconds, 20,218,110 bytes
- 7,305,220 bps container bitrate

Final export after the framing changes:

- `/home/ubuntu/frame-key-test/final-export-after-framing.webm`
- 720×1280, 30 fps, VP9 + Opus
- 22.141 seconds, 10,917,453 bytes
- 3,944,700 bps container bitrate

The final file was independently checked with `ffprobe`, and frames were extracted at 1.0, 11.0, and 21.0 seconds.

## Visual inspection

The final frames are available at:

- `/home/ubuntu/frame-key-test/final-frame-1.0.png`
- `/home/ubuntu/frame-key-test/final-frame-11.0.png`
- `/home/ubuntu/frame-key-test/final-frame-21.0.png`

The speaker remains visible at the beginning, middle, and end. The crop does not jump excessively because the tested fallback is stable. Captions remain readable and positioned inside the portrait frame.

The 4 Mbps versus 6 Mbps 720p comparison showed a higher output bitrate and file size, but representative frames were visually very similar; therefore no dramatic sharpness improvement is claimed. The source compression and the 16:9-to-9:16 crop remain the limiting factors.

## Face-detection test and repair cycle

The first real face-tracking test on the selected 22-second source clip ended with:

> A stable face was not detected in this clip. Manual framing remains available.

This was a genuine detector failure, not a UI or export failure. The first attempted repair changed MediaPipe from the `short` model to the `full` model because the speaker is relatively small in the 1920×1080 frame. The same real clip was tested again, and the full model also failed to produce a stable face track in this browser session. Because this remained unreliable, the application correctly kept auto-framing off and preserved the manual/center fallback instead of applying an unverified crop.

The final export was then rerun after that failure and completed successfully. This confirms that the detector failure does not break export or download.

## Preview/export consistency

The preview and exporter both use the same normalized center values from `faceCenterAt()` and the same 9:16 geometry from `cropForPortrait()`. The preview uses browser `object-fit: cover` and `object-position`; the exporter uses the equivalent source crop drawn onto the encoding canvas. Crop geometry therefore matches. Caption and title rendering are implemented separately in HTML for preview and Canvas for export, so their typography is not pixel-identical, but their placement logic remains aligned.

## Validation

- `pnpm check`: passed
- `pnpm test`: passed — 32 tests
- `pnpm build`: passed
- Real 720p export after final changes: passed
- Real 1080p export: passed
- Independent `ffprobe` checks: passed
- Audio present in final files: passed
- Captions readable in representative frames: passed
- Download path exercised from the actual browser UI: passed

## Remaining limitations

Automatic detection currently identifies faces only, not arbitrary objects. On the tested video, both the short and full local MediaPipe face models failed to produce a stable track, likely because the face is relatively small and the scene is a distant lecture recording. The safe behavior is manual/center fallback, and the UI reports the failure instead of pretending that tracking succeeded.

The warning about enlargement is intentional. 1080×1920 is supported and correctly encoded, but it cannot recover detail lost in the source recording or in the required portrait crop.

## Mode B validation — full landscape preserved

A second real browser export was completed after adding `framingMode`:

- UI mode: **Show full video · studio background**
- The preview showed the full landscape scene inside the 9:16 canvas.
- System save picker was disabled only in the browser test session so the in-memory output could be captured and inspected; the product's normal save path remains unchanged.
- Result: **Ready**, 7.0 MB.
- `ffprobe`: VP9 video `720×1280`, `30/1` fps; Opus audio; duration `22.141 s`; size `7,330,204 bytes`.
- The extracted 10-second frame showed the complete speaker, seated participant, presentation screen and readable caption. No important subject was cropped and the landscape image was not stretched.

The final Full-mode export uses a same-as-source-ratio intermediate canvas centered on a dark portrait studio background. This avoids the browser hang caused by the system save picker and keeps the full-video render reliable on the tested browser.
