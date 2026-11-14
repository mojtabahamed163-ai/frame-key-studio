# Task 3 — Stage 3 evidence: caption modes, persistence, and export

Date: 2026-11-14

## Same real-video project

All checks used the same locally saved Wikimedia Commons recording documented in [stage 1](./task3-stage1-video-and-whisper.md): **Raw Video: President Obama in Omaha**, real natural English speech, 325.291 seconds (5:25), 1280×720 VP8/Vorbis, public domain. Whisper and OPUS-MT ran locally in the browser; no prepared subtitle file was supplied.

## Caption processing modes

After reopening `obama-human-test` from the browser's Saved projects, the project retained the 778-word Whisper draft, the selected 0:53–1:17 clip, and 13 Arabic translated lines. The mode was changed and the preview reopened repeatedly:

1. **Transcription only** — the source preview showed `So what,` and the editor reported `Output track: transcription only`. No Arabic line appeared in the preview or editable caption list.
2. **Translation only** — the preview showed `لذا ما الذي`; the editor reported `Output track: one translation only`. The editable list contained the 13 Arabic cues and no English source cue.
3. **Transcription + translation** — the preview showed English first (`So what,`) and Arabic beneath it (`لذا ما الذي`), and the editor reported `Output tracks: transcription first, then one translation beneath it`. Both tracks retained matching 13-line timing.

The mode changes were persisted locally and survived navigation between Add source, Pick moments, Refine edit, and Export. The source and translated tracks remained separate; changing the mode did not delete or mutate either saved track.

## Actual export

From the dual English+Arabic state, the first selected clip was encoded by the application's own export path and saved from the UI. The output was not a mock file:

- File: `So-what-anything-on-your-mind-that-I-should-know-about.webm`.
- Browser-reported size: 11 MB; filesystem size: 12,001,157 bytes.
- `ffprobe`: 23.685 seconds, VP9 video, 405×720, 30/1 fps, Opus stereo audio at 48 kHz.
- `ffmpeg` decoded six frames at four-second intervals without errors.
- The contact sheet showed real source imagery at multiple times, with English above Arabic, connected Arabic glyphs, correct RTL order, and no opaque caption rectangle hiding the video. The final sampled frames retained the captions and showed no dropped last line in the exported range.

The 405×720 profile is the app's demonstrated WebM export profile for the portrait crop; this evidence does not claim MP4 support.

## Language evidence carried forward

OPUS-MT was run on Whisper-produced English text for Arabic (130 lines in the full run and 13 in the selected clip), French (13), Spanish (13), and German (13). English used the direct-copy path as specified by the UI. Reviewed samples included `So what,` → `لذا ما الذي`, `Et alors ?`, `¿Y qué?`, and `Na und?`. These are machine translations requiring human review; no perfect-accuracy claim is made.

## Remaining limitations

Whisper's honest review warnings remain visible for out-of-window timestamps, audio after the last accepted word, an implausibly long timestamp excluded for review, and disagreement at overlapping window boundaries. The generated draft and translations remain editable and should be reviewed before publication. Export evidence covers WebM/VP9+Opus in the tested browser; other containers/codecs and platform upload acceptance were not claimed.
