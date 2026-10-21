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
import { mapSourceTimeToOutput, normalizeClipBounds, speechKeepRanges } from "../analysis/clip-analysis";
import { faceCenterAt, type FaceKeyframe } from "../media/face-tracking";
import type { CaptionCue, ClipSuggestion, SpeechRange, StudioProject, VideoMetadata } from "../types";

interface WriteChunk { position: number; data: Uint8Array }
interface FileWritable {
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

export async function supportedOutputFormat(height: number): Promise<OutputFormat | null> {
  if (!("VideoEncoder" in globalThis) || !("AudioEncoder" in globalThis)) return null;
  const width = Math.round(height * 9 / 16);
  const videoSupported = async (codec: string) => {
    try {
      const result = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate: videoBitrateForHeight(height), framerate: 30 });
      return Boolean(result.supported);
    } catch { return false; }
  };
  const audioSupported = async (codec: string) => {
    try { return Boolean((await AudioEncoder.isConfigSupported({ codec, sampleRate: 48_000, numberOfChannels: 2, bitrate: 128_000 })).supported); }
    catch { return false; }
  };
  if (await videoSupported("avc1.42001f") && await audioSupported("mp4a.40.2")) return "mp4";
  if (await videoSupported("vp09.00.10.08") && await audioSupported("opus")) return "webm-vp9";
  if (await videoSupported("vp8") && await audioSupported("opus")) return "webm-vp8";
  return null;
}

export async function requestSaveTarget(name: string, format: OutputFormat, signal?: AbortSignal): Promise<FileWritable | null> {
  const picker = (window as SavePickerWindow).showSaveFilePicker;
  if (!picker) return null;
  let settled = false;
  const pickerRequest = picker({
    suggestedName: name,
    types: [{ description: format === "mp4" ? "MP4 video" : "WebM video", accept: { [format === "mp4" ? "video/mp4" : "video/webm"]: [`.${format === "mp4" ? "mp4" : "webm"}`] } }],
  }).then((handle) => handle.createWritable()).then(async (writable) => {
    if (settled || signal?.aborted) {
      await writable.abort(new DOMException("Save cancelled.", "AbortError")).catch(() => undefined);
      return null;
    }
    return writable;
  });
  // Some embedded browsers expose the API but do not surface its native dialog.
  // Do not block encoding forever in that case; the caller will use BufferTarget.
  const timeout = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 2500));
  const aborted = signal ? new Promise<null>((resolve) => signal.addEventListener("abort", () => resolve(null), { once: true })) : new Promise<null>(() => undefined);
  const result = await Promise.race([pickerRequest, timeout, aborted]);
  settled = true;
  return result;
}

function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
export function cropForPortrait(width: number, height: number, targetAspect: number, centerX: number, centerY: number) {
  const sourceWidth = Math.max(1, Math.floor(Number.isFinite(width) ? width : 1));
  const sourceHeight = Math.max(1, Math.floor(Number.isFinite(height) ? height : 1));
  const aspect = Number.isFinite(targetAspect) && targetAspect > 0 ? targetAspect : 9 / 16;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  if (sourceWidth / sourceHeight > aspect) cropWidth = Math.round(sourceHeight * aspect);
  else cropHeight = Math.round(sourceWidth / aspect);
  cropWidth = clamp(cropWidth, 1, sourceWidth);
  cropHeight = clamp(cropHeight, 1, sourceHeight);
  const safeCenterX = clamp(Number.isFinite(centerX) ? centerX : 0.5, 0, 1);
  const safeCenterY = clamp(Number.isFinite(centerY) ? centerY : 0.5, 0, 1);
  const left = clamp(Math.round(safeCenterX * sourceWidth - cropWidth / 2), 0, sourceWidth - cropWidth);
  const top = clamp(Math.round(safeCenterY * sourceHeight - cropHeight / 2), 0, sourceHeight - cropHeight);
  return { left, top, width: cropWidth, height: cropHeight };
}

export function portraitCropQuality(sourceWidth: number, sourceHeight: number, outputHeight: number) {
  const outputWidth = Math.round(outputHeight * 9 / 16);
  const crop = cropForPortrait(sourceWidth, sourceHeight, 9 / 16, 0.5, 0.5);
  const scale = Math.max(outputWidth / crop.width, outputHeight / crop.height);
  return { cropWidth: crop.width, cropHeight: crop.height, outputWidth, outputHeight, scale, isUpscaled: scale > 1.01 };
}

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

