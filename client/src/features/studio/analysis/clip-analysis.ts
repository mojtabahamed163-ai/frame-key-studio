import type { CaptionCue, ClipSuggestion, SpeechRange, TranscriptWord } from "../types";

interface Sentence {
  words: TranscriptWord[];
  start: number;
  end: number;
  text: string;
  complete: boolean;
}

const HOOK_TERMS = /\b(why|how|what|when|mistake|truth|secret|never|always|first|best|before|after|because|important|remember|number|cost|price|market|buyer|seller|home|property|real estate)\b/i;
const FILLERS = new Set(["um", "uh", "erm", "you", "know", "like", "so"]);
const TOPIC_TAGS: Array<[RegExp, string]> = [
  [/\b(real estate|realtor|realtors|agent|agents|broker|brokers)\b/i, "realestate"],
  [/\b(property|properties|listing|listings|home|homes)\b/i, "property"],
  [/\b(mortgage|mortgages|interest rate|interest rates)\b/i, "mortgage"],
  [/\b(buyer|buyers|buying|purchase|purchasing)\b/i, "homebuyers"],
  [/\b(seller|sellers|selling|sale)\b/i, "homeselling"],
  [/\b(rent|rental|renting|tenant|tenants)\b/i, "rentals"],
  [/\b(invest|investor|investors|investment)\b/i, "propertyinvestment"],
  [/\b(renovation|renovate|remodel|remodeling)\b/i, "homerenovation"],
  [/\b(interior|design|staging|decor)\b/i, "interiordesign"],
  [/\b(market|markets|pricing|price|prices)\b/i, "housingmarket"],
];

export const WORD_CUE_PREFIX = "word-cue:";

