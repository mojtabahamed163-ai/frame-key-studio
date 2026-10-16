import { describe, expect, it } from "vitest";
import {
  buildFaceKeyframes,
  buildRecoveryRois,
  centerPortraitOnFace,
  chooseFaceCandidate,
  expandFaceForComposition,
  faceCenterAt,
  intersectionOverUnion,
  limitSubjectShift,
  smoothSubjectPosition,
  summarizeFaceTrack,
  type FaceObservation,
} from "./face-tracking";

const face = (xMin: number, yMin = 240, width = 120, height = 150) => ({
  box: { xMin, yMin, width, height },
  keypoints: [
    { x: xMin + width * 0.35, y: yMin + height * 0.35 },
    { x: xMin + width * 0.65, y: yMin + height * 0.35 },
    { x: xMin + width * 0.5, y: yMin + height * 0.52 },
    { x: xMin + width * 0.5, y: yMin + height * 0.72 },
    { x: xMin + width * 0.1, y: yMin + height * 0.5 },
    { x: xMin + width * 0.9, y: yMin + height * 0.5 },
  ],
});

const observation = (time: number, xMin: number, width = 120, height = 150): FaceObservation => ({
  time,
  box: { xMin, yMin: 240, width, height },
  x: (xMin + width / 2) / 1920,
  y: (240 + height / 2) / 1080,
  confidence: 0.75,
});

