import type { CaptionCue, ClipSuggestion, SpeechRange, TranscriptWord } from "../types";

interface Sentence {
  words: TranscriptWord[];
  start: number;
  end: number;
  text: string;
  complete: boolean;
  startsAtBoundary: boolean;
}

const HOOK_TERMS = /\b(why|how|what|when|mistake|truth|secret|never|always|first|best|before|after|because|important|remember|number|cost|price|market|buyer|seller|home|property|real estate)\b/i;
const FILLERS = new Set(["um", "uh", "erm", "you", "know", "like", "so"]);
const MIN_CLIP_DURATION_SECONDS = 8;
const MAX_CLIP_DURATION_SECONDS = 60;
const MAX_INTERNAL_PAUSE_SECONDS = 2.5;
const TIMESTAMP_TOLERANCE_SECONDS = 0.05;
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

export function sentenceGroups(words: TranscriptWord[], sourceDuration = Number.POSITIVE_INFINITY): Sentence[] {
  if (sourceDuration !== Number.POSITIVE_INFINITY && (!Number.isFinite(sourceDuration) || sourceDuration <= 0)) return [];
  const validSourceDuration = sourceDuration;
  const ordered = [...words].filter((word) => {
    if (!word.text.trim() || !Number.isFinite(word.start) || !Number.isFinite(word.end) || word.end <= word.start) return false;
    if (word.start < -TIMESTAMP_TOLERANCE_SECONDS || word.end <= 0 || word.start >= validSourceDuration) return false;
    return word.end <= validSourceDuration + TIMESTAMP_TOLERANCE_SECONDS;
  }).map((word) => ({
    ...word,
    start: Math.max(0, word.start),
    end: Math.min(validSourceDuration, word.end),
  })).filter((word) => word.end - word.start >= 0.04)
    .sort((a, b) => a.start - b.start);
  const sentences: Sentence[] = [];
  let current: TranscriptWord[] = [];
  let currentStartsAtBoundary = true;
  let previousWord: TranscriptWord | undefined;
  const finish = () => {
    if (!current.length) return;
    const text = joinWords(current);
    if (text) sentences.push({
      words: current,
      start: current[0].start,
      end: current[current.length - 1].end,
      text,
      complete: /[.!?…]["')\]]?$/.test(current[current.length - 1].text.trim()),
      startsAtBoundary: currentStartsAtBoundary,
    });
    current = [];
    currentStartsAtBoundary = true;
  };

  for (const word of ordered) {
    const previous = current[current.length - 1];
    const gap = previous ? word.start - previous.end : 0;
    if (!current.length) {
      const previousGap = previousWord ? word.start - previousWord.end : 0;
      const followsTerminal = previousWord && /[.!?…]["')\]]?$/.test(previousWord.text.trim()) && previousGap >= -0.35;
      currentStartsAtBoundary = !previousWord || previousGap > 1.35 || Boolean(followsTerminal);
    }
    if (previous && gap > 1.35) finish();
    current.push(word);
    if (/[.!?…]["')\]]?$/.test(word.text.trim())) finish();
    previousWord = word;
  }
  finish();
  return sentences;
}

function scoreWindow(sentences: Sentence[], start: number, end: number, text: string): { score: number; reasons: string[]; quality: "reliable" | "review"; qualityWarning?: string } {
  const duration = end - start;
  const clipWords = sentences.flatMap((sentence) => sentence.words);
  const words = text.split(/\s+/).filter(Boolean);
  const reasons: string[] = [];
  let score = 0;
  const durationScore = 3.5 - Math.min(3.5, Math.abs(duration - 28) / 16);
  score += durationScore;
  if (duration >= 15 && duration <= 60) reasons.push("A complete short-form segment (15–60 seconds)");
  else if (duration >= 8 && duration < 15) {
    score -= 1.5;
    reasons.push("A shorter fallback segment; review the context before publishing");
  }
  if (/[?!]/.test(text)) { score += 1.5; reasons.push("Contains a question or emphatic line"); }
  if (/\b\d+(?:\.\d+)?%?\b/.test(text)) { score += 1.25; reasons.push("Includes a concrete number"); }
  if (HOOK_TERMS.test(text)) { score += 1.1; reasons.push("Opens with a specific topic or useful claim"); }
  if (words.length >= 18 && words.length <= 105) { score += 0.65; reasons.push("Has enough context to stand on its own"); }
  const pauses = sentences.slice(1).map((sentence, index) => sentence.start - sentences[index].end).filter((gap) => gap >= 0.18 && gap <= 1.2);
  if (pauses.length) { score += 0.45; reasons.push("Has a natural speech pause"); }
  const fillerCount = words.filter((word) => FILLERS.has(word.toLowerCase().replace(/[^a-z]/g, ""))).length;
  score -= Math.min(1.2, fillerCount * 0.15);
  const normalized = words.map((word) => word.toLowerCase().replace(/[^a-z0-9']/g, "")).filter(Boolean);
  const uniqueRatio = normalized.length ? new Set(normalized).size / normalized.length : 0;
  const bigrams = new Map<string, number>();
  for (let index = 1; index < normalized.length; index += 1) {
    const bigram = `${normalized[index - 1]} ${normalized[index]}`;
    bigrams.set(bigram, (bigrams.get(bigram) ?? 0) + 1);
  }
  const repeatedBigrams = [...bigrams.values()].filter((count) => count >= 2).length;
  const warningParts: string[] = [];
  const firstToken = clipWords[0]?.text.trim() ?? "";
  const firstSentence = sentences[0];
  const startsLowercase = /^[a-z]/.test(firstToken);
  const startsWithFragment = startsLowercase && (firstSentence?.words.length ?? 0) > 3;
  const startsWithWeakFragment = startsLowercase && (firstSentence?.words.length ?? 0) <= 2 && !HOOK_TERMS.test(firstSentence?.text ?? "");
  const overlappingWords = clipWords.slice(1).filter((word, index) => word.start < clipWords[index].end - 0.08).length;
  if (startsWithFragment) {
    score -= 3;
    warningParts.push("the clip starts with a likely continuation rather than a clean sentence");
  }
  if (startsWithWeakFragment) {
    score -= 3;
    warningParts.push("the opening phrase is too short and lacks a clear topic");
  }
  if (overlappingWords >= 2) {
    score -= 2.5;
    warningParts.push("the speech timestamps overlap unusually");
  }
  if (normalized.length >= 20 && uniqueRatio < 0.52) {
    score -= 3.5;
    warningParts.push("the transcript repeats the same words unusually often");
  }
  if (repeatedBigrams >= 2) {
    score -= Math.min(3, repeatedBigrams * 0.9);
    warningParts.push("the transcript contains repeated phrases");
  }
  if (normalized.length >= 24 && fillerCount / normalized.length > 0.16) {
    score -= 1.5;
    warningParts.push("the transcript contains many filler words");
  }
  const qualityWarning = warningParts.length ? `Review required: ${warningParts.join(" and ")}.` : undefined;
  return { score, reasons, quality: qualityWarning ? "review" : "reliable", qualityWarning };
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

export function suggestClips(words: TranscriptWord[], maxClips = 3, sourceDuration = Number.POSITIVE_INFINITY): ClipSuggestion[] {
  if (!Number.isFinite(maxClips) || maxClips <= 0) return [];
  if (sourceDuration !== Number.POSITIVE_INFINITY && (!Number.isFinite(sourceDuration) || sourceDuration <= 0)) return [];
  const clipLimit = Math.floor(maxClips);
  if (clipLimit <= 0) return [];
  const sentences = sentenceGroups(words, sourceDuration);
  if (!sentences.length) return [];
  const candidates: ClipSuggestion[] = [];

  for (let startIndex = 0; startIndex < sentences.length; startIndex += 1) {
    const group: Sentence[] = [];
    for (let endIndex = startIndex; endIndex < sentences.length; endIndex += 1) {
      const next = sentences[endIndex];
      const previous = group[group.length - 1];
      if (previous && next.start - previous.end > MAX_INTERNAL_PAUSE_SECONDS) break;
      if (group.length && next.end - group[0].start > MAX_CLIP_DURATION_SECONDS) break;
      group.push(next);
      if (group.some((sentence) => !sentence.complete || !sentence.startsAtBoundary)) continue;
      const duration = next.end - group[0].start;
      if (duration < MIN_CLIP_DURATION_SECONDS || duration > MAX_CLIP_DURATION_SECONDS) continue;
      const text = group.map((sentence) => sentence.text).join(" ");
      const { score, reasons, quality, qualityWarning } = scoreWindow(group, group[0].start, next.end, text);
      if (qualityWarning && score < 3.5) continue;
      const wordsInClip = group.flatMap((sentence) => sentence.words);
      const copy = makePostCopy(text, group[0].start);
      const hookCandidates = group.slice(0, 3).filter((sentence) => next.end - sentence.start >= 8);
      const hookOptions = hookCandidates.map((sentence) => sentence.text);
      candidates.push({
        id: `clip-${Math.round(group[0].start * 1000)}-${Math.round(next.end * 1000)}`,
        start: group[0].start,
        end: next.end,
        score,
        quality,
        qualityWarning,
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

  const ranked = candidates.sort((a, b) => b.score - a.score || a.start - b.start || a.end - b.end);
  const selected: ClipSuggestion[] = [];
  for (const candidate of ranked) {
    const overlaps = selected.some((current) => {
      const overlap = Math.max(0, Math.min(current.end, candidate.end) - Math.max(current.start, candidate.start));
      return overlap > Math.min(current.end - current.start, candidate.end - candidate.start) * 0.25;
    });
    if (!overlaps) selected.push(candidate);
    if (selected.length >= clipLimit) break;
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