export function joinTranscriptWords(words: TranscriptWord[]): string {
  return words.reduce((text, word, index) => {
    const token = word.text.trim();
    if (!token) return text;
    if (!index || /^[,.;:!?%)\]}]/.test(token) || /^[’']/.test(token)) return text + token;
    if (/[([{\-–—/]$/.test(text)) return text + token;
    return `${text} ${token}`;
  }, "").replace(/\s+/g, " ").trim();
}

function joinWords(words: TranscriptWord[]): string { return joinTranscriptWords(words); }

export function toWordCues(cues: CaptionCue[]): CaptionCue[] {
  return cues.flatMap((cue) => cue.words.length
    ? cue.words.map((word) => ({ id: `${WORD_CUE_PREFIX}${word.id}`, start: word.start, end: word.end, text: word.text, words: [word] }))
    : [cue]);
}

export function sentenceGroups(words: TranscriptWord[]): Sentence[] {
  const ordered = [...words].filter((word) => word.text.trim() && Number.isFinite(word.start) && word.end > word.start)
    .sort((a, b) => a.start - b.start);
  const sentences: Sentence[] = [];
  let current: TranscriptWord[] = [];
  const finish = () => {
    if (!current.length) return;
    const text = joinWords(current);
    if (text) sentences.push({ words: current, start: current[0].start, end: current[current.length - 1].end, text, complete: /[.!?…][\"')\]]?$/.test(current[current.length - 1].text.trim()) });
    current = [];
  };

  for (const word of ordered) {
    const previous = current[current.length - 1];
    const gap = previous ? word.start - previous.end : 0;
    if (previous && gap > 1.35) finish();
    current.push(word);
    if (/[.!?…]["')\]]?$/.test(word.text.trim())) finish();
  }
  finish();
  return sentences;
}

function scoreWindow(sentences: Sentence[], start: number, end: number, text: string): { score: number; reasons: string[] } {
  const duration = end - start;
  const words = text.split(/\s+/).filter(Boolean);
  const reasons: string[] = [];
  let score = 0;
  const durationScore = 3.5 - Math.min(3.5, Math.abs(duration - 28) / 13);
  score += durationScore;
  if (duration >= 12 && duration <= 45) reasons.push("A complete short-form segment (12–45 seconds)");
  if (/[?!]/.test(text)) { score += 1.5; reasons.push("Contains a question or emphatic line"); }
  if (/\b\d+(?:\.\d+)?%?\b/.test(text)) { score += 1.25; reasons.push("Includes a concrete number"); }
  if (HOOK_TERMS.test(text)) { score += 1.1; reasons.push("Opens with a specific topic or useful claim"); }
  if (words.length >= 18 && words.length <= 105) { score += 0.65; reasons.push("Has enough context to stand on its own"); }
  const pauses = sentences.slice(1).map((sentence, index) => sentence.start - sentences[index].end).filter((gap) => gap >= 0.18 && gap <= 1.2);
  if (pauses.length) { score += 0.45; reasons.push("Has a natural speech pause"); }
  const fillerCount = words.filter((word) => FILLERS.has(word.toLowerCase().replace(/[^a-z]/g, ""))).length;
  score -= Math.min(1.2, fillerCount * 0.15);
  return { score, reasons };
}

function makePostCopy(text: string, start: number): Pick<ClipSuggestion, "titleOptions" | "description" | "hashtags" | "callsToAction"> {
    const firstSentence = sentenceGroups(text.split(/\s+/).map((token, i) => ({ id: `${i}`, text: token, start: i, end: i + 0.5 })))[0]?.text ?? text;
  const quote = firstSentence.replace(/^[-–—\s]+|[\s]+$/g, "");
  const concise = quote.length > 76 ? `${quote.slice(0, 72).replace(/\s+\S*$/, "")}…` : quote;
  const anchor = concise || `A moment from ${formatClock(start)}`;
  const titleOptions = [
    `“${anchor}”`,
    `The point: ${anchor}`,
    `Worth a closer look: ${anchor}`,
  ];
  const hashtags = TOPIC_TAGS.filter(([pattern]) => pattern.test(text)).map(([, tag]) => `#${tag}`).slice(0, 5);
  const callsToAction = ["What would you add to this conversation?", "Save this for later.", "What is your experience with this?" ];
  return {
    titleOptions,
    description: `${text.trim()}\n\nA short excerpt. Review the transcript before posting.`,
    hashtags,
    callsToAction,
  };
}

function formatClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function suggestClips(words: TranscriptWord[], maxClips = 3): ClipSuggestion[] {
  const sentences = sentenceGroups(words);
  if (!sentences.length) return [];
  const candidates: ClipSuggestion[] = [];

  for (let startIndex = 0; startIndex < sentences.length; startIndex += 1) {
    const group: Sentence[] = [];
    for (let endIndex = startIndex; endIndex < sentences.length; endIndex += 1) {
      const next = sentences[endIndex];
      if (group.length && next.end - group[0].start > 45) break;
      group.push(next);
      if (group.some((sentence) => !sentence.complete)) continue;
      const duration = next.end - group[0].start;
      if (duration < 8 || duration > 45) continue;
      const text = group.map((sentence) => sentence.text).join(" ");
      const { score, reasons } = scoreWindow(group, group[0].start, next.end, text);
      const wordsInClip = group.flatMap((sentence) => sentence.words);
      const copy = makePostCopy(text, group[0].start);
      const hookCandidates = group.slice(0, 3).filter((sentence) => next.end - sentence.start >= 8);
      const hookOptions = hookCandidates.map((sentence) => sentence.text);
      candidates.push({
        id: `clip-${Math.round(group[0].start * 1000)}-${Math.round(next.end * 1000)}`,
        start: group[0].start,
        end: next.end,
        score,
        reasons: reasons.length ? reasons : ["Built from complete sentences in the recording"],
        transcript: text,
        hookOptions,
        hookStartOptions: hookCandidates.map((sentence) => sentence.start),
        selectedHook: hookOptions[0],
        ...copy,
      });
      if (wordsInClip.length > 180) break;
    }
  }

  const ranked = candidates.sort((a, b) => b.score - a.score);
  const selected: ClipSuggestion[] = [];
  for (const candidate of ranked) {
    const overlaps = selected.some((current) => Math.min(current.end, candidate.end) - Math.max(current.start, candidate.start) > Math.min(current.end - current.start, candidate.end - candidate.start) * 0.45);
    if (!overlaps) selected.push(candidate);
    if (selected.length >= maxClips) break;
  }
  return selected.sort((a, b) => a.start - b.start);
}

export function buildCaptionCues(words: TranscriptWord[], maxWords = 12, maxDuration = 4.2): CaptionCue[] {
  const ordered = [...words].sort((a, b) => a.start - b.start);
  const cues: CaptionCue[] = [];
  let group: TranscriptWord[] = [];
  const finish = () => {
    if (!group.length) return;
    cues.push({ id: `cue-${group[0].id}`, start: group[0].start, end: group[group.length - 1].end, text: joinWords(group), words: [...group] });
    group = [];
  };
  for (const word of ordered) {
    const previous = group[group.length - 1];
    const shouldSplit = previous && (
      group.length >= maxWords || word.end - group[0].start > maxDuration || word.start - previous.end > 0.65 || /[.!?]["')\]]?$/.test(previous.text.trim())
    );
    if (shouldSplit) finish();
    group.push(word);
  }
  finish();
  return cues;
}

export function speechKeepRanges(words: TranscriptWord[], start: number, end: number, thresholdSeconds: number, pad = 0.12): SpeechRange[] {
  if (end <= start) return [];
  const ordered = [...words].filter((word) => word.end > start && word.start < end).sort((a, b) => a.start - b.start);
  if (!ordered.length) return [{ start, end }];
  const ranges: SpeechRange[] = [];
  let rangeStart = Math.max(start, ordered[0].start - pad);
  let rangeEnd = Math.min(end, ordered[0].end + pad);
  if (ordered[0].start - start <= thresholdSeconds) rangeStart = start;
  for (let i = 1; i < ordered.length; i += 1) {
    const word = ordered[i];
    const wordStart = Math.max(start, word.start - pad);
    const wordEnd = Math.min(end, word.end + pad);
    if (wordStart - rangeEnd > thresholdSeconds) {
      ranges.push({ start: rangeStart, end: rangeEnd });
      rangeStart = wordStart;
    }
    rangeEnd = Math.max(rangeEnd, wordEnd);
  }
  ranges.push({ start: rangeStart, end: rangeEnd });
  if (end - ordered[ordered.length - 1].end <= thresholdSeconds) ranges[ranges.length - 1].end = end;
  return ranges.filter((range) => range.end - range.start >= 0.04);
}

export function mapSourceTimeToOutput(time: number, ranges: SpeechRange[]): number | null {
  let outputCursor = 0;
  for (const range of ranges) {
    if (time >= range.start && time <= range.end) return outputCursor + (time - range.start);
    if (time < range.start) return null;
    outputCursor += range.end - range.start;
  }
  return null;
}

export function formatSrtTime(seconds: number): string {
  const millis = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(millis / 3_600_000);
  const minutes = Math.floor((millis % 3_600_000) / 60_000);
  const secs = Math.floor((millis % 60_000) / 1000);
  const ms = millis % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

export function formatVttTime(seconds: number): string {
  return formatSrtTime(seconds).replace(",", ".");
}

export function toSrt(cues: CaptionCue[]): string {
  return cues.map((cue, index) => `${index + 1}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}\n${cue.text}`).join("\n\n");
}

export function toVtt(cues: CaptionCue[]): string {
  return `WEBVTT\n\n${cues.map((cue) => `${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}\n${cue.text}`).join("\n\n")}`;
}
