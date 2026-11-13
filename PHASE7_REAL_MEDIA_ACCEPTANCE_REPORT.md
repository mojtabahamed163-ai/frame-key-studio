# Phase 7 — Real Media Acceptance Test

**Date:** 2026-11-13  
**Repository commit tested:** `faf9e370ad9f0ac0e3910618b08bfb29f635e99c`  
**Test mode:** local Vite app through the real browser UI; no mock transcript and no imported SRT/VTT

## Result

The additional real-media integration test passed for the requested Whisper and export paths. A real human speech recording was downloaded from Wikimedia Commons, converted only into a short local test excerpt, uploaded through the Studio UI, transcribed by the browser worker using Whisper Base English, turned into an editable clip, rendered by the browser export pipeline, downloaded, and inspected with `ffprobe`.

The source is President John F. Kennedy's Rice University speech. Wikimedia Commons identifies the recording as NASA material and marks it public domain in the United States; the JFK Library independently describes the same NASA coverage and lists its copyright status as public domain. [1] [2]

## Source media

The original source file was:

```text
https://upload.wikimedia.org/wikipedia/commons/1/16/President_Kennedy%27s_Speech_at_Rice_University.ogv
```

The Commons page reports an 18-minute-15-second recording at 640×480. The local test excerpt was cut from the real recording at approximately 00:45 for 12 seconds, preserving real human video and speech audio:

```text
/home/ubuntu/acceptance/phase7/source/kennedy-rice-12s.mp4
```

The excerpt metadata was verified before upload:

```text
video: H.264, 640×480, approximately 12 seconds
 audio: AAC, 44.1 kHz, stereo
size: 2,511,537 bytes
```

No reference transcript or subtitle file was supplied to the Studio. The test used the video's own audio as the only transcription input.

## Whisper browser test

The file was uploaded in the Studio UI and displayed as `kennedy-rice-12s.mp4`, 640×480, with audio detected. The Speech language control was set to **English**, and the workflow was left on **Transcribe only**.

The UI loaded the local speech model and completed analysis. It reached the Pick moments step and reported **24 timed words** in the full transcript. The visible transcript began:

> “I am delighted to be here, and I'm particularly delighted to be here on this occasion. We meet at a college, noted for knowledge,”

The transcript remained local and editable. Because the short excerpt did not produce a self-contained candidate according to the editor's sentence/segment rules, the UI correctly displayed no automatic suggestions and offered **Add manual clip**. A manual 12-second clip was created for the export portion of the acceptance test.

## Export browser test

Before export, the UI was set to the lighter **720 × 1280** output profile. The source-aware export logic correctly limited the actual canvas to the source height rather than upscaling the 640×480 source. The Studio displayed:

```text
9:16 output: 270 × 480 · 30 fps
format: WebM
```

The clip was rendered locally with captions enabled. The UI reported the file ready at 4.6 MB, and the Save file action downloaded:

```text
/home/ubuntu/Downloads/Property-cut-1.webm
```

The downloaded file was independently inspected:

```json
{
  "video": {
    "codec": "vp9",
    "width": 270,
    "height": 480,
    "frame_rate": "30/1"
  },
  "audio": {
    "codec": "opus",
    "sample_rate": "48000",
    "channels": 2
  },
  "duration_seconds": 12.032,
  "size_bytes": 4776759
}
```

A frame extracted at five seconds was visually inspected at:

```text
/home/ubuntu/acceptance/phase7/final/export-frame.png
```

The frame shows the real speaker in a 9:16 crop and the Whisper-derived caption rendered visibly over the video. The output contains both a video and an audio stream, confirming that the export path did not silently drop the original speech audio.

## Acceptance conclusion

The requested additional test confirms that the current application can process a real human video through the browser-local path: local source ingest, actual Whisper model loading, timed speech transcription, editable clip creation, portrait rendering, caption burning, audio preservation, file download, and post-export media inspection all completed successfully.

This test intentionally used the available 640×480 source, so it validates source-aware low-resolution behavior rather than 720p/1080p quality. The result was not upscaled: it was exported at 270×480. A separate 720p/1080p acceptance run would be needed to measure higher-resolution output quality, bitrate behavior, or perceptual metrics such as PSNR/SSIM.

Translation was not part of this additional request and was not claimed here. No code change was required after the test; the test confirms the already-pushed implementation at commit `faf9e370ad9f0ac0e3910618b08bfb29f635e99c`.

## References

[1]: https://commons.wikimedia.org/wiki/File:President_Kennedy%27s_Speech_at_Rice_University.ogv "Wikimedia Commons file page and public-domain metadata"
[2]: https://www.jfklibrary.org/learn/about-jfk/historic-speeches/address-at-rice-university-on-the-nations-space-effort "JFK Library historic speech record and public-domain status"
