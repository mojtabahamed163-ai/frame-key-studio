# Phase 8 — Visual and Video Quality Report

**Project:** Frame & Key Studio  
**Repository:** https://github.com/mojtabahamed163-ai/frame-key-studio  
**Date:** 2026-11-13  
**Branch:** `main`

## Result

Phase 8 fixes the caption appearance defect and adds a new real-media quality run using a source different from the earlier Kennedy test. Caption timing, transcription segmentation, translation data structures, face-safe placement, templates, Brand Kits, logos, persistence, and export flow were preserved.

## Caption background fix

The old implementation painted `primaryColor` as a rounded rectangle for the `clean` and `bold` caption styles. The `editorial` style was the only style that avoided that panel. This caused both the live preview and Canvas export to hide part of the video behind a dark or colored block.

The fix removes the caption rectangle from Canvas rendering and forces the preview caption background to `transparent` for every caption style. Readability now comes from white or accent glyph color, a thin black glyph stroke, and a restrained black shadow. The stroke and shadow are applied to the letters only; they do not paint a panel or obscure the image. The existing caption position, font, color, word highlighting, Arabic RTL handling, timing, and face-safe placement remain intact.

The default `clean` and `bold` labels now say “Clean text” and “Bold text”, matching the actual appearance. `CAPTION_BACKGROUND = "transparent"` is exported and covered by a regression test so the text-only contract is explicit.

## Files changed

- `client/src/features/studio/export/convert-clip.ts` — removed Canvas caption panels; added glyph stroke/shadow and the transparent-background constant.
- `client/src/features/studio/components/VideoPreview.tsx` — uses the shared transparent caption background.
- `client/src/features/studio/studio.css` — removed preview caption padding/background panels and kept text-only shadow/stroke styling.
- `client/src/features/studio/components/BrandControls.tsx` — renamed style labels to reflect text-only rendering.
- `client/src/features/studio/export/convert-clip.test.ts` — added a regression test for the transparent caption background.
- `PHASE8_VISUAL_AND_VIDEO_QUALITY_REPORT.md` — this report.

## New real human source

The test source was Jason Hickel speaking at the Beyond Growth 2023 Conference. The file is hosted by Wikimedia Commons and identifies GreensEFA as the author. The Commons page records a 1,920×1,080 WebM/VP9/Opus file, 13 minutes 24 seconds long, with an overall bitrate of 1.33 Mbps. The page states that the source was released under CC BY 3.0, with attribution to GreensEFA. [1]

Source page: [Wikimedia Commons — BeyondGrowth 2023 Conference: Jason Hickel](https://commons.wikimedia.org/wiki/File:BeyondGrowth_2023_Conference_-_Jason_Hickel_%28talk_on_degrowth_or_economics_beyond_%27GDP-growth%27%29.webm)  
Source media URL: `https://upload.wikimedia.org/wikipedia/commons/b/b2/BeyondGrowth_2023_Conference_-_Jason_Hickel_%28talk_on_degrowth_or_economics_beyond_%27GDP-growth%27%29.webm`

The source was downloaded and inspected before processing. The local `ffprobe` measurement was:

- Original: 1,920×1,080, VP9 video, Opus audio, 25 fps, 48 kHz stereo, 803.861 seconds, 133,188,669 bytes, 1,325,489 bps overall.
- Test excerpt: 16.640 seconds, 1,920×1,080, VP9/Opus, 25 fps, 2,279,626 bytes.
- Test files were kept outside Git under `/home/ubuntu/acceptance/phase8/`; no test media was committed.

This is a real human conference recording. It is not AI-generated and was not upscaled before the test.

## End-to-end application run

The excerpt was uploaded through the real Studio UI. The application reported `1920 × 1080`, audio detected, and saved the source in browser IndexedDB. The actual local Whisper workflow then ran on the source and completed with 41 timed words and one candidate clip containing five editable caption cues. The application displayed its normal timing-boundary warning for the final model timestamps; no timing logic was changed for this phase.

The live preview was inspected on the selected clip. A DOM/CSS inspection of the active caption element returned:

```text
backgroundColor: rgba(0, 0, 0, 0)
padding: 0px
borderRadius: 0px
textShadow: rgba(0, 0, 0, 0.72) 0px 2px 7px
-webkit-text-stroke: 0.35px rgba(0, 0, 0, 0.78)
```

The preview therefore has no caption panel. The text remains readable over the light conference background, while the speaker's face remains unobstructed in the selected lower caption zone.

## Export and comparison

The selected clip was exported through the real browser-local encoding path, not through a synthetic fixture or a renamed resolution label. The Studio reported a source-aware output of `608 × 1080 · 30 fps` because the 9:16 crop is limited by the 1,080-pixel source height. The resulting file was downloaded from the UI and independently inspected with `ffprobe`.

Output measurements:

- File: `We-re-also-overshooting-five-other-planetary-boundaries-including.webm`
- Size: 9,943,770 bytes (9.5 MB as shown by the UI)
- Duration: 16.307 seconds
- Video: VP9, 608×1,080, 30/1 fps
- Audio: Opus, 48 kHz, 2 channels
- Overall bitrate: 4,878,282 bps
- Audio level: source mean −23.8 dB / peak −6.8 dB; output mean −23.8 dB / peak −6.8 dB

A frame at approximately five seconds was extracted from both the source and the output. The source was also cropped to the same centered 608×1,080 portrait region before comparison. The side-by-side evidence is saved at:

![Source and final frame comparison](/home/ubuntu/acceptance/phase8/final/frames/source-vs-final.png)

The comparison shows stable framing, a clear face, preserved clothing and podium detail, and matching colors. The output adds only the intended caption overlay. No extreme blur, stretched geometry, or excessive audio gain was observed. The output intentionally remains 608×1,080 rather than claiming a 1,080×1,920 detail level that the landscape source cannot supply.

## Caption and translation coverage

The original-language transcription captions were exercised end to end through analysis, preview, and export. The same caption renderer is shared by original and translated cues, and the transparent-background constant is used by the preview while the Canvas renderer applies the same text-only stroke/shadow treatment. Therefore the no-panel behavior applies to all supported translation languages, including Arabic RTL captions, without changing transcription timing or segmentation.

The translation model itself was not re-downloaded for this phase because the requested visual change is in the shared caption renderer, not the translation worker. The existing translation tests and language-specific data paths remained unchanged; the regression test protects the renderer contract used by both source and translated cues.

## Automated checks

All requested commands completed successfully:

- `pnpm check` — PASS
- `pnpm test -- --run` — PASS, 15 test files / 99 tests
- `pnpm build` — PASS
- `pnpm audit --prod` — PASS, no known vulnerabilities
- `git diff --check` — PASS

The build retains the existing non-blocking Vite warning about `/api/platform/config.js` lacking `type="module"`, and the existing large-chunk advisory. Neither is in the caption or media encoding path.

## Remaining limitations

The tested browser selected WebM VP9/Opus because that is the available WebCodecs combination in this environment. MP4 remains capability-gated. The source is 16:9, so a portrait export necessarily uses a 608×1,080 crop at the source-limited height; this preserves real source detail and does not manufacture 1,920-pixel information. The local translation models remain English-source models as documented by the application. Face tracking is a crop-safety helper, not speaker identification.

## References

[1]: https://commons.wikimedia.org/wiki/File:BeyondGrowth_2023_Conference_-_Jason_Hickel_%28talk_on_degrowth_or_economics_beyond_%27GDP-growth%27%29.webm "Wikimedia Commons source page, metadata, author and CC BY 3.0 license"
