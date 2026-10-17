import type { FaceTrackingState } from "../types";

export interface FaceBox { xMin: number; yMin: number; width: number; height: number }
export interface FaceKeyframe {
  time: number;
  x: number;
  y: number;
  /** Heuristic association/geometry score, not a calibrated MediaPipe detector confidence. */
  confidence: number;
  framingSafe?: boolean;
  state?: FaceTrackingState;
}
export interface FaceTrackingProgress { completed: number; total: number }
export interface FaceTrackingSummary {
  sampleCount: number;
  detectedCount: number;
  heldCount: number;
  manualCount: number;
  longestDetectionGapSeconds: number;
}

interface FacePoint { x: number; y: number; score?: number; name?: string }
interface DetectedFace { box: FaceBox; keypoints?: FacePoint[]; score?: number[] }
interface SourceRect { x: number; y: number; width: number; height: number }
export interface FaceObservation {
  time: number;
  box: FaceBox;
  x: number;
  y: number;
  confidence: number;
}
export interface FaceTrackSample { time: number; face: FaceObservation | null }

const FULL_FRAME_MAX_EDGE = 640;
const ROI_SIZE = 512;
const MAX_HOLD_SECONDS = 1.35;
export const MAX_FACE_ASSOCIATION_GAP_SECONDS = 3;
const ROI_SWEEP_SCORE_THRESHOLD = 0.62;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export function shouldResetFaceAssociation(elapsedSeconds: number): boolean {
  return !Number.isFinite(elapsedSeconds) || elapsedSeconds > MAX_FACE_ASSOCIATION_GAP_SECONDS;
}

export function centerPortraitOnFace(
  box: FaceBox,
  videoWidth: number,
  videoHeight: number,
  preferredX: number,
  preferredY: number,
): { x: number; y: number; framingSafe: boolean } {
  if (videoWidth <= 0 || videoHeight <= 0 || box.width <= 0 || box.height <= 0) {
    return { x: 0.5, y: 0.5, framingSafe: false };
  }
  const targetAspect = 9 / 16;
  const sourceAspect = videoWidth / videoHeight;
  const cropWidth = sourceAspect > targetAspect ? targetAspect / sourceAspect : 1;
  const cropHeight = sourceAspect > targetAspect ? 1 : sourceAspect / targetAspect;
  const halfCropWidth = cropWidth / 2;
  const halfCropHeight = cropHeight / 2;
  const left = clamp(box.xMin / videoWidth, 0, 1);
  const top = clamp(box.yMin / videoHeight, 0, 1);
  const right = clamp((box.xMin + box.width) / videoWidth, 0, 1);
  const bottom = clamp((box.yMin + box.height) / videoHeight, 0, 1);
  const minX = Math.max(halfCropWidth, right - halfCropWidth);
  const maxX = Math.min(1 - halfCropWidth, left + halfCropWidth);
  const minY = Math.max(halfCropHeight, bottom - halfCropHeight);
  const maxY = Math.min(1 - halfCropHeight, top + halfCropHeight);
  const framingSafe = minX <= maxX && minY <= maxY;
  if (framingSafe) {
    return {
      x: clamp(preferredX, minX, maxX),
      y: clamp(preferredY, minY, maxY),
      framingSafe: true,
    };
  }
  return {
    x: clamp((left + right) / 2, halfCropWidth, 1 - halfCropWidth),
    y: clamp((top + bottom) / 2, halfCropHeight, 1 - halfCropHeight),
    framingSafe: false,
  };
}

export function limitSubjectShift(
  previous: { x: number; y: number } | null,
  next: { x: number; y: number },
  maxShift = 0.18,
): { x: number; y: number } {
  if (!previous) return { x: clamp(next.x, 0, 1), y: clamp(next.y, 0, 1) };
  const distance = Math.hypot(next.x - previous.x, next.y - previous.y);
  if (distance <= maxShift) return { x: clamp(next.x, 0, 1), y: clamp(next.y, 0, 1) };
  const amount = maxShift / Math.max(0.0001, distance);
  return {
    x: clamp(previous.x + (next.x - previous.x) * amount, 0, 1),
    y: clamp(previous.y + (next.y - previous.y) * amount, 0, 1),
  };
}