describe("local portrait face framing", () => {
  it("searches bounded upper and off-center ROIs only as recovery regions", () => {
    const regions = buildRecoveryRois(1920, 1080);
    expect(regions).toHaveLength(6);
    expect(regions.some((region) => region.x > 1200 && region.y < 100)).toBe(true);
    expect(regions.every((region) => region.x >= 0 && region.y >= 0
      && region.x + region.width <= 1920 && region.y + region.height <= 1080)).toBe(true);
    expect(buildRecoveryRois(0, 1080)).toEqual([]);
  });

  it("limits abrupt movement while keeping coordinates inside the frame", () => {
    const next = limitSubjectShift({ x: 0.5, y: 0.5 }, { x: 0.95, y: 0.5 }, 0.18);
    expect(next.x).toBeCloseTo(0.68, 5);
    expect(next.y).toBe(0.5);
    expect(limitSubjectShift(null, { x: 3, y: -1 })).toEqual({ x: 1, y: 0 });
  });

  it("responds more quickly to a stronger match without becoming discontinuous", () => {
    const previous = { x: 0.5, y: 0.5 };
    const target = { x: 0.9, y: 0.5 };
    const strong = smoothSubjectPosition(previous, target, 0.5, 0.9);
    const weak = smoothSubjectPosition(previous, target, 0.5, 0.2);
    expect(strong.x).toBeGreaterThan(weak.x);
    expect(strong.x).toBeLessThan(target.x);
    expect(weak.x).toBeLessThan(target.x);
  });

  it("selects a visible, well-composed initial face instead of blindly taking the largest edge face", () => {
    const selected = chooseFaceCandidate([
      face(860, 210, 210, 250),
      face(1600, 280, 260, 330),
    ], 1920, 1080, null, 0);
    expect(selected).not.toBeNull();
    expect(selected!.x).toBeLessThan(0.7);
  });

  it("keeps the prior face over a larger unrelated face and rejects a distant switch", () => {
    const previous = observation(0, 210);
    const selected = chooseFaceCandidate([
      face(225, 240, 125, 150),
      face(1200, 220, 360, 430),
    ], 1920, 1080, previous, 0.5);
    expect(selected).not.toBeNull();
    expect(selected!.x).toBeLessThan(0.3);

    const rejected = chooseFaceCandidate([face(1300, 220, 360, 430)], 1920, 1080, previous, 0.5);
    expect(rejected).toBeNull();
  });

  it("uses IoU to measure face-box continuity", () => {
    const box = { xMin: 10, yMin: 20, width: 100, height: 120 };
    expect(intersectionOverUnion(box, box)).toBe(1);
    expect(intersectionOverUnion(box, { xMin: 500, yMin: 500, width: 100, height: 120 })).toBe(0);
  });

  it("retains a short missed interval and then returns to manual framing", () => {
    const frames = buildFaceKeyframes([
      { time: 0, face: observation(0, 600) },
      { time: 0.5, face: null },
      { time: 1.0, face: null },
      { time: 2.0, face: null },
    ], 1920, 1080, 0.78, 0.52);
    expect(frames.map((frame) => frame.state)).toEqual(["detected", "held", "held", "manual"]);
    expect(frames[1].x).toBe(frames[0].x);
    expect(frames[2].confidence).toBeLessThan(frames[1].confidence);
    expect(frames[3].x).toBe(0.78);
    expect(frames[3].confidence).toBe(0);
  });

  it("keeps a single observation as a partial result instead of requiring two keyframes", () => {
    const frames = buildFaceKeyframes([{ time: 0.25, face: observation(0.25, 700) }], 1920, 1080, 0.62, 0.5);
    expect(frames).toHaveLength(1);
    expect(frames[0].state).toBe("detected");
  });

  it("expands a face box with conservative headroom without claiming body detection", () => {
    const original = { xMin: 700, yMin: 240, width: 120, height: 150 };
    const expanded = expandFaceForComposition(original);
    expect(expanded.xMin).toBeLessThan(original.xMin);
    expect(expanded.yMin).toBeLessThan(original.yMin);
    expect(expanded.width).toBeGreaterThan(original.width);
    expect(expanded.height).toBeGreaterThan(original.height);
  });

  it("keeps a face near the edge inside the horizontal-source crop when possible", () => {
    const framed = centerPortraitOnFace({ xMin: 20, yMin: 250, width: 110, height: 140 }, 1920, 1080, 0.1, 0.5);
    const cropWidth = (9 / 16) / (1920 / 1080);
    expect(framed.framingSafe).toBe(true);
    expect(framed.x - cropWidth / 2).toBeLessThanOrEqual(20 / 1920 + 0.0001);
    expect(framed.x + cropWidth / 2).toBeGreaterThanOrEqual((20 + 110) / 1920 - 0.0001);
  });

  it("keeps the actual face safe when expanded headroom is wider than the portrait crop", () => {
    const box = { xMin: 760, yMin: 350, width: 400, height: 140 };
    const tracked = buildFaceKeyframes([{
      time: 0,
      face: {
        time: 0,
        box,
        x: 0.5,
        y: (box.yMin + box.height / 2) / 1080,
        confidence: 0.9,
      },
    }], 1920, 1080, 0.5, 0.5)[0];
    const cropWidth = (9 / 16) / (1920 / 1080);
    expect(expandFaceForComposition(box).width).toBeGreaterThan(cropWidth * 1920);
    expect(tracked.framingSafe).toBe(true);
    expect(tracked.x - cropWidth / 2).toBeLessThanOrEqual(box.xMin / 1920 + 0.0001);
    expect(tracked.x + cropWidth / 2).toBeGreaterThanOrEqual((box.xMin + box.width) / 1920 - 0.0001);
  });

  it("reports when an expanded subject cannot fit in a portrait crop", () => {
    const framed = centerPortraitOnFace({ xMin: 300, yMin: 200, width: 1000, height: 900 }, 1920, 1080, 0.5, 0.5);
    expect(framed.framingSafe).toBe(false);
    expect(framed.x).toBeGreaterThanOrEqual(0.158);
    expect(framed.x).toBeLessThanOrEqual(0.842);
  });

  it("summarizes detected, held, manual, and longest gap time separately", () => {
    const frames = [
      { time: 0, x: 0.5, y: 0.5, confidence: 0, state: "manual" as const },
      { time: 0.5, x: 0.5, y: 0.5, confidence: 0.8, state: "detected" as const },
      { time: 1, x: 0.5, y: 0.5, confidence: 0.3, state: "held" as const },
      { time: 2, x: 0.5, y: 0.5, confidence: 0, state: "manual" as const },
    ];
    expect(summarizeFaceTrack(frames, 2)).toEqual({
      sampleCount: 4,
      detectedCount: 1,
      heldCount: 1,
      manualCount: 2,
      longestDetectionGapSeconds: 1.5,
    });
  });

  it("interpolates between tracked and manual fallback keyframes", () => {
    const frames = [
      { time: 0, x: 0.2, y: 0.4, confidence: 0.8, state: "detected" as const },
      { time: 2, x: 0.8, y: 0.6, confidence: 0, state: "manual" as const },
    ];
    expect(faceCenterAt(frames, 1)).toEqual({ x: 0.5, y: 0.5 });
    expect(faceCenterAt([], 1, 0.7, 0.6)).toEqual({ x: 0.7, y: 0.6 });
  });
});
