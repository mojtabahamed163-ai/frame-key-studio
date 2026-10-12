# Media pipeline

All video and audio inputs originate from the user's local `File` object. Do not post video/audio bytes, frame images, generated captions, or transcripts to `/api` or object storage. `analyze-video.ts` uses Mediabunny for local metadata/audio samples and streams 30-second mono windows to the Whisper worker. The only outbound model requests are explicit downloads of public, open-weight model files.

Outputs use Mediabunny `Conversion` to transcode only the selected segment, draw portrait framing/captions/optional brand mark to a canvas and write MP4 when H.264/AAC encoding is supported. File System Access streaming is preferred for large outputs. Where unavailable, use an in-memory fallback only for small files and warn before large exports. Include `THIRD_PARTY_NOTICES.md` attribution in any distributed build.