export function smoothSubjectPosition(
  previous: { x: number; y: number } | null,
  next: { x: number; y: number },
  elapsedSeconds: number,
  associationQuality: number,
): { x: number; y: number } {
  if (!previous) return { x: clamp(next.x, 0, 1), y: clamp(next.y, 0, 1) };
  const elapsed = clamp(Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0, 0, 3);
  const quality = clamp(Number.isFinite(associationQuality) ? associationQuality : 0.35, 0, 1);
  const timeConstant = 0.72 - 0.5 * quality;
  const amount = elapsed <= 0 ? 0 : 1 - Math.exp(-elapsed / timeConstant);
  const blended = {
    x: previous.x + (next.x - previous.x) * amount,
    y: previous.y + (next.y - previous.y) * amount,
  };
  const shiftLimit = 0.18 + elapsed * (0.45 + 0.55 * quality) * 0.65;
  return limitSubjectShift(previous, blended, shiftLimit);
}

export function intersectionOverUnion(a: FaceBox, b: FaceBox): number {
  const left = Math.max(a.xMin, b.xMin);
  const top = Math.max(a.yMin, b.yMin);
  const right = Math.min(a.xMin + a.width, b.xMin + b.width);
  const bottom = Math.min(a.yMin + a.height, b.yMin + b.height);
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const union = a.width * a.height + b.width * b.height - intersection;
  return union > 0 ? intersection / union : 0;
}

function visibleFace(face: DetectedFace, width: number, height: number): { box: FaceBox; visibleRatio: number } | null {
  const box = face.box;
  if (![box.xMin, box.yMin, box.width, box.height].every(Number.isFinite) || box.width <= 0 || box.height <= 0) return null;
  const left = clamp(box.xMin, 0, width);
  const top = clamp(box.yMin, 0, height);
  const right = clamp(box.xMin + box.width, 0, width);
  const bottom = clamp(box.yMin + box.height, 0, height);
  const visibleWidth = right - left;
  const visibleHeight = bottom - top;
  const visibleArea = visibleWidth * visibleHeight;
  const visibleRatio = visibleArea / Math.max(1, box.width * box.height);
  if (visibleWidth <= 0 || visibleHeight <= 0 || visibleRatio < 0.55 || visibleHeight < height * 0.012) return null;
  const aspect = visibleWidth / visibleHeight;
  if (aspect < 0.3 || aspect > 2.2) return null;
  return { box: { xMin: left, yMin: top, width: visibleWidth, height: visibleHeight }, visibleRatio };
}

function keypointCoverage(face: DetectedFace, width: number, height: number): number {
  if (!face.keypoints?.length) return 0.35;
  const valid = face.keypoints.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)
    && point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height);
  return valid.length / face.keypoints.length;
}

/** Selects one face using geometry and temporal continuity. Its score is not model probability. */
export function chooseFaceCandidate(
  candidates: DetectedFace[],
  frameWidth: number,
  frameHeight: number,
  previous: FaceObservation | null,
  elapsedSeconds: number,
): FaceObservation | null {
  if (frameWidth <= 0 || frameHeight <= 0) return null;
  const frameArea = frameWidth * frameHeight;
  const elapsed = clamp(Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0, 0, 3);
  const ranked = candidates.flatMap((face) => {
    const visible = visibleFace(face, frameWidth, frameHeight);
    if (!visible) return [];
    const box = visible.box;
    const x = (box.xMin + box.width / 2) / frameWidth;
    const y = (box.yMin + box.height / 2) / frameHeight;
    const areaFraction = (box.width * box.height) / frameArea;
    const sizeScore = clamp((Math.sqrt(areaFraction) - 0.012) / 0.14, 0, 1);
    const landmarks = keypointCoverage(face, frameWidth, frameHeight);
    const centerDistance = Math.hypot(x - 0.5, y - 0.43);
    const composition = 1 - clamp(centerDistance / 0.78, 0, 1);
    const geometryScore = 0.40 * sizeScore + 0.27 * landmarks + 0.20 * composition + 0.13 * visible.visibleRatio;
    const modelScore = Number.isFinite(face.score?.[0]) ? clamp(face.score![0], 0, 1) : null;
    const baseScore = modelScore == null ? geometryScore : geometryScore * 0.8 + modelScore * 0.2;
    let score = baseScore;

    if (previous) {
      const distance = Math.hypot(x - previous.x, y - previous.y);
      const overlap = intersectionOverUnion(box, previous.box);
      // A long gap widens the gate only modestly; it never authorizes a large identity jump.
      const maxJump = 0.12 + 0.20 * Math.min(elapsed, 1.5);
      if (distance > maxJump && overlap < 0.02) return [];
      const proximity = Math.exp(-distance / Math.max(0.06, maxJump));
      const areaRatio = (box.width * box.height) / Math.max(1, previous.box.width * previous.box.height);
      const scaleSimilarity = Math.exp(-Math.abs(Math.log(Math.max(0.001, areaRatio))));
      score = 0.27 * baseScore + 0.34 * proximity + 0.25 * overlap + 0.14 * scaleSimilarity;
    }

    return [{ time: 0, box, x, y, confidence: clamp(score, 0, 1) }];
  });
  ranked.sort((a, b) => b.confidence - a.confidence);
  return ranked[0] ?? null;
}

