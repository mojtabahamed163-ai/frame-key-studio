import type { CaptionCue } from "../types";
import { formatSrtTime, formatVttTime, toSrt, toVtt } from "./clip-analysis";

function parseTimestamp(value: string): number | null {
  const parts = value.trim().replace(",", ".").split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  const lastParts = parts[parts.length - 1].split(".");
  const seconds = Number(lastParts[0]);
  const millis = Number((lastParts[1] ?? "0").padEnd(3, "0").slice(0, 3));
  const minutes = Number(parts[parts.length - 2]);
  const hours = parts.length === 3 ? Number(parts[0]) : 0;
  if (![seconds, millis, minutes, hours].every(Number.isFinite)) return null;
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

export function parseSubtitleFile(content: string): CaptionCue[] {
  const normalized = content.replace(/^\uFEFF/, "").replace(/\r/g, "").trim();
  const blocks = normalized.replace(/^WEBVTT[^\n]*\n+/i, "").split(/\n\s*\n/);
  const cues: CaptionCue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex < 0) continue;
    const [startText, endText] = lines[timingIndex].split("-->").map((value) => value.trim().split(/\s+/)[0]);
    const start = parseTimestamp(startText);
    const end = parseTimestamp(endText);
    const text = lines.slice(timingIndex + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    if (start == null || end == null || end <= start || !text) continue;
    cues.push({ id: `imported-${cues.length}-${Math.round(start * 1000)}`, start, end, text, words: [] });
  }
  if (!cues.length) throw new Error("No valid SRT/VTT caption cues were found in this file.");
  return cues.sort((a, b) => a.start - b.start);
}

export function exportSrt(cues: CaptionCue[]): string { return toSrt(cues); }
export function exportVtt(cues: CaptionCue[]): string { return toVtt(cues); }
export { formatSrtTime, formatVttTime };
