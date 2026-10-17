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

printf 'not a video\n' > "$OUT_DIR/not-a-video.txt"

ffprobe -v error -show_entries format=duration -show_streams -of json "$OUT_DIR/valid-horizontal.mp4" > "$OUT_DIR/valid-horizontal.ffprobe.json"
ffprobe -v error -show_entries format=duration -show_streams -of json "$OUT_DIR/too-large-dimension.mp4" > "$OUT_DIR/too-large-dimension.ffprobe.json"
ffprobe -v error -show_entries format=duration -show_streams -of json "$OUT_DIR/too-long.mp4" > "$OUT_DIR/too-long.ffprobe.json"
