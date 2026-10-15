# Frame & Key — Export quality diagnosis

Date: 2026-10-15

## Executive result

The export pipeline remained stable. I inspected the source, the implementation, and real exported files before changing anything.

The main quality constraint is not an accidentally low-resolution proxy. The source is a 1920×1080 VP9 recording with an average container bitrate of about 1.25 Mbps, and the portrait workflow crops a 608×1080 region from that source before fitting it into a 9:16 canvas. At 720×1280 the crop is downscaled; at 1080×1920 the same source crop is necessarily upscaled. Raising resolution cannot recreate detail that is absent from the cropped source.

The previous 720p video profile used a 4 Mbps target. I increased this conservatively to 6 Mbps for 720p and 12 Mbps for 1080p. This provides more compression headroom while preserving the existing browser-only VP9/Opus pipeline, captions, timing, crop logic, cancellation, and download behavior.

This change measurably increased the encoded file bitrate and size. However, frame-by-frame visual inspection showed that the 4 Mbps and 6 Mbps 720p frames are very similar; therefore I do not claim a dramatic visible improvement. The source quality and portrait crop remain the dominant limits.

## Code inspection findings

`client/src/features/studio/export/convert-clip.ts` uses the original `File` through Mediabunny `BlobSource`; it does not use a preview or proxy. The video path explicitly sets `copy: false`, decodes the source, crops with `cropForPortrait`, draws to the target canvas, burns captions/title graphics, and encodes with WebM VP9 or MP4 AVC depending on browser support. The frame rate remains 30 fps.

The prior encoder targets were 4,000,000 bps for 720p and 8,000,000 bps for 1080p. The canvas and crop dimensions were already correct for 9:16 output. No unnecessary intermediate video file was found.

## Exact changes

- `client/src/features/studio/export/convert-clip.ts`
  - Added the shared `videoBitrateForHeight()` profile.
  - Changed the target from 4 Mbps to 6 Mbps at 720×1280.
  - Changed the target from 8 Mbps to 12 Mbps at 1080×1920.
  - Reused the same profile for WebCodecs capability detection and the in-memory size estimate.
  - Existing diagnostic phase logs remain observational only.

- `client/src/pages/Studio.tsx`
  - Reused the shared bitrate profile when estimating batch ZIP size, preventing the UI estimate from becoming stale after the quality change.

- `client/src/features/studio/export/convert-clip.test.ts`
  - Added a regression test for the 6 Mbps and 12 Mbps profiles.

## Real export evidence

The same real source file and the same selected 22.12-second clip were exported before and after the 720p bitrate change.

| File | Resolution | FPS | Codec | Duration | Size | Container bitrate |
|---|---:|---:|---|---:|---:|---:|
| `exported-clip-baseline-4mbps.webm` | 720×1280 | 30 | VP9 + Opus | 22.141 s | 8,671,197 B | 3,133,082 bps |
| `exported-clip-high-bitrate.webm` | 720×1280 | 30 | VP9 + Opus | 22.141 s | 10,917,453 B | 3,944,700 bps |
| `exported-clip-1080-high-bitrate.webm` | 1080×1920 | 30 | VP9 + Opus | 22.141 s | 20,218,110 B | 7,305,220 bps |

The output files contain both picture and audio. The 1080p file reports VP9 video, Opus audio at 48 kHz stereo, 1080×1920, and 30 fps.

The 720p baseline and higher-bitrate files were compared with FFmpeg's SSIM filter across the encoded image sequences. The final-frame SSIM was approximately 0.9985, and representative frames were visually almost identical. This supports an honest conclusion: the bitrate increase adds encoding headroom and reduces the risk of unnecessary compression, but it does not restore detail lost to the source recording and portrait crop.

Representative frame files:

- `/home/ubuntu/frame-key-test/baseline-frame.png`
- `/home/ubuntu/frame-key-test/high-frame.png`
- `/home/ubuntu/frame-key-test/frame-1080.png`

All three frames show the expected portrait crop and readable burned-in caption.

## Validation

- `pnpm check`: passed
- `pnpm test`: passed — 30 tests
- `pnpm build`: passed
- 720p export completed in Chromium/Sandbox and was independently checked with `ffprobe`.
- 1080p export completed in Chromium/Sandbox and was independently checked with `ffprobe`.
- Both output sizes are non-empty and include video plus audio.
- Captions remain readable and correctly positioned.
- No unexpected crop, timing change, audio loss, or download regression was observed.

## Remaining limitations

The source recording itself is relatively compressed and the 16:9-to-9:16 conversion discards most horizontal pixels. The 1080×1920 mode is therefore a higher-resolution delivery canvas, not a recovery of missing source detail. On constrained devices, 720×1280 remains the practical option and now uses a 6 Mbps target with a correspondingly larger memory estimate.