/** Expands a face box for conservative headroom and upper-frame composition; this is not body detection. */
export function expandFaceForComposition(box: FaceBox): FaceBox {
  return {
    xMin: box.xMin - box.width * 0.34,
    yMin: box.yMin - box.height * 0.42,
    width: box.width * 1.68,
    height: box.height * 2.35,
  };
}

export function buildFaceKeyframes(
  samples: FaceTrackSample[],
  videoWidth: number,
  videoHeight: number,
  manualX: number,
  manualY: number,
): FaceKeyframe[] {
  const ordered = [...samples].sort((a, b) => a.time - b.time);
  const keyframes: FaceKeyframe[] = [];
  let lastReliable: FaceObservation | null = null;
  let lastCrop: { x: number; y: number } | null = null;
  const safeManual = { x: clamp(manualX, 0, 1), y: clamp(manualY, 0, 1) };
  const sourceAspect = videoWidth / Math.max(1, videoHeight);
  const cropHeight = sourceAspect > 9 / 16 ? 1 : sourceAspect / (9 / 16);

  for (const sample of ordered) {
    if (sample.face) {
      const elapsed = lastReliable ? Math.max(0, sample.time - lastReliable.time) : 0;
      const target = {
        x: sample.face.x,
        // Place the face slightly above center when the source geometry allows it.
        y: sample.face.y + (0.5 - 0.38) * cropHeight,
      };
      const smoothed = smoothSubjectPosition(lastCrop, target, elapsed, sample.face.confidence);
      const framed = centerPortraitOnFace(
        expandFaceForComposition(sample.face.box), videoWidth, videoHeight, smoothed.x, smoothed.y,
      );
      const crop = { x: framed.x, y: framed.y };
      keyframes.push({
        time: Math.max(0, sample.time),
        ...crop,
        confidence: clamp(sample.face.confidence, 0, 1),
        framingSafe: framed.framingSafe,
        state: "detected",
      });
      lastReliable = sample.face;
      lastCrop = crop;
      continue;
    }

    const gap = lastReliable ? Math.max(0, sample.time - lastReliable.time) : Number.POSITIVE_INFINITY;
    if (lastReliable && gap <= MAX_HOLD_SECONDS && lastCrop) {
      const freshness = clamp(1 - gap / MAX_HOLD_SECONDS, 0, 1);
      keyframes.push({
        time: Math.max(0, sample.time),
        ...lastCrop,
        confidence: lastReliable.confidence * freshness,
        framingSafe: true,
        state: "held",
      });
    } else {
      keyframes.push({
        time: Math.max(0, sample.time),
        ...safeManual,
        confidence: 0,
        framingSafe: true,
        state: "manual",
      });
      // A later plausible observation can reacquire the face without inheriting a stale crop trajectory.
      lastCrop = null;
    }
  }
  return keyframes;
}

export function summarizeFaceTrack(keyframes: FaceKeyframe[], durationSeconds: number): FaceTrackingSummary {
  const ordered = [...keyframes].sort((a, b) => a.time - b.time);
  const sampleCount = ordered.length;
  const detected = ordered.filter((frame) => (frame.state ?? "detected") === "detected");
  const heldCount = ordered.filter((frame) => frame.state === "held").length;
  const manualCount = ordered.filter((frame) => frame.state === "manual").length;
  let longestGap = 0;
  let lastDetectedTime: number | null = null;
  for (const frame of ordered) {
    if ((frame.state ?? "detected") !== "detected") continue;
    longestGap = Math.max(longestGap, lastDetectedTime == null ? Math.max(0, frame.time) : frame.time - lastDetectedTime);
    lastDetectedTime = frame.time;
  }
  if (lastDetectedTime != null) longestGap = Math.max(longestGap, Math.max(0, durationSeconds - lastDetectedTime));
  else longestGap = Math.max(0, durationSeconds);
  return {
    sampleCount,
    detectedCount: detected.length,
    heldCount,
    manualCount,
    longestDetectionGapSeconds: longestGap,
  };
}

