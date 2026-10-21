import type { CaptionCue, ClipSuggestion, SpeechRange, TranscriptWord } from "../types";

interface Sentence {
  words: TranscriptWord[];
  start: number;
  end: number;
  text: string;
  complete: boolean;
  startsAtBoundary: boolean;
}

const HOOK_TERMS = /^\s*(?:(?:the|a|an)\s+)?(why|how|what|when|mistake|truth|secret|never|always|first|best|before|after|because|important|remember|number|cost|price|market|buyer|seller|home|property|real estate)\b/i;
const INTRO_OPENERS = /^\s*(?:and\s+)?(?:i['’]m|i am)\s+(?:here\b|thrilled\b|excited\b|speaking\b)|^\s*(?:today\s*,?\s*(?:we['’]re|we are)\s+(?:(?:absolutely|really)\s+)?(?:thrilled|excited|here)\b|welcome back\b|thank you for (?:joining|watching)\b|thanks for (?:joining|watching)\b|my name is\b|in today['’]s video\b)/i;
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

function sameStrings(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function refreshGeneratedClipMetadata(clip: ClipSuggestion, previousTranscript: string, nextTranscript: string): ClipSuggestion {
  const previousCopy = makePostCopy(previousTranscript, clip.start);
  const nextCopy = makePostCopy(nextTranscript, clip.start);
  const titleOptions = clip.titleOptions.map((title, index) => title === previousCopy.titleOptions[index] ? nextCopy.titleOptions[index] : title);
  const selectedTitle = clip.selectedTitle && previousCopy.titleOptions.includes(clip.selectedTitle)
    ? nextCopy.titleOptions[previousCopy.titleOptions.indexOf(clip.selectedTitle)]
    : clip.selectedTitle;
  const hookOptions = clip.hookOptions.map((hook) => hook === previousTranscript ? nextTranscript : hook);
  const selectedHook = clip.selectedHook === previousTranscript ? nextTranscript : clip.selectedHook;
  const description = clip.description === previousCopy.description
    ? nextCopy.description
    : clip.description.replace(previousTranscript, nextTranscript);
  return {
    ...clip,
    transcript: nextTranscript,
    titleOptions,
    selectedTitle,
    description,
    hookOptions,
    selectedHook,
    hashtags: sameStrings(clip.hashtags, previousCopy.hashtags) ? nextCopy.hashtags : clip.hashtags,
    reasons: ["Transcript edited; review generated copy before publishing"],
    quality: "review",
    qualityWarning: "Review required: the transcript was edited and generated copy may need review.",
  };
}

export function refreshClipTranscriptsFromCues(
  clips: ClipSuggestion[],
  cues: CaptionCue[],
  affectedClipIds: string[],
  sourceWords: TranscriptWord[],
  previousCue?: CaptionCue,
  textChanged = false,
): ClipSuggestion[] {
  const affected = new Set(affectedClipIds);
  if (!affected.size) return clips;
  return clips.map((clip) => {
    if (!affected.has(clip.id) || !clip.id.startsWith("clip-")) return clip;
    if (textChanged && previousCue) {
      const updatedCue = cues.find((cue) => cue.id === previousCue.id);
      if (!updatedCue || !previousCue.text.trim() || !clip.transcript.includes(previousCue.text)) return clip;
      const transcript = clip.transcript.replace(previousCue.text, updatedCue.text).replace(/\s+/g, " ").trim();
      return refreshGeneratedClipMetadata(clip, clip.transcript, transcript);
    }
    if (previousCue && !previousCue.words.length) return clip;
    const words = sourceWords.length
      ? sourceWords.filter((word) => word.end > clip.start && word.start < clip.end)
      : cues.flatMap((cue) => cue.words.filter((word) => word.end > clip.start && word.start < clip.end));
    if (!words.length) return sourceWords.length ? { ...clip, transcript: "" } : clip;
    return { ...clip, transcript: joinTranscriptWords(words.sort((a, b) => a.start - b.start)) };
  });
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

function scoreWindow(sentences: Sentence[], start: number, end: number, text: string, sourceDuration?: number): { score: number; reasons: string[]; quality: "reliable" | "review"; qualityWarning?: string } {
  const duration = end - start;
  const clipWords = sentences.flatMap((sentence) => sentence.words);
  const words = text.split(/\s+/).filter(Boolean);
  const reasons: string[] = [];
  const warningParts: string[] = [];
  let score = 0;
  const durationScore = 3.5 - Math.min(3.5, Math.abs(duration - 28) / 16);
  score += durationScore;
  if (duration >= 15 && duration <= 60) reasons.push("A complete short-form segment (15–60 seconds)");
  else if (duration >= 8 && duration < 15) {
    score -= 1.5;
    reasons.push("A shorter fallback segment; review the context before publishing");
    warningParts.push("the fallback segment is shorter than the preferred 15-second range");
  }
  const opening = sentences[0]?.text ?? text;
  if (/[?!]/.test(opening)) { score += 1.5; reasons.push("Opens with a question or emphatic line"); }
  if (/\b\d+(?:\.\d+)?%?\b/.test(text)) { score += 1.25; reasons.push("Includes a concrete number"); }
  if (HOOK_TERMS.test(opening)) { score += 1.1; reasons.push("Opens with a specific topic or useful claim"); }
  if (INTRO_OPENERS.test(opening)) {
    score -= 1.1;
    warningParts.push("the opening sounds like a speaker or programme introduction rather than the main point");
  }
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
  if (sourceDuration != null && Number.isFinite(sourceDuration) && sourceDuration > 0 && end >= sourceDuration - 2) {
    warningParts.push("the clip ends close to the source tail; check for speech omitted by transcription");
  }
  const qualityWarning = warningParts.length ? `Review required: ${warningParts.join(" and ")}.` : undefined;
  return { score, reasons, quality: qualityWarning ? "review" : "reliable", qualityWarning };
}

function makePostCopy(text: string, start: number): Pick<ClipSuggestion, "titleOptions" | "description" | "hashtags" | "callsToAction"> {
  const sentenceTexts = sentenceGroups(text.split(/\s+/).map((token, i) => ({ id: `${i}`, text: token, start: i, end: i + 0.5 })))
    .map((sentence) => sentence.text.replace(/^[-–—\s]+|[\s]+$/g, ""))
    .filter(Boolean);
  const preferredTitles = sentenceTexts.filter((sentence) => !INTRO_OPENERS.test(sentence));
  const titleSeeds = [...preferredTitles, ...sentenceTexts.filter((sentence) => INTRO_OPENERS.test(sentence))]
    .filter((sentence, index, all) => all.indexOf(sentence) === index)
    .slice(0, 3)
    .map((sentence) => sentence.length > 76 ? `${sentence.slice(0, 72).replace(/\s+\S*$/, "")}…` : sentence);
  const anchor = titleSeeds[0] || `A moment from ${formatClock(start)}`;
  const titleOptions = [
    `“${titleSeeds[0] ?? anchor}”`,
    `The point: ${titleSeeds[1] ?? anchor}`,
    `Worth a closer look: ${titleSeeds[2] ?? anchor}`,
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

export function suggestClips(words: TranscriptWord[], maxClips = 3, sourceDuration?: number): ClipSuggestion[] {
  const limit = Number.isFinite(maxClips) ? Math.max(0, Math.floor(maxClips)) : 0;
  if (limit === 0) return [];
  const safeWords = words.flatMap((word) => {
    if (!Number.isFinite(word.start) || !Number.isFinite(word.end) || word.end <= word.start) return [];
    if (sourceDuration == null || !Number.isFinite(sourceDuration) || sourceDuration <= 0) return [word];
    if (word.start < -0.18 || word.start >= sourceDuration || word.end > sourceDuration + 0.18) return [];
    const start = Math.max(0, word.start);
    const end = Math.min(sourceDuration, word.end);
    return end - start >= 0.04 ? [{ ...word, start, end }] : [];
  });
  const sentences = sentenceGroups(safeWords);
  if (!sentences.length) return [];
  const candidates: ClipSuggestion[] = [];

  for (let startIndex = 0; startIndex < sentences.length; startIndex += 1) {
    const group: Sentence[] = [];
    for (let endIndex = startIndex; endIndex < sentences.length; endIndex += 1) {
      const next = sentences[endIndex];
      if (group.length && next.end - group[0].start > 60) break;
      group.push(next);
      if (group.some((sentence) => !sentence.complete || !sentence.startsAtBoundary)) continue;
      const duration = next.end - group[0].start;
      if (duration < 8 || duration > 60) continue;
      const text = group.map((sentence) => sentence.text).join(" ");
      const { score, reasons, quality, qualityWarning } = scoreWindow(group, group[0].start, next.end, text, sourceDuration);
      if (qualityWarning && score < 1) continue;
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

  const ranked = candidates.sort((a, b) => b.score - a.score);
  const selected: ClipSuggestion[] = [];
  for (const candidate of ranked) {
    const overlaps = selected.some((current) => {
      const overlap = Math.max(0, Math.min(current.end, candidate.end) - Math.max(current.start, candidate.start));
      return overlap > Math.min(current.end - current.start, candidate.end - candidate.start) * 0.25;
    });
    const candidateTokens = candidate.transcript.toLocaleLowerCase().normalize("NFKC").match(/[\p{L}\p{N}']+/gu) ?? [];
    const candidateNgrams = new Set(candidateTokens.length < 6
      ? candidateTokens
      : candidateTokens.slice(0, -2).map((token, index) => `${token} ${candidateTokens[index + 1]} ${candidateTokens[index + 2]}`));
    const nearDuplicate = selected.some((current) => {
      const tokens = current.transcript.toLocaleLowerCase().normalize("NFKC").match(/[\p{L}\p{N}']+/gu) ?? [];
      const ngrams = new Set(tokens.length < 6
        ? tokens
        : tokens.slice(0, -2).map((token, index) => `${token} ${tokens[index + 1]} ${tokens[index + 2]}`));
      if (!candidateNgrams.size || !ngrams.size) return false;
      let shared = 0;
      for (const gram of candidateNgrams) if (ngrams.has(gram)) shared += 1;
      return shared / Math.min(candidateNgrams.size, ngrams.size) >= 0.86;
    });
    if (!overlaps && !nearDuplicate) selected.push(candidate);
    if (selected.length >= limit) break;
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

export function buildClipSpeechRanges(words: TranscriptWord[], start: number, end: number, thresholdSeconds: number, manualCues: CaptionCue[] = []): SpeechRange[] {
  if (end <= start) return [];
  const duration = end - start;
  const manualWords: TranscriptWord[] = manualCues.flatMap((cue) => {
    if (!cue.text.trim() || cue.end <= start || cue.start >= end) return [];
    const timedWords = cue.words.filter((word) => word.end > word.start && word.end > start && word.start < end);
    if (words.length && cue.id.startsWith("cue-") && !timedWords.length) return [];
    return timedWords.length ? timedWords : [{ id: cue.id, text: cue.text, start: cue.start, end: cue.end }];
  });
  const ranges = speechKeepRanges([...words, ...manualWords], start, end, thresholdSeconds)
    .map((range) => ({ start: Math.max(0, Math.min(duration, range.start - start)), end: Math.max(0, Math.min(duration, range.end - start)) }))
    .filter((range) => range.end > range.start);
  return ranges.length ? ranges : [{ start: 0, end: duration }];
}

export const EXPORT_FRAME_RATE = 30;

export function mapSourceTimeToOutput(time: number, ranges: SpeechRange[]): number | null {
  let outputCursor = 0;
  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index];
    const isLastRange = index === ranges.length - 1;
    // Internal range ends are exclusive. Otherwise a sample exactly at the
    // end of one kept range and one at the next range start share a timestamp.
    if (time >= range.start && (time < range.end || (isLastRange && time <= range.end))) {
      return outputCursor + (time - range.start);
    }
    if (time < range.start) return null;
    outputCursor += range.end - range.start;
  }
  return null;
}

function mapCaptionBoundaryToOutput(time: number, ranges: SpeechRange[], frameRate: number): number {
  let outputCursor = 0;
  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index];
    if (time <= range.start) return outputCursor;
    if (time <= range.end) return outputCursor + (time - range.start);
    outputCursor += range.end - range.start;
    if (index < ranges.length - 1 && Number.isFinite(frameRate) && frameRate > 0) {
      outputCursor = Math.ceil(outputCursor * frameRate - 1e-9) / frameRate;
    }
  }
  return outputCursor;
}

export function mapCaptionCuesToOutput(cues: CaptionCue[], clipStart: number, clipEnd: number, ranges: SpeechRange[], frameRate = 0): CaptionCue[] {
  if (clipEnd <= clipStart || !ranges.length) return [];
  const orderedRanges = [...ranges].filter((range) => range.end > range.start).sort((a, b) => a.start - b.start);
  if (!orderedRanges.length) return [];
  return cues.flatMap((cue) => {
    if (!cue.text.trim()) return [];
    const sourceStart = Math.max(clipStart, cue.start);
    const sourceEnd = Math.min(clipEnd, cue.end);
    if (sourceEnd <= sourceStart) return [];
    const start = mapCaptionBoundaryToOutput(Math.max(0, sourceStart - clipStart), orderedRanges, frameRate);
    const end = mapCaptionBoundaryToOutput(Math.max(0, sourceEnd - clipStart), orderedRanges, frameRate);
    if (end <= start) return [];
    const words = cue.words.flatMap((word) => {
      const wordStart = mapCaptionBoundaryToOutput(Math.max(0, word.start - clipStart), orderedRanges, frameRate);
      const wordEnd = mapCaptionBoundaryToOutput(Math.max(0, word.end - clipStart), orderedRanges, frameRate);
      return wordEnd > wordStart ? [{ ...word, start: wordStart, end: wordEnd }] : [];
    });
    return [{ ...cue, start, end, words }];
  });
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
  return cues.filter((cue) => cue.text.trim()).map((cue, index) => `${index + 1}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}\n${cue.text}`).join("\n\n");
}

export function toVtt(cues: CaptionCue[]): string {
  return `WEBVTT\n\n${cues.filter((cue) => cue.text.trim()).map((cue) => `${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}\n${cue.text}`).join("\n\n")}`;
}
