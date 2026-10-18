import {
  ALL_FORMATS,
  AudioSample,
  AudioSampleSink,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
  StreamTarget,
  VideoSample,
  WebMOutputFormat,
} from "mediabunny";
import { buildClipSpeechRanges, EXPORT_FRAME_RATE } from "../analysis/clip-analysis";
import { faceCenterAt, type FaceKeyframe } from "../media/face-tracking";
import { cropForPortrait } from "../media/framing";
import type { CaptionCue, ClipSuggestion, SpeechRange, StudioProject, VideoMetadata } from "../types";
import { mapSourceTimeToExportOutput } from "./timing";

export { cropForPortrait, portraitCropQuality } from "../media/framing";
export { mapSourceTimeToExportOutput, resolveOutputPreviewSourceTime } from "./timing";

interface WriteChunk { position: number; data: Uint8Array }
export interface FileWritable {
  write: (data: { type: "write"; position: number; data: Uint8Array }) => Promise<void>;
  close: () => Promise<void>;
  abort: (reason?: unknown) => Promise<void>;
}
interface OutputFileHandle { createWritable: () => Promise<FileWritable> }
interface SavePickerWindow extends Window {
  showSaveFilePicker?: (options: { suggestedName: string; types?: Array<{ description: string; accept: Record<string, string[]> }> }) => Promise<OutputFileHandle>;
}
export type OutputFormat = "mp4" | "webm-vp9" | "webm-vp8";
export interface ExportProgress { progress: number; phase: string; detail: string }
export interface ExportResult { filename: string; mimeType: string; blob?: Blob; byteLength: number; streamed: boolean }

export function videoBitrateForHeight(height: number): number {
  return height === 1920 ? 12_000_000 : 6_000_000;
}

export async function supportedOutputFormat(height: number, hasAudio = true): Promise<OutputFormat | null> {
  if (typeof globalThis.VideoEncoder !== "function" || (hasAudio && typeof globalThis.AudioEncoder !== "function")) return null;
  const width = Math.round(height * 9 / 16);
  const videoSupported = async (codec: string) => {
    try {
      const result = await globalThis.VideoEncoder.isConfigSupported({ codec, width, height, bitrate: videoBitrateForHeight(height), framerate: 30 });
      return Boolean(result.supported);
    } catch { return false; }
  };
  const audioSupported = async (codec: string) => {
    try { return Boolean((await globalThis.AudioEncoder.isConfigSupported({ codec, sampleRate: 48_000, numberOfChannels: 2, bitrate: 128_000 })).supported); }
    catch { return false; }
  };
  if (await videoSupported("avc1.42001f") && (!hasAudio || await audioSupported("mp4a.40.2"))) return "mp4";
  if (await videoSupported("vp09.00.10.08") && (!hasAudio || await audioSupported("opus"))) return "webm-vp9";
  if (await videoSupported("vp8") && (!hasAudio || await audioSupported("opus"))) return "webm-vp8";
  return null;
}

export async function executeConversionWithAbort(
  conversion: Pick<Conversion, "execute" | "cancel" | "state">,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) throw new DOMException("Export cancelled.", "AbortError");
  const onAbort = () => {
    if (conversion.state === "executing") void conversion.cancel().catch(() => undefined);
  };
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    if (signal.aborted) onAbort();
    await conversion.execute();
    if (signal.aborted || conversion.state === "canceled") throw new DOMException("Export cancelled.", "AbortError");
  } catch (cause) {
    if (signal.aborted || conversion.state === "canceled" || (cause instanceof DOMException && cause.name === "AbortError")) {
      throw new DOMException("Export cancelled.", "AbortError");
    }
    throw cause;
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}

let savePickerUnavailable = false;