export function faceCenterAt(
  keyframes: FaceKeyframe[],
  time: number,
  fallbackX = 0.5,
  fallbackY = 0.5,
): { x: number; y: number } {
  if (!keyframes.length) return { x: fallbackX, y: fallbackY };
  const ordered = [...keyframes].sort((a, b) => a.time - b.time);
  if (time <= ordered[0].time) return { x: ordered[0].x, y: ordered[0].y };
  const last = ordered[ordered.length - 1];
  if (time >= last.time) return { x: last.x, y: last.y };
  for (let index = 1; index < ordered.length; index += 1) {
    const right = ordered[index];
    const left = ordered[index - 1];
    if (time <= right.time) {
      const amount = (time - left.time) / Math.max(0.001, right.time - left.time);
      return { x: left.x + (right.x - left.x) * amount, y: left.y + (right.y - left.y) * amount };
    }
  }
  return { x: fallbackX, y: fallbackY };
}

function sourceRoi(previous: FaceObservation | null, width: number, height: number): SourceRect {
  const minDimension = Math.min(width, height);
  const desiredSide = previous ? Math.max(previous.box.width, previous.box.height) * 3.2 : minDimension * 0.88;
  const side = Math.min(width, height, clamp(desiredSide, minDimension * 0.28, minDimension * 0.90));
  const centerX = previous ? previous.x * width : width / 2;
  const centerY = previous ? previous.y * height : height / 2;
  return {
    x: clamp(centerX - side / 2, 0, Math.max(0, width - side)),
    y: clamp(centerY - side / 2, 0, Math.max(0, height - side)),
    width: side,
    height: side,
  };
}

/** A bounded six-tile zoom sweep, used only after a miss/weak initial match, never on every frame. */
export function buildRecoveryRois(width: number, height: number): SourceRect[] {
  if (width <= 0 || height <= 0) return [];
  const minDimension = Math.min(width, height);
  const side = Math.min(width, height, Math.max(2, minDimension * 0.38));
  const xCenters = [0.18, 0.5, 0.82];
  const yCenters = [0.22, 0.62];
  const rects = yCenters.flatMap((cy) => xCenters.map((cx) => ({
    x: clamp(cx * width - side / 2, 0, Math.max(0, width - side)),
    y: clamp(cy * height - side / 2, 0, Math.max(0, height - side)),
    width: side,
    height: side,
  })));
  return rects.filter((rect, index) => rects.findIndex((other) =>
    Math.abs(other.x - rect.x) < 1 && Math.abs(other.y - rect.y) < 1) === index);
}

function mapFacesToSource(faces: DetectedFace[], rect: SourceRect, canvasWidth: number, canvasHeight: number): DetectedFace[] {
  const scaleX = rect.width / canvasWidth;
  const scaleY = rect.height / canvasHeight;
  return faces.map((face) => ({
    box: {
      xMin: rect.x + face.box.xMin * scaleX,
      yMin: rect.y + face.box.yMin * scaleY,
      width: face.box.width * scaleX,
      height: face.box.height * scaleY,
    },
    keypoints: face.keypoints?.map((point) => ({
      ...point,
      x: rect.x + point.x * scaleX,
      y: rect.y + point.y * scaleY,
    })),
    score: face.score,
  }));
}

function abortError(): DOMException { return new DOMException("Face tracking cancelled.", "AbortError"); }

