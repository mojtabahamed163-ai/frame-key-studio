export interface FaceKeyframe {
  time: number;
  x: number;
  y: number;
  confidence: number;
  framingSafe?: boolean;
}

export interface FaceTrackingProgress {
  completed: number;
  total: number;
}

type FaceBox = { xMin: number; yMin: number; width: number; height: number };
type DetectedFace = { box: FaceBox; score?: number[] };

export function centerPortraitOnFace(box: FaceBox, videoWidth: number, videoHeight: number, preferredX: number, preferredY: number): { x: number; y: number; framingSafe: boolean } {
  const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
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
  const fallbackX = clamp((left + right) / 2, halfCropWidth, 1 - halfCropWidth);
  const fallbackY = clamp((top + bottom) / 2, halfCropHeight, 1 - halfCropHeight);
  return { x: fallbackX, y: fallbackY, framingSafe: false };
}

function waitForEvent(video: HTMLVideoElement, eventName: "loadedmetadata" | "seeked"): Promise<void> {
  return new Promise((resolve, reject) => {
    const onReady = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error("The video frame could not be read.")); };
    const cleanup = () => {
      video.removeEventListener(eventName, onReady);
      video.removeEventListener("error", onError);
    };
    video.addEventListener(eventName, onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

export async function trackLargestFace(
  file: File,
  clipStart: number,
  clipEnd: number,
  signal: AbortSignal,
  onProgress: (progress: FaceTrackingProgress) => void,
): Promise<FaceKeyframe[]> {
  if (!("createImageBitmap" in window) || !("WebGLRenderingContext" in window)) {
    throw new Error("This browser does not provide WebGL face detection. Manual framing remains available.");
  }
  const tf = await import("@tensorflow/tfjs-core");
  await import("@tensorflow/tfjs-backend-webgl");
  if (!(await tf.setBackend("webgl"))) throw new Error("WebGL could not start. Use manual framing instead.");
  await tf.ready();
  const faceDetection = await import("@tensorflow-models/face-detection");
  const detector = await faceDetection.createDetector(faceDetection.SupportedModels.MediaPipeFaceDetector, {
    runtime: "tfjs",
    modelType: "short",
    maxFaces: 3,
  });
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  const span = Math.max(0, clipEnd - clipStart);
  const step = span <= 25 ? 0.5 : span <= 60 ? 0.8 : 1.2;
  const sampleTimes: number[] = [];
  for (let time = clipStart; time <= clipEnd; time += step) sampleTimes.push(Math.min(time, clipEnd));
  if (sampleTimes.length === 0 || sampleTimes[sampleTimes.length - 1] < clipEnd) sampleTimes.push(clipEnd);
  const keyframes: FaceKeyframe[] = [];
  let previous: { x: number; y: number } | null = null;
  try {
    const metadataReady = waitForEvent(video, "loadedmetadata");
    video.load();
    await metadataReady;
    for (let index = 0; index < sampleTimes.length; index += 1) {
      if (signal.aborted) throw new DOMException("Face tracking cancelled.", "AbortError");
      const time = sampleTimes[index];
      if (time > 0) {
        const sought = waitForEvent(video, "seeked");
        video.currentTime = time;
        await sought;
      }
      const faces = await detector.estimateFaces(video, { flipHorizontal: false }) as DetectedFace[];
      const ranked = faces
        .filter((face) => face.box && face.box.width > 0 && face.box.height > 0)
        .map((face) => {
          const x = (face.box.xMin + face.box.width / 2) / Math.max(1, video.videoWidth);
          const y = (face.box.yMin + face.box.height / 2) / Math.max(1, video.videoHeight);
          const area = face.box.width * face.box.height;
          const proximity = previous ? Math.hypot(x - previous.x, y - previous.y) : 0;
          const confidence = face.score?.[0] ?? 0.5;
          return { x, y, confidence, rank: area * confidence / (1 + proximity * 3), box: face.box };
        })
        .sort((a, b) => b.rank - a.rank);
      const best = ranked[0];
      if (best) {
        const smoothed = previous ? { x: previous.x * 0.35 + best.x * 0.65, y: previous.y * 0.35 + best.y * 0.65 } : { x: best.x, y: best.y };
        const framed = centerPortraitOnFace(best.box, video.videoWidth, video.videoHeight, smoothed.x, smoothed.y);
        previous = { x: framed.x, y: framed.y };
        keyframes.push({ time: time - clipStart, ...framed, confidence: best.confidence });
      }
      onProgress({ completed: index + 1, total: sampleTimes.length });
    }
    if (keyframes.length < 2) throw new Error("A stable face was not detected in this clip. Manual framing remains available.");
    return keyframes;
  } finally {
    detector.dispose();
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

export function faceCenterAt(keyframes: FaceKeyframe[], time: number, fallbackX = 0.5, fallbackY = 0.5): { x: number; y: number } {
  if (!keyframes.length) return { x: fallbackX, y: fallbackY };
  if (time <= keyframes[0].time) return keyframes[0];
  const last = keyframes[keyframes.length - 1];
  if (time >= last.time) return last;
  for (let index = 1; index < keyframes.length; index += 1) {
    const right = keyframes[index];
    const left = keyframes[index - 1];
    if (time <= right.time) {
      const amount = (time - left.time) / Math.max(0.001, right.time - left.time);
      return { x: left.x + (right.x - left.x) * amount, y: left.y + (right.y - left.y) * amount };
    }
  }
  return { x: fallbackX, y: fallbackY };
}