export async function requestSaveTarget(name: string, format: OutputFormat, timeoutMs = 2500): Promise<FileWritable | null> {
  const picker = (window as SavePickerWindow).showSaveFilePicker;
  if (!picker || savePickerUnavailable) return null;

  let requestSettled = false;
  let timedOut = false;
  const pickerRequest = Promise.resolve()
    .then(() => picker({
      suggestedName: name,
      types: [{ description: format === "mp4" ? "MP4 video" : "WebM video", accept: { [format === "mp4" ? "video/mp4" : "video/webm"]: [`.${format === "mp4" ? "mp4" : "webm"}`] } }],
    }))
    .then(async (handle) => {
      if (timedOut) return null;
      const writable = await handle.createWritable();
      if (timedOut) {
        await writable.abort().catch(() => undefined);
        return null;
      }
      requestSettled = true;
      return writable;
    })
    .catch((cause: unknown) => {
      requestSettled = true;
      // User cancellation is a normal fallback; other errors (including an
      // invisible/already-active picker) make another prompt unsafe this tab.
      if (!(cause instanceof DOMException && cause.name === "AbortError")) savePickerUnavailable = true;
      return null;
    });

  let timeoutId = 0;
  const timeout = new Promise<null>((resolve) => {
    timeoutId = window.setTimeout(() => {
      if (!requestSettled) {
        timedOut = true;
        savePickerUnavailable = true;
      }
      resolve(null);
    }, Math.max(0, timeoutMs));
  });
  const result = await Promise.race([pickerRequest, timeout]);
  window.clearTimeout(timeoutId);
  return result;
}

function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawCaption(ctx: CanvasRenderingContext2D, cue: CaptionCue | undefined, absoluteTime: number, height: number, settings: StudioProject["settings"]): void {
  if (!cue) return;
  const style = settings.captionStyle;
  const fontFamily = settings.fontFamily;
  const primaryColor = /^#[0-9a-f]{6}$/i.test(settings.primaryColor) ? settings.primaryColor : "#203A31";
  const accentColor = /^#[0-9a-f]{6}$/i.test(settings.accentColor) ? settings.accentColor : "#C9794B";
  ctx.save();
  const fontSize = Math.max(34, Math.round(height * (style === "bold" ? 0.039 : 0.032)));
  ctx.font = `${style === "bold" ? 800 : 650} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const maxWidth = ctx.canvas.width * 0.84;
  const tokens = cue.text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const token of tokens) {
    const next = line ? `${line} ${token}` : token;
    if (line && ctx.measureText(next).width > maxWidth) { lines.push(line); line = token; }
    else line = next;
  }
  if (line) lines.push(line);
  const visibleLines = lines.slice(0, 3);
  const lineHeight = fontSize * 1.22;
  const blockHeight = visibleLines.length * lineHeight + fontSize * 0.72;
  const blockWidth = Math.min(maxWidth + 48, Math.max(...visibleLines.map((value) => ctx.measureText(value).width), 0) + 48);
  const x = (ctx.canvas.width - blockWidth) / 2;
  const y = ctx.canvas.height * 0.72 - blockHeight / 2;
  if (style !== "editorial") {
    ctx.globalAlpha = style === "bold" ? 0.94 : 0.84;
    ctx.fillStyle = primaryColor;
    roundRect(ctx, x, y, blockWidth, blockHeight, style === "bold" ? 20 : 12);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  visibleLines.forEach((lineText, lineIndex) => {
    const lineWords = lineText.split(/\s+/);
    const widths = lineWords.map((word) => ctx.measureText(`${word} `).width);
    const totalWidth = widths.reduce((a, b) => a + b, 0);
    let cursor = (ctx.canvas.width - totalWidth) / 2;
    const baseline = y + fontSize * 0.38 + lineIndex * lineHeight;
    lineWords.forEach((word, wordIndex) => {
      const matched = cue.words.find((item) => item.text.replace(/[.,!?;:]$/, "").toLowerCase() === word.replace(/[.,!?;:]$/, "").toLowerCase() && absoluteTime >= item.start && absoluteTime <= item.end);
      ctx.fillStyle = matched ? accentColor : "#FFFFFF";
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = style === "editorial" ? 5 : 0;
      ctx.fillText(word, cursor + widths[wordIndex] / 2, baseline, maxWidth);
      cursor += widths[wordIndex];
    });
  });
  ctx.restore();
}

export function titleCardGeometry(width: number, height: number, visibleLineCount: number, fontSize: number, padding: number): { x: number; y: number; width: number; height: number } {
  const lineCount = Math.max(0, Math.min(3, Math.floor(visibleLineCount)));
  return {
    x: padding,
    y: Math.round(height * 0.045),
    width: Math.max(0, width - padding * 2),
    height: lineCount * fontSize * 1.25 + padding,
  };
}

function drawTitleCard(ctx: CanvasRenderingContext2D, clip: ClipSuggestion, outputTime: number, settings: StudioProject["settings"]): void {
  const title = (clip.selectedTitle || clip.titleOptions[0] || "").trim();
  if (!settings.showTitleCard || !title || outputTime < 0 || outputTime >= 2.8) return;
  const primaryColor = /^#[0-9a-f]{6}$/i.test(settings.primaryColor) ? settings.primaryColor : "#203A31";
  const accentColor = /^#[0-9a-f]{6}$/i.test(settings.accentColor) ? settings.accentColor : "#C9794B";
  ctx.save();
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const fontSize = Math.max(30, Math.round(height * 0.028));
  ctx.font = `700 ${fontSize}px ${settings.fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  const padding = Math.round(width * 0.035);
  const maxLineWidth = width - padding * 2 - 36;
  const lines: string[] = [];
  let line = "";
  for (const word of title.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxLineWidth) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, 3);
  const lineHeight = fontSize * 1.25;
  const { x, y, width: cardWidth, height: cardHeight } = titleCardGeometry(width, height, visible.length, fontSize, padding);
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = primaryColor;
  roundRect(ctx, x, y, cardWidth, cardHeight, Math.round(fontSize * 0.32));
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = accentColor;
  roundRect(ctx, x + 14, y + 14, 5, Math.max(12, cardHeight - 28), 3);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  visible.forEach((text, index) => ctx.fillText(text, width / 2, y + padding / 2 + lineHeight * (index + 0.5), maxLineWidth));
  ctx.restore();
}