function waitForEvent(
  video: HTMLVideoElement,
  eventName: "loadedmetadata" | "loadeddata" | "seeked",
  signal: AbortSignal,
  timeoutMs: number,
): Promise<void> {
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener(eventName, onReady);
      video.removeEventListener("error", onError);
      signal.removeEventListener("abort", onAbort);
    };
    const onReady = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error("The video could not decode the requested frame.")); };
    const onAbort = () => { cleanup(); reject(abortError()); };
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Timed out while waiting for a decoded video frame. Try another clip or use manual framing."));
    }, timeoutMs);
    video.addEventListener(eventName, onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function waitForDecodedFrame(video: HTMLVideoElement, targetTime: number, signal: AbortSignal): Promise<void> {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await waitForEvent(video, "loadeddata", signal, 8_000);
  }
  if (signal.aborted) throw abortError();
  if (Math.abs(video.currentTime - targetTime) > 0.05) {
    const seeked = waitForEvent(video, "seeked", signal, 5_000);
    video.currentTime = targetTime;
    await seeked;
  }
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await waitForEvent(video, "loadeddata", signal, 5_000);
  }
  if (signal.aborted) throw abortError();

  if (typeof video.requestVideoFrameCallback === "function") {
    await new Promise<void>((resolve, reject) => {
      let frameRequest: number | null = null;
      const cleanup = () => {
        window.clearTimeout(timer);
        signal.removeEventListener("abort", onAbort);
        if (frameRequest != null) video.cancelVideoFrameCallback(frameRequest);
      };
      const finish = () => { cleanup(); resolve(); };
      const onAbort = () => { cleanup(); reject(abortError()); };
      const requestFrame = () => {
        frameRequest = video.requestVideoFrameCallback((_now, metadata) => {
          const frameTimeMatches = Math.abs(metadata.mediaTime - targetTime) <= 0.16;
          const seekPositionMatches = Math.abs(video.currentTime - targetTime) <= 0.05;
          if (frameTimeMatches || seekPositionMatches) finish();
          else requestFrame();
        });
      };
      const timer = window.setTimeout(() => {
        const decodedAtTarget = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
          && Math.abs(video.currentTime - targetTime) <= 0.05;
        cleanup();
        if (decodedAtTarget) resolve();
        else reject(new Error("Timed out while waiting for the requested video frame."));
      }, 1_500);
      signal.addEventListener("abort", onAbort, { once: true });
      requestFrame();
    });
  } else {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
  }
  if (signal.aborted) throw abortError();
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || Math.abs(video.currentTime - targetTime) > 0.05) {
    throw new Error("The requested video frame was not ready for face detection.");
  }
}

function sampleTimes(start: number, end: number): number[] {
  const duration = Math.max(0, end - start);
  const step = duration <= 25 ? 0.5 : duration <= 60 ? 0.8 : 1.2;
  const times = [start];
  for (let time = start + step; time < end - 0.025; time += step) times.push(time);
  if (end - start > 0.025) times.push(end);
  return [...new Set(times.map((time) => Number(time.toFixed(3))))];
}

