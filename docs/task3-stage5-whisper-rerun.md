# Task 3 — Stage 5 evidence: post-fix real Whisper rerun

Date: 2026-11-14

## Source and path

The same real human recording from Stage 1 was loaded through the Studio UI:

- Title: **Raw Video: President Obama in Omaha**
- Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Raw_Video-_President_Obama_in_Omaha.webm
- Direct file: https://upload.wikimedia.org/wikipedia/commons/e/ec/Raw_Video-_President_Obama_in_Omaha.webm
- Duration: 325.291 seconds (5:25)
- Video: VP8, 1280×720
- Audio: Vorbis, stereo, 44.1 kHz
- License: public domain as documented by the Wikimedia Commons source page

The local browser run used the actual video audio as its only speech input. No SRT/VTT file, prepared transcript, synthetic voice, or external transcription was supplied.

## Result

The browser worker completed the full `Xenova/whisper-base.en` run after the latest caption-state fixes. The Studio reported:

- **833 timed words** retained in the full transcript.
- **3 clip suggestions** created from the timed speech.
- English captions kept as the Whisper output; no translation model was invoked during this English-target rerun.
- The selected suggestion shown in the UI was approximately 00:53–01:17 and contained the question beginning `So what, anything on your mind that I should know about?`

The result remained editable and was explicitly labelled as machine-generated draft text requiring a listen-through before publishing.

## Warnings retained by the UI

The application surfaced the existing review warnings instead of silently treating the output as ground truth:

- Some model timestamps fell outside the decoded audio window and were reviewed.
- Audio continued after the last accepted word and the final seconds were rechecked locally.
- An implausibly long word timestamp was excluded for review.
- Overlapping audio windows disagreed near a boundary.

These warnings are evidence that the completed run passed through the real validation path. They are not a claim that every word is correct.

## Acceptance

Stage 5 confirms that the current `main` build can ingest the documented human recording, run local Whisper against its real audio, preserve a timed editable transcript, create candidate moments, and retain honest review warnings after the latest asynchronous caption fixes.