export function drawExportFrame(
  context: CanvasRenderingContext2D,
  sample: VideoSample,
  localTime: number,
  ranges: SpeechRange[],
  clip: ClipSuggestion,
  cues: CaptionCue[],
  faceKeyframes: FaceKeyframe[],
  settings: StudioProject["settings"],
  logo: ImageBitmap | null,
): number | null {
  const outputTime = mapSourceTimeToExportOutput(localTime, ranges);
  if (outputTime == null) return null;
  const width = context.canvas.width;
  const height = context.canvas.height;
  context.clearRect(0, 0, width, height);
  if (settings.framingMode === "full") {
    context.fillStyle = "#17261f";
    context.fillRect(0, 0, width, height);
    sample.drawWithFit(context, { fit: "contain" });
  } else {
    const center = settings.smartFraming
      ? faceCenterAt(faceKeyframes, localTime, settings.manualCropX, settings.manualCropY)
      : { x: settings.manualCropX, y: settings.manualCropY };
    const crop = cropForPortrait(sample.displayWidth, sample.displayHeight, 9 / 16, center.x, center.y);
    sample.drawWithFit(context, { fit: "cover", crop });
  }
  if (settings.showCaptions) {
    const cue = cues.find((item) => outputTime >= item.start && outputTime <= item.end);
    drawCaption(context, cue, outputTime, height, settings);
  }
  drawTitleCard(context, clip, outputTime, settings);
  drawLogo(context, logo, settings.logoPosition, width, height);
  return outputTime;
}