function drawTitleCard(ctx: CanvasRenderingContext2D, clip: ClipSuggestion, absoluteTime: number, settings: StudioProject["settings"]): void {
  const title = (clip.selectedTitle || clip.titleOptions[0] || "").trim();
  if (!settings.showTitleCard || !title || absoluteTime < clip.start || absoluteTime >= clip.start + 2.8) return;
  const primaryColor = /^#[0-9a-f]{6}$/i.test(settings.primaryColor) ? settings.primaryColor : "#203A31";
  const accentColor = /^#[0-9a-f]{6}$/i.test(settings.accentColor) ? settings.accentColor : "#C9794B";
  ctx.save();
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const fontSize = Math.round(height * 0.032);
  ctx.font = `700 ${fontSize}px ${settings.fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  const padding = Math.round(width * 0.055);
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
  const cardHeight = visible.length * lineHeight + padding;
  const x = padding;
  const y = height * 0.13;
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = primaryColor;
  roundRect(ctx, x, y, width - padding * 2, cardHeight, Math.round(fontSize * 0.32));
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = accentColor;
  roundRect(ctx, x + 14, y + 14, 5, Math.max(12, cardHeight - 28), 3);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  visible.forEach((text, index) => ctx.fillText(text, width / 2, y + padding / 2 + lineHeight * (index + 0.5), maxLineWidth));
  ctx.restore();
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

async function measurePeak(file: File, start: number, end: number, signal: AbortSignal): Promise<number> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const track = await input.getPrimaryAudioTrack();
    if (!track) return 0;
    const sink = new AudioSampleSink(track);
    let peak = 0;
    for await (const sample of sink.samples(start, end)) {
      if (signal.aborted) throw new DOMException("Export cancelled.", "AbortError");
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

function remapRanges(project: StudioProject, clip: ClipSuggestion): SpeechRange[] {
  const duration = Math.max(0.05, clip.end - clip.start);
  if (!project.settings.silenceRemoval || !project.words.length) return [{ start: 0, end: duration }];
  return speechKeepRanges(project.words, clip.start, clip.end, project.settings.silenceThresholdSeconds)
    .map((range) => ({ start: clamp(range.start - clip.start, 0, duration), end: clamp(range.end - clip.start, 0, duration) }))
    .filter((range) => range.end > range.start);
}

function isWebm(format: OutputFormat): boolean { return format !== "mp4"; }
function mimeFor(format: OutputFormat): string { return isWebm(format) ? "video/webm" : "video/mp4"; }

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
  const { file, project, cues, faceKeyframes, format, writable, signal, onProgress } = options;
  const bounds = normalizeClipBounds(options.clip.start, options.clip.end, project.duration);
  if (!bounds) throw new Error("The source duration is unavailable. Choose the video again before exporting.");
  const clip = { ...options.clip, ...bounds };
  const debug = (phase: string, detail?: unknown) => {
    console.log("[Frame & Key export]", phase, detail ?? "");
  };
  const duration = clip.end - clip.start;
  if (duration <= 0 || duration > 180) throw new Error("Choose a clip between 1 second and 3 minutes.");
  const height = project.settings.outputHeight;
  const width = Math.round(height * 9 / 16);
  const estimatedBytes = duration * (videoBitrateForHeight(height) + 128_000) / 8 + 4_000_000;
  if (!writable && estimatedBytes > 84 * 1024 * 1024) throw new Error("This browser cannot stream directly to a file. Use 720p, shorten the clip, or export it on a browser that supports direct file saving.");
  const ranges = remapRanges(project, clip);
  debug("start", { format, fileBytes: file.size, clipStart: clip.start, clipEnd: clip.end, ranges });
  debug("measurePeak:start", { enabled: project.settings.peakNormalize });
  const peak = project.settings.peakNormalize ? await measurePeak(file, clip.start, clip.end, signal) : 0;
  debug("measurePeak:done", { peak });
  const gain = peak > 0.001 ? Math.min(5, 0.89 / peak) : 1;
  const logo = project.settings.logo ? await createImageBitmap(project.settings.logo).catch(() => null) : null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas encoding is unavailable in this browser.");
  const fullVideoCanvas = document.createElement("canvas");
  fullVideoCanvas.width = width;
  fullVideoCanvas.height = Math.max(1, Math.min(height, Math.round(width * project.height / Math.max(1, project.width))));
  const fullVideoContext = fullVideoCanvas.getContext("2d", { alpha: false });
  if (!fullVideoContext) throw new Error("Full-video canvas is unavailable in this browser.");
  let firstVideoTime: number | null = null;
  let firstAudioTime: number | null = null;
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
  let cancelConversion: (() => void) | null = null;

  try {
    onProgress({ progress: 0, phase: "preparing", detail: "Preparing local video processing" });
    debug("Conversion.init:start");
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
          if (firstVideoTime == null) firstVideoTime = sample.timestamp;
          const localTime = Math.max(0, sample.timestamp - firstVideoTime);
          const mappedTime = mapSourceTimeToOutput(localTime, ranges);
          if (mappedTime == null) return null;
          const center = project.settings.smartFraming
            ? faceCenterAt(faceKeyframes, localTime, project.settings.manualCropX, project.settings.manualCropY)
            : { x: project.settings.manualCropX, y: project.settings.manualCropY };
          context.clearRect(0, 0, width, height);
          if (project.settings.framingMode === "full") {
            context.fillStyle = "#17261f";
            context.fillRect(0, 0, width, height);
            fullVideoContext.clearRect(0, 0, fullVideoCanvas.width, fullVideoCanvas.height);
            fullVideoContext.fillStyle = "#17261f";
            fullVideoContext.fillRect(0, 0, fullVideoCanvas.width, fullVideoCanvas.height);
            sample.drawWithFit(fullVideoContext, { fit: "fill" });
            context.drawImage(fullVideoCanvas, 0, (height - fullVideoCanvas.height) / 2, width, fullVideoCanvas.height);
          } else {
            const crop = cropForPortrait(sample.displayWidth, sample.displayHeight, 9 / 16, center.x, center.y);
            sample.drawWithFit(context, { fit: "cover", crop });
          }
          const absoluteTime = clip.start + localTime;
          if (project.settings.showCaptions) {
            const cue = cues.find((item) => absoluteTime >= item.start && absoluteTime <= item.end);
            drawCaption(context, cue, absoluteTime, height, project.settings);
          }
          drawTitleCard(context, clip, absoluteTime, project.settings);
          drawLogo(context, logo, project.settings.logoPosition, width, height);
          const frame = new VideoSample(canvas, { timestamp: mappedTime, duration: sample.duration });
          return frame;
        },
      },
      audio: {
        codec: format === "mp4" ? "aac" : "opus",
        quality: new Quality({ bitrate: 128_000 }),
        process: (sample) => {
          if (signal.aborted) return null;
          if (firstAudioTime == null) firstAudioTime = sample.timestamp;
          const localTime = Math.max(0, sample.timestamp - firstAudioTime);
          const mappedTime = mapSourceTimeToOutput(localTime + sample.duration / 2, ranges);
          if (mappedTime == null) return null;
          const buffer = sample.toAudioBuffer();
          const frames = sample.numberOfFrames;
          const channels = sample.numberOfChannels;
          const data = new Float32Array(frames * channels);
          for (let channel = 0; channel < channels; channel += 1) {
            const channelData = buffer.getChannelData(channel);
            const offset = channel * frames;
            for (let index = 0; index < frames; index += 1) data[offset + index] = Math.max(-1, Math.min(1, channelData[index] * gain));
          }
          const transformed = new AudioSample({ data, format: "f32-planar", numberOfChannels: channels, sampleRate: sample.sampleRate, timestamp: mappedTime });
          return transformed;
        },
      },
    });
    cancelConversion = () => { void conversion?.cancel(); };
    signal.addEventListener("abort", cancelConversion, { once: true });
    debug("Conversion.init:done", { isValid: conversion.isValid, discardedTracks: conversion.discardedTracks.map((item) => item.reason) });
    if (!conversion.isValid) {
      const discarded = conversion.discardedTracks.map((item) => item.reason).filter(Boolean).join("; ");
      throw new Error(discarded || "This video codec is not supported for export in this browser.");
    }
    conversion.onProgress = (progress) => onProgress({ progress, phase: "encoding", detail: `${Math.round(progress * 100)}% — encoding stays on this device` });
    if (signal.aborted) throw new DOMException("Export cancelled.", "AbortError");
    debug("Conversion.execute:start");
    await conversion.execute({ pauseSignal: signal });
    debug("Conversion.execute:done", { outputState: output.state });
    // Mediabunny may finish after a processor has observed an abort. Never expose
    // that partial/finalized file as a successful export.
    if (signal.aborted) throw new DOMException("Export cancelled.", "AbortError");
    if (target instanceof BufferTarget) {
      const buffer = target.buffer;
      if (!buffer) throw new Error("The export completed without a file buffer.");
      outputBlob = new Blob([buffer], { type: mimeFor(format) });
      bytesWritten = buffer.byteLength;
      debug("BufferTarget:done", { bytesWritten });
    }
    if (bytesWritten <= 0) throw new Error("The export completed without writing a media file.");
    onProgress({ progress: 1, phase: "complete", detail: "Your file is ready on this device" });
    return {
      filename: `${(clip.selectedTitle || project.name).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 56)}-clip-${Math.round(clip.start)}.${isWebm(format) ? "webm" : "mp4"}`,
      mimeType: mimeFor(format),
      blob: outputBlob,
      byteLength: bytesWritten,
      streamed: Boolean(writable),
    };
  } catch (error) {
    debug("failed", error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error);
    if (output.state !== "finalized" && output.state !== "canceled") await output.cancel().catch(() => undefined);
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    const message = error instanceof Error ? error.message : "Export failed on this device.";
    if (/memory|buffer|allocation/i.test(message)) throw new Error("This browser ran out of memory. Try 720p, a shorter clip, or saving one clip at a time.");
    throw new Error(message);
  } finally {
    if (cancelConversion) signal.removeEventListener("abort", cancelConversion);
    if (logo) logo.close();
    input.dispose();
  }
}