export async function trackLargestFace(
  file: File,
  clipStart: number,
  clipEnd: number,
  signal: AbortSignal,
  onProgress: (progress: FaceTrackingProgress) => void,
  manualCrop = { x: 0.5, y: 0.5 },
): Promise<FaceKeyframe[]> {
  if (typeof window === "undefined" || !("WebGLRenderingContext" in window)) {
    throw new Error("This browser does not provide WebGL face detection. Manual framing remains available.");
  }
  if (signal.aborted) throw abortError();

  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  let detector: { estimateFaces: (input: HTMLCanvasElement, config: { flipHorizontal: boolean }) => Promise<DetectedFace[]>; dispose: () => void } | null = null;
  let fullCanvas: HTMLCanvasElement | null = null;
  let roiCanvas: HTMLCanvasElement | null = null;

  try {
    const tf = await import("@tensorflow/tfjs-core");
    await import("@tensorflow/tfjs-backend-webgl");
    if (!(await tf.setBackend("webgl"))) throw new Error("WebGL could not start. Use manual framing instead.");
    await tf.ready();
    if (signal.aborted) throw abortError();
    const faceDetection = await import("@tensorflow-models/face-detection");
    detector = await faceDetection.createDetector(faceDetection.SupportedModels.MediaPipeFaceDetector, {
      runtime: "tfjs",
      modelType: "full",
      maxFaces: 5,
    });

    video.src = sourceUrl;
    video.load();
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) await waitForEvent(video, "loadedmetadata", signal, 10_000);
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) await waitForEvent(video, "loadeddata", signal, 10_000);
    if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration)) {
      throw new Error("The browser could not read this clip's video dimensions or duration.");
    }

    const lastSampleTime = Math.max(0, video.duration - 0.03);
    const validStart = clamp(Number.isFinite(clipStart) ? clipStart : 0, 0, lastSampleTime);
    const validEnd = clamp(Number.isFinite(clipEnd) ? clipEnd : video.duration, validStart, lastSampleTime);
    const times = sampleTimes(validStart, validEnd);
    const scale = Math.min(1, FULL_FRAME_MAX_EDGE / Math.max(video.videoWidth, video.videoHeight));
    const fullWidth = Math.max(2, Math.round(video.videoWidth * scale));
    const fullHeight = Math.max(2, Math.round(video.videoHeight * scale));
    fullCanvas = document.createElement("canvas");
    fullCanvas.width = fullWidth;
    fullCanvas.height = fullHeight;
    roiCanvas = document.createElement("canvas");
    roiCanvas.width = ROI_SIZE;
    roiCanvas.height = ROI_SIZE;
    const fullContext = fullCanvas.getContext("2d");
    const roiContext = roiCanvas.getContext("2d");
    if (!fullContext || !roiContext) throw new Error("A 2D Canvas is not available for local face detection.");
    fullContext.imageSmoothingEnabled = true;
    fullContext.imageSmoothingQuality = "high";
    roiContext.imageSmoothingEnabled = true;
    roiContext.imageSmoothingQuality = "high";

    const samples: FaceTrackSample[] = [];
    let lastReliable: FaceObservation | null = null;
    let lastReliableAbsoluteTime: number | null = null;
    for (let index = 0; index < times.length; index += 1) {
      if (signal.aborted) throw abortError();
      const absoluteTime = times[index];
      await waitForDecodedFrame(video, absoluteTime, signal);

      // MediaPipe returned zero boxes for the HTMLVideoElement on the reproduced case;
      // drawing the same decoded timestamp to a bounded Canvas fixes that input path.
      fullContext.clearRect(0, 0, fullWidth, fullHeight);
      fullContext.drawImage(video, 0, 0, fullWidth, fullHeight);
      const fullFaces = mapFacesToSource(
        await detector.estimateFaces(fullCanvas, { flipHorizontal: false }),
        { x: 0, y: 0, width: video.videoWidth, height: video.videoHeight },
        fullWidth,
        fullHeight,
      );
      const elapsed = lastReliableAbsoluteTime == null ? 0 : Math.max(0, absoluteTime - lastReliableAbsoluteTime);
      const association = shouldResetFaceAssociation(elapsed) ? null : lastReliable;
      let face = chooseFaceCandidate(fullFaces, video.videoWidth, video.videoHeight, association, elapsed);

      // A small distributed sweep can rescue a distant/off-centre face without scaling every full frame.
      // It runs only on an initial weak match or periodically after a long miss; ordinary misses use one local ROI.
      const needsInitialSweep = index < 2 && (!face || face.confidence < ROI_SWEEP_SCORE_THRESHOLD);
      const needsReacquisitionSweep = !face && elapsed > MAX_HOLD_SECONDS && index % 8 === 0;
      if (!face || needsInitialSweep || needsReacquisitionSweep) {
        const rects = needsInitialSweep || needsReacquisitionSweep
          ? buildRecoveryRois(video.videoWidth, video.videoHeight)
          : [sourceRoi(lastReliable, video.videoWidth, video.videoHeight)];
        let bestRecovery: FaceObservation | null = null;
        for (const rect of rects) {
          roiContext.clearRect(0, 0, ROI_SIZE, ROI_SIZE);
          roiContext.drawImage(video, rect.x, rect.y, rect.width, rect.height, 0, 0, ROI_SIZE, ROI_SIZE);
          const roiFaces = mapFacesToSource(
            await detector.estimateFaces(roiCanvas, { flipHorizontal: false }),
            rect,
            ROI_SIZE,
            ROI_SIZE,
          );
          const candidate = chooseFaceCandidate(roiFaces, video.videoWidth, video.videoHeight, association, elapsed);
          if (candidate && (!bestRecovery || candidate.confidence > bestRecovery.confidence)) bestRecovery = candidate;
        }
        if (bestRecovery && (!face || bestRecovery.confidence > face.confidence)) face = bestRecovery;
      }
      if (face) {
        const observation = { ...face, time: absoluteTime - validStart };
        samples.push({ time: absoluteTime - validStart, face: observation });
        lastReliable = observation;
        lastReliableAbsoluteTime = absoluteTime;
      } else {
        samples.push({ time: absoluteTime - validStart, face: null });
        if (shouldResetFaceAssociation(elapsed)) lastReliable = null;
      }
      onProgress({ completed: index + 1, total: times.length });
    }

    if (!samples.some((sample) => sample.face)) {
      throw new Error("MediaPipe did not detect a usable face in the sampled frames. Manual horizontal framing remains available; this clip was not marked as automatically tracked.");
    }
    return buildFaceKeyframes(samples, video.videoWidth, video.videoHeight, manualCrop.x, manualCrop.y);
  } finally {
    detector?.dispose();
    video.pause();
    video.removeAttribute("src");
    video.load();
    if (fullCanvas) { fullCanvas.width = 0; fullCanvas.height = 0; }
    if (roiCanvas) { roiCanvas.width = 0; roiCanvas.height = 0; }
    URL.revokeObjectURL(sourceUrl);
  }
}