function drawLogo(ctx: CanvasRenderingContext2D, logo: ImageBitmap | null, position: StudioProject["settings"]["logoPosition"], width: number, height: number): void {
  if (!logo) return;
  const targetWidth = Math.min(width * 0.2, 190);
  const targetHeight = targetWidth * logo.height / Math.max(1, logo.width);
  const pad = width * 0.045;
  const x = position.endsWith("right") ? width - pad - targetWidth : pad;
  const y = position.startsWith("top") ? pad : height - pad - targetHeight;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.drawImage(logo, x, y, targetWidth, targetHeight);
  ctx.restore();
}

async function measurePeak(file: File, start: number, end: number): Promise<number> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const track = await input.getPrimaryAudioTrack();
    if (!track) return 0;
    const sink = new AudioSampleSink(track);
    let peak = 0;
    for await (const sample of sink.samples(start, end)) {
      try {
        const buffer = sample.toAudioBuffer();
        for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
          for (const value of buffer.getChannelData(channel)) peak = Math.max(peak, Math.abs(value));
        }
      } finally { sample.close(); }
    }
    return peak;
  } finally { input.dispose(); }
}

export function remapRanges(
  project: Pick<StudioProject, "settings" | "words" | "editedCues">,
  clip: Pick<ClipSuggestion, "start" | "end">,
): SpeechRange[] {
  const duration = Math.max(0.05, clip.end - clip.start);
  if (!project.settings.silenceRemoval) return [{ start: 0, end: duration }];
  return buildClipSpeechRanges(project.words, clip.start, clip.end, project.settings.silenceThresholdSeconds, project.editedCues);
}

export interface MappedTimeSegment { sourceStart: number; duration: number; outputTime: number }
export interface MappedAudioSegment extends MappedTimeSegment { startFrame: number; endFrame: number }

export function mapIntervalToOutputSegments(sourceStart: number, duration: number, ranges: SpeechRange[]): MappedTimeSegment[] {
  if (!Number.isFinite(sourceStart) || !Number.isFinite(duration) || duration <= 0) return [];
  const sourceEnd = sourceStart + duration;
  const orderedRanges = [...ranges]
    .filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start)
    .sort((left, right) => left.start - right.start);
  return orderedRanges.flatMap((range) => {
      const keptStart = Math.max(sourceStart, range.start);
      const keptEnd = Math.min(sourceEnd, range.end);
      if (keptEnd - keptStart <= 1e-9) return [];
      const outputTime = mapSourceTimeToExportOutput(keptStart, orderedRanges);
      return outputTime == null ? [] : [{ sourceStart: keptStart, duration: keptEnd - keptStart, outputTime }];
    });
}

export function mapAudioSampleToRanges(
  sourceStart: number,
  frameCount: number,
  sampleRate: number,
  ranges: SpeechRange[],
): MappedAudioSegment[] {
  if (!Number.isFinite(frameCount) || frameCount <= 0 || !Number.isFinite(sampleRate) || sampleRate <= 0) return [];
  return mapIntervalToOutputSegments(sourceStart, frameCount / sampleRate, ranges).flatMap((segment) => {
    const startFrame = Math.max(0, Math.min(frameCount, Math.ceil((segment.sourceStart - sourceStart) * sampleRate - 1e-7)));
    const segmentEnd = segment.sourceStart + segment.duration;
    const endFrame = Math.max(0, Math.min(frameCount, Math.ceil((segmentEnd - sourceStart) * sampleRate - 1e-7)));
    if (endFrame <= startFrame) return [];
    const exactSourceStart = sourceStart + startFrame / sampleRate;
    const outputTime = segment.outputTime + exactSourceStart - segment.sourceStart;
    return [{
      sourceStart: exactSourceStart,
      duration: (endFrame - startFrame) / sampleRate,
      outputTime,
      startFrame,
      endFrame,
    }];
  });
}

