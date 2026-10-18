#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-$ROOT_DIR/e2e/.fixtures}"
mkdir -p "$OUT_DIR"

ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "color=c=0x203a31:s=640x360:r=30:d=2" \
  -f lavfi -i "sine=frequency=880:sample_rate=48000:duration=2" \
  -shortest -c:v libx264 -pix_fmt yuv420p -profile:v baseline -c:a aac -movflags +faststart \
  "$OUT_DIR/valid-horizontal.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "color=c=0xc9794b:s=2048x1152:r=1:d=1" \
  -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
  "$OUT_DIR/too-large-dimension.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "color=c=0x203a31:s=320x180:r=1:d=1801" \
  -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
  "$OUT_DIR/too-long.mp4"

if [[ ! -f "$OUT_DIR/max-supported-1080p-30m.mp4" ]]; then
  ffmpeg -hide_banner -loglevel error -y \
    -f lavfi -i "color=c=0x203a31:s=1920x1080:r=1:d=1800" \
    -f lavfi -i "sine=frequency=440:sample_rate=48000:duration=1800" \
    -shortest -c:v libx264 -preset ultrafast -crf 35 -pix_fmt yuv420p \
    -c:a aac -b:a 48k -movflags +faststart \
    "$OUT_DIR/max-supported-1080p-30m.mp4"
fi

printf 'not a video\n' > "$OUT_DIR/not-a-video.txt"
cat > "$OUT_DIR/captions.srt" <<'SRT'
1
00:00:00,000 --> 00:00:02,000
Frame and key local test.

2
00:00:02,000 --> 00:00:04,000
Portrait export with captions.
SRT

ffprobe -v error -show_entries format=duration -show_streams -of json "$OUT_DIR/valid-horizontal.mp4" > "$OUT_DIR/valid-horizontal.ffprobe.json"
ffprobe -v error -show_entries format=duration -show_streams -of json "$OUT_DIR/too-large-dimension.mp4" > "$OUT_DIR/too-large-dimension.ffprobe.json"
ffprobe -v error -show_entries format=duration -show_streams -of json "$OUT_DIR/too-long.mp4" > "$OUT_DIR/too-long.ffprobe.json"
ffprobe -v error -show_entries format=duration -show_streams -of json "$OUT_DIR/max-supported-1080p-30m.mp4" > "$OUT_DIR/max-supported-1080p-30m.ffprobe.json"
