# Frame & Key — Export diagnosis

Date: 2026-10-14

## Result

The export completed successfully in the current Chromium/Sandbox environment after reloading the application and retrying the same real source file and selected clip.

No fake progress or paid API was introduced.

## Diagnostic evidence

Source file:

- `/home/ubuntu/frame-key-test/blockchain-un.webm`
- 101,590,948 bytes
- VP9 video, 1920×1080, 29.97 fps
- Opus audio, 48 kHz stereo
- Duration: 650.863 seconds

Instrumented export log:

- `Conversion.init:start`
- `Conversion.init:done`: `isValid: true`, `discardedTracks: []`
- `Conversion.execute:start`
- `Conversion.execute:done`: output state `finalized`
- `BufferTarget:done`: `8,671,197` bytes

The successful run took approximately 22 seconds inside `Conversion.execute()` for the 22.12-second clip. The earlier visible 0% state was therefore not evidence that encoding had not started: the UI only receives its first meaningful progress after the conversion setup and Mediabunny progress calculation. The earlier failure could not be reproduced after a clean reload; no rejected promise, WebCodecs incompatibility, memory exhaustion, or discarded track was observed in the successful reproduction.

## Independent output verification

Output file:

- `/home/ubuntu/frame-key-test/exported-clip.webm`
- 8,671,197 bytes
- `ffprobe` format: Matroska/WebM
- Duration: 22.141 seconds
- Encoder tag: Mediabunny v1.61.4

Streams reported by `ffprobe`:

- Video: VP9, 720×1280, 9:16, 30 fps, yuv420p
- Audio: Opus, 48 kHz, 2 channels

An independent frame was extracted with FFmpeg at 1.2 seconds:

- `/home/ubuntu/frame-key-test/exported-frame.png`
- 360×640 PNG
- The burned-in caption `It's new security standard.` is visibly present.

## Code change

Changed file:

- `client/src/features/studio/export/convert-clip.ts`
  - Added phase-level `console.log` diagnostics around peak measurement, `Conversion.init`, `Conversion.execute`, output finalization, and failures.
  - The diagnostics are observational only; encoding, progress calculation, cancellation, output format, and memory behavior were not altered.

## Regression checks

- `pnpm check`: passed
- `pnpm test`: passed previously with 29 tests; the final diagnostic-only edit is type-safe and does not change tested behavior.
- `pnpm build`: passed
- Existing local upload, Whisper analysis, candidate extraction, clip editing, captions, 9:16 settings, and title/audio settings remained usable during the export test.

## Remaining limitation

The earlier 0% hang remains transient and was not reproducible after a clean application reload. The UI can still appear at 0% during the preparation/init window because no meaningful conversion progress has been emitted yet. The new logs make that boundary observable in the browser console. A future UX improvement could expose a dedicated preparation status, but this was not added as part of the targeted diagnosis because it would not fix a demonstrated encoding failure.
