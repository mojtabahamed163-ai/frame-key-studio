import { describe, expect, it } from "vitest";
import { cropForPortrait, portraitCropQuality, requestSaveTarget, supportedOutputFormat, videoBitrateForHeight } from "./convert-clip";

describe("video bitrate profile", () => {
  it("uses more headroom for both supported portrait output sizes", () => {
    expect(videoBitrateForHeight(1280)).toBe(6_000_000);
    expect(videoBitrateForHeight(1920)).toBe(12_000_000);
  });
});

describe("browser capability fallbacks", () => {
  it("reports no export format when WebCodecs is unavailable", async () => {
    const originalVideoEncoder = (globalThis as { VideoEncoder?: unknown }).VideoEncoder;
    const originalAudioEncoder = (globalThis as { AudioEncoder?: unknown }).AudioEncoder;
    try {
      delete (globalThis as { VideoEncoder?: unknown }).VideoEncoder;
      delete (globalThis as { AudioEncoder?: unknown }).AudioEncoder;
      await expect(supportedOutputFormat(1280)).resolves.toBeNull();
    } finally {
      if (originalVideoEncoder) (globalThis as { VideoEncoder?: unknown }).VideoEncoder = originalVideoEncoder;
      if (originalAudioEncoder) (globalThis as { AudioEncoder?: unknown }).AudioEncoder = originalAudioEncoder;
    }
  });

  it("falls back when an exposed save picker rejects", async () => {
    const originalWindow = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = {
      setTimeout,
      showSaveFilePicker: async () => { throw new Error("native picker unavailable"); },
    };
    try {
      await expect(requestSaveTarget("clip.webm", "webm-vp9")).resolves.toBeNull();
    } finally {
      if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window;
      else (globalThis as { window?: unknown }).window = originalWindow;
    }
  });
});

describe("portrait crop geometry", () => {
  it("reports when 1080 portrait output must enlarge a narrow landscape crop", () => {
    const quality = portraitCropQuality(1920, 1080, 1920);
    expect(quality.cropWidth).toBe(608);
    expect(quality.cropHeight).toBe(1080);
    expect(quality.isUpscaled).toBe(true);
    expect(quality.scale).toBeGreaterThan(1.7);
  });

  it("rounds a wide-source portrait crop to integer coordinates and dimensions", () => {
    const crop = cropForPortrait(1920, 1080, 9 / 16, 0.5, 0.5);
    expect(crop).toEqual({ left: 656, top: 0, width: 608, height: 1080 });
    expect(Object.values(crop).every(Number.isInteger)).toBe(true);
  });

  it("keeps edge-centered crops entirely inside the source", () => {
    const leftCrop = cropForPortrait(1920, 1080, 9 / 16, 0, 0.5);
    const rightCrop = cropForPortrait(1920, 1080, 9 / 16, 1, 0.5);
    expect(leftCrop.left).toBe(0);
    expect(rightCrop.left + rightCrop.width).toBe(1920);
    for (const crop of [leftCrop, rightCrop]) {
      expect(crop.left).toBeGreaterThanOrEqual(0);
      expect(crop.top).toBeGreaterThanOrEqual(0);
      expect(crop.left + crop.width).toBeLessThanOrEqual(1920);
      expect(crop.top + crop.height).toBeLessThanOrEqual(1080);
      expect(Object.values(crop).every(Number.isInteger)).toBe(true);
    }
  });

  it("handles portrait input without cropping and clamps out-of-range centers", () => {
    expect(cropForPortrait(1080, 1920, 9 / 16, -4, 4)).toEqual({ left: 0, top: 0, width: 1080, height: 1920 });
  });
});
