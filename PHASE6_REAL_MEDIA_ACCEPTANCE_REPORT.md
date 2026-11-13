# Phase 6 Real Human Media Acceptance Report — Frame & Key Studio

**Date:** 2026-11-13  
**Repository:** https://github.com/mojtabahamed163-ai/frame-key-studio  
**Branch:** `main`  
**Test mode:** local Vite preview exercised through the real browser UI and DOM events; no mock transcription or translation service was used.

## Executive result

Phase 6 completed a real-media acceptance run using a licensed human speech recording. The workflow was executed end to end:

1. A public-domain Wikimedia Commons recording of President Kennedy's Rice University speech was downloaded together with its reference English transcript.
2. A 100-second MP4 excerpt containing the original human video and audio was uploaded through the Studio UI.
3. Whisper Base English ran locally in the browser and produced timed English captions from the actual speech.
4. The timed Whisper output was translated locally with OPUS-MT into Arabic, French, Spanish, and German. All four language runs produced non-empty translated caption lines while retaining the source cue timings.
5. The Arabic result was rendered into a 1080×1920 portrait WebM with the original audio, VP9 video, Opus audio, title overlay, and RTL Arabic captions.
6. The final WebM was downloaded from the live UI, inspected with `ffprobe`, and a frame was extracted for visual inspection.

No source media, downloaded model files, or large generated video was added to Git. Only this acceptance report is committed.

## Human source and ground truth

Source: Wikimedia Commons, “President Kennedy's Speech at Rice University” (`File:President Kennedy's Speech at Rice University.ogv`). The Commons page was checked before download; the recording is public-domain material. The repository does not redistribute the source media.

Local test files used outside the repository:

```text
/home/ubuntu/acceptance/phase6/source/kennedy-rice-full.ogv
/home/ubuntu/acceptance/phase6/source/kennedy-rice-100s.mp4
/home/ubuntu/acceptance/phase6/source/kennedy-rice.en.srt
/home/ubuntu/acceptance/phase6/final/kennedy-arabic-final.webm
/home/ubuntu/acceptance/phase6/final/kennedy-arabic-frame.png
```

The MP4 excerpt was cut from the human recording with FFmpeg while preserving the speech audio. The reference transcript was taken from the source-provided English SRT and aligned to the excerpt boundary. No TTS, `espeak`, generated speech, or artificial transcript was used.

## Whisper acceptance

The actual browser run used the UI's **Whisper Base English** option. The Studio reported a complete timed transcript of **195 timed words** and generated two editable candidate clips from that transcript:

| Candidate | Time range in the excerpt | Whisper-derived text |
|---|---:|---|
| 1 | 0:05–0:27 | “Congressman Thomas, Senator Wiley and Congressman Miller, Mr. Webb, Mr. Bell, scientists, distinguished guests, ladies and gentlemen…” |
| 2 | 0:45–0:55 | “For we meet in an hour of change and challenge, in a decade of hope and fear, in an age of knowledge and ignorance.” |

The first candidate was inspected in the UI but was not used for the final export because its Whisper segmentation split names and short fragments into unusually small cues. The second candidate was used for translation and export because its three timed cues form a coherent sentence while remaining directly sourced from Whisper output.

### WER result

WER was calculated after lowercasing and removing punctuation, using the licensed source transcript as reference and the full Whisper UI transcript as hypothesis. The excerpt-boundary comparison produced:

```text
reference words: 199
hypothesis words: 194
substitutions:    3
deletions:        6
insertions:       1
WER:              5.03%
```

The detailed calculation and edit examples are preserved outside the repository at:

```text
/home/ubuntu/acceptance/phase6/wer-results.json
/home/ubuntu/acceptance/phase6/calculate_wer.py
```

The principal differences were proper-name/intro omissions and a few lexical substitutions, including `I'm`/`I am`, `in`/`at`, and `outstrip`/`outstripped`. This is a measured result against the source transcript, not a claim that the model output is publication-ready without review.

## Local translation acceptance

The same three timed Whisper captions were translated from English in the browser. Each language loaded its local OPUS-MT model and produced actual text while preserving the source cue ranges.

| Target | Example output observed | Result |
|---|---|---|
| Arabic | `لأننا نجتمع في ساعة من التغيير والتحدي، في` / `عقد من الأمل والخوف، في عصر` / `المعرفة والجهل.` | Pass; RTL text displayed in the editor and preview |
| French | `Car nous nous réunissons dans une heure de changement et de défi, dans` / `une décennie d'espoir et de peur, à une époque` / `connaissance et ignorance.` | Pass |
| Spanish | `Para que nos encontremos en una hora de cambio y desafío, en` / `una década de esperanza y miedo, en una era de` / `conocimiento e ignorancia.` | Pass |
| German | `Denn wir treffen uns in einer Stunde des Wandels und der Herausforderung, in` / `ein Jahrzehnt der Hoffnung und Angst, in einem Alter von` / `Wissen und Unwissenheit.` | Pass |

The UI explicitly labels these translations as phrase-timed to the source and warns that word-level alignment is not inferred. That warning is accurate and remains visible for review.

## Final Arabic export

The Arabic version was exported from the live browser UI after selecting the second Whisper candidate. The downloaded file was:

```text
/home/ubuntu/Downloads/For-we-meet-in-an-hour-of-change-and-challenge-in-a-decade-of-hope-and.webm
```

A preserved acceptance copy is available outside the repository at:

```text
/home/ubuntu/acceptance/phase6/final/kennedy-arabic-final.webm
```

### `ffprobe` result

```text
video codec:           vp9
video dimensions:      1080x1920
aspect ratio:          9:16
frame rate:            30/1
audio codec:           opus
sample rate:           48000 Hz
channels:              2
duration:               10.068000 seconds
size:                   11,444,492 bytes
mean audio volume:     -32.6 dB
max audio volume:      -14.5 dB
```

The file contains both a video stream and an audio stream. A frame extracted at five seconds was visually inspected at `/home/ubuntu/acceptance/phase6/final/kennedy-arabic-frame.png`; it shows the human speaker in the portrait crop and Arabic caption text rendered in the video. The Arabic text is visible separately from the title overlay, with no observed title/caption collision.

## Scope and limitations

- Whisper timing and translations are local browser results and remain editable; users should review proper names, meaning, line breaks, and phrase timing before publishing.
- The tested browser environment exposes WebM VP9/Opus rather than MP4 H.264/AAC, consistent with the capability detection already documented in Phase 5.
- The final artifact is intentionally kept outside Git because it is a large generated binary and the source recording is not part of the application repository.
- This phase added acceptance evidence and did not require a new application-code change; the tested Whisper, translation, RTL, export, persistence, and collision behavior is already present in the implementation committed in the preceding phases.
