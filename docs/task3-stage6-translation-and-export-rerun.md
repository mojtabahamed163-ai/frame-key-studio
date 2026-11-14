# Task 3 — Stage 6 evidence: translation and local export rerun

Date: 2026-11-14

## Translation rerun

Using the completed real Whisper transcript from Stage 5, the selected 24-second clip (approximately 00:53.66–01:17.28) was translated through the Studio UI with the bundled local OPUS-MT path. No server or paid inference API was used.

The same 14 phrase-timed English caption cues were translated successfully into each configured target language. The UI reported `Translated 14 caption lines on this device` after every completed run, retained the original cue timing, and showed the translated first line in the live 9:16 preview:

| Target | First translated preview | UI result |
|---|---|---|
| Arabic | `لذا ما الذي` | 14 timed lines |
| French | `Et alors ?` | 14 timed lines |
| Spanish | `¿Y qué?` | 14 timed lines |
| German | `Na und?` | 14 timed lines |

The English-only path remains available and does not invoke an OPUS-MT model. The UI also keeps the English source track above the translated track and warns that phrase timing follows the source and should be reviewed before publication.

## Local export rerun

The German-targeted state was used for a real local render through the `Render selected + ZIP` control. The UI completed `Finished 1 clips`, marked the selected clip `Ready`, and produced a downloadable ZIP:

- Download: `obama-human-test-clips.zip`
- ZIP size: 11.5 MB
- Rendered clip: `So-what-anything-on-your-mind-that-I-should-know-about.webm`
- WebM size: 12,012,468 bytes
- Duration: 23.647 seconds
- Video: VP9, 405×720, 30 fps
- Audio: Opus, 48 kHz, stereo
- A decoded frame was extracted successfully at 405×720 for visual acceptance.

The final preview displayed the translated subtitle pair (`So what,` / `Na und?`) over the portrait crop. The browser’s direct `showSaveFilePicker` route was also exercised and honestly surfaced its expected user-gesture limitation; the ZIP route completed successfully and is the accepted artifact for this run.

## Acceptance

Stage 6 confirms that the latest build can translate real Whisper cues into all four configured OPUS-MT languages while preserving timing, then render a real captioned portrait WebM locally and package it for download. Export artifacts remain outside the repository because the source media and generated media are QA artifacts, not source-controlled project files.