function isWebm(format: OutputFormat): boolean { return format !== "mp4"; }
function mimeFor(format: OutputFormat): string { return isWebm(format) ? "video/webm" : "video/mp4"; }

export async function verifyExportBlob(blob: Blob, timeoutMs = 2_500): Promise<void> {
  if (blob.size <= 0) throw new Error("The export produced an empty file. Nothing was added to the download list.");
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") return;
  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        callback();
      };
      const timer = window.setTimeout(() => finish(() => reject(new Error("The exported file could not be opened before the browser timeout."))), timeoutMs);
      video.preload = "metadata";
      video.muted = true;
      video.onloadedmetadata = () => finish(() => resolve(video.duration));
      video.onerror = () => finish(() => reject(new Error("The exported file was created but the browser could not read its video metadata.")));
      video.src = url;
      video.load();
    });
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("The exported file has no readable duration.");
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

export async function exportClip(options: {
  file: File;
  project: StudioProject;
  clip: ClipSuggestion;
  cues: CaptionCue[];
  faceKeyframes: FaceKeyframe[];
  format: OutputFormat;
  writable?: FileWritable | null;
  signal: AbortSignal;
  onProgress: (progress: ExportProgress) => void;
}): Promise<ExportResult> {
  const { file, project, clip, cues, faceKeyframes, format, writable, signal, onProgress } = options;
  const duration = clip.end - clip.start;
  if (duration < 1 || duration > 180) throw new Error("Choose a clip between 1 second and 3 minutes.");
  if (!Number.isFinite(clip.start) || !Number.isFinite(clip.end) || clip.start < 0 || clip.end > project.duration + 0.05) {
    throw new Error("The clip boundaries are outside the source video. Correct the in/out points before exporting.");
  }
  const height = project.settings.outputHeight;
  const width = Math.round(height * 9 / 16);
  const estimatedBytes = duration * (videoBitrateForHeight(height) + 128_000) / 8 + 4_000_000;
  if (!writable && estimatedBytes > 84 * 1024 * 1024) throw new Error("This browser cannot stream directly to a file. Use 720p, shorten the clip, or export it on a browser that supports direct file saving.");
  const ranges = remapRanges(project, clip);
  const peak = project.settings.peakNormalize ? await measurePeak(file, clip.start, clip.end) : 0;
  const gain = peak > 0.001 ? Math.min(5, 0.89 / peak) : 1;
  const logo = project.settings.logo ? await createImageBitmap(project.settings.logo).catch(() => null) : null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas encoding is unavailable in this browser.");
  let bytesWritten = 0;
  let target: BufferTarget | StreamTarget;
  let outputBlob: Blob | undefined;

  if (writable) {
    const stream = new WritableStream<WriteChunk>({
      write: async (chunk) => {
        bytesWritten = Math.max(bytesWritten, chunk.position + chunk.data.byteLength);
        await writable.write({ type: "write", position: chunk.position, data: chunk.data });
      },
      close: async () => { await writable.close(); },
      abort: async (reason) => { await writable.abort(reason); },
    });
    target = new StreamTarget(stream);
  } else {
    target = new BufferTarget();
  }
  const output = new Output({
    format: isWebm(format) ? new WebMOutputFormat() : new Mp4OutputFormat(),
    target,
  });
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  let conversion: Conversion | null = null;

  try {
    onProgress({ progress: 0, phase: "preparing", detail: "Preparing local video processing" });
    const hasAudioTrack = Boolean(await input.getPrimaryAudioTrack());
    if (signal.aborted) throw new DOMException("Export cancelled.", "AbortError");
    conversion = await Conversion.init({
      input,
      output,
      tracks: "primary",
      copy: false,
      tags: {},
      trim: { start: clip.start, end: clip.end },
      video: {
        codec: format === "mp4" ? "avc" : format === "webm-vp8" ? "vp8" : "vp9",
        quality: new Quality({ bitrate: videoBitrateForHeight(height) }),
        frameRate: 30,
        processedWidth: width,
        processedHeight: height,
        process: (sample) => {
          if (signal.aborted) return null;
          const segments = mapIntervalToOutputSegments(sample.timestamp - clip.start, sample.duration, ranges);
          const frames = segments.flatMap((segment) => {
            const mappedTime = drawExportFrame(context, sample, segment.sourceStart, ranges, clip, cues, faceKeyframes, project.settings, logo);
            return mappedTime == null ? [] : [new VideoSample(canvas, { timestamp: segment.outputTime, duration: segment.duration })];
          });
          return frames.length > 1 ? frames : frames[0] ?? null;
        },
      },
      audio: hasAudioTrack ? {
        codec: format === "mp4" ? "aac" : "opus",
        quality: new Quality({ bitrate: 128_000 }),
        process: (sample) => {
          if (signal.aborted) return null;
          const segments = mapAudioSampleToRanges(sample.timestamp - clip.start, sample.numberOfFrames, sample.sampleRate, ranges);
          if (!segments.length) return null;
          const buffer = sample.toAudioBuffer();
          const channels = sample.numberOfChannels;
          return segments.map((segment) => {
            const frames = segment.endFrame - segment.startFrame;
            const data = new Float32Array(frames * channels);
            for (let channel = 0; channel < channels; channel += 1) {
              const channelData = buffer.getChannelData(channel);
              const offset = channel * frames;
              for (let index = 0; index < frames; index += 1) {
                const value = channelData[segment.startFrame + index] ?? 0;
                data[offset + index] = Math.max(-1, Math.min(1, value * gain));
              }
            }
            return new AudioSample({ data, format: "f32-planar", numberOfChannels: channels, sampleRate: sample.sampleRate, timestamp: segment.outputTime });
          });
        },
      } : { discard: true },
    });
    if (!conversion.isValid) {
      const discarded = conversion.discardedTracks.map((item) => item.reason).filter(Boolean).join("; ");
      throw new Error(discarded || "This video codec is not supported for export in this browser.");
    }
    conversion.onProgress = (progress) => onProgress({ progress, phase: "encoding", detail: `${Math.round(progress * 100)}% — encoding stays on this device` });
    if (signal.aborted) throw new DOMException("Export cancelled.", "AbortError");
    await executeConversionWithAbort(conversion, signal);
    if (target instanceof BufferTarget) {
      const buffer = target.buffer;
      if (!buffer) throw new Error("The export completed without a file buffer.");
      outputBlob = new Blob([buffer], { type: mimeFor(format) });
      bytesWritten = buffer.byteLength;
    }
    if (bytesWritten <= 0) throw new Error("The export completed without writing any video data.");
    if (outputBlob) await verifyExportBlob(outputBlob);
    onProgress({ progress: 1, phase: "complete", detail: "Your file is ready on this device" });
    return {
      filename: `${(clip.selectedTitle || project.name).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 56)}-clip-${Math.round(clip.start)}.${isWebm(format) ? "webm" : "mp4"}`,
      mimeType: mimeFor(format),
      blob: outputBlob,
      byteLength: bytesWritten,
      streamed: Boolean(writable),
    };
  } catch (error) {
    if (output.state !== "finalized" && output.state !== "canceled") await output.cancel().catch(() => undefined);
    if (signal.aborted || conversion?.state === "canceled" || (error instanceof DOMException && error.name === "AbortError")) {
      throw new DOMException("Export cancelled.", "AbortError");
    }
    const message = error instanceof Error ? error.message : "Export failed on this device.";
    if (/memory|buffer|allocation/i.test(message)) throw new Error("This browser ran out of memory. Try 720p, a shorter clip, or saving one clip at a time.");
    throw new Error(message);
  } finally {
    if (logo) logo.close();
    input.dispose();
  }
}
