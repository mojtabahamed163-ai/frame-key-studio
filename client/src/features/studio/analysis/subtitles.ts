import type { CaptionCue } from "../types";
import { formatSrtTime, formatVttTime, toSrt, toVtt } from "./clip-analysis";

function parseTimestamp(value: string): number | null {
  const timestamp = value.trim();
  const hoursFormat = /^(\d+):([0-5]\d):([0-5]\d)(?:[.,](\d{1,3}))?$/.exec(timestamp);
  const minutesFormat = /^([0-5]?\d):([0-5]\d)(?:[.,](\d{1,3}))?$/.exec(timestamp);
  if (!hoursFormat && !minutesFormat) return null;
  const hours = hoursFormat ? Number(hoursFormat[1]) : 0;
  const minutes = Number(hoursFormat ? hoursFormat[2] : minutesFormat?.[1]);
  const seconds = Number(hoursFormat ? hoursFormat[3] : minutesFormat?.[2]);
  const fraction = hoursFormat?.[4] ?? minutesFormat?.[3] ?? "";
  const fractionalSeconds = fraction ? Number(`0.${fraction}`) : 0;
  const result = hours * 3600 + minutes * 60 + seconds + fractionalSeconds;
  return Number.isFinite(result) ? result : null;
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
