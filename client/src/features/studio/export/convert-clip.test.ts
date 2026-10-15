import { describe, expect, it, vi } from "vitest";
import { cropForPortrait, portraitCropQuality, requestSaveTarget, titleCardGeometry, videoBitrateForHeight } from "./convert-clip";

describe("video bitrate profile", () => {
  it("uses more headroom for both supported portrait output sizes", () => {
    expect(videoBitrateForHeight(1280)).toBe(6_000_000);
    expect(videoBitrateForHeight(1920)).toBe(12_000_000);
  });
});

describe("save picker fallback", () => {
  it("does not reopen a picker that timed out without a response", async () => {
    const picker = vi.fn(() => new Promise<never>(() => undefined));
    const fakeWindow = {
      showSaveFilePicker: picker,
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    } as unknown as Window;
    vi.stubGlobal("window", fakeWindow);
    try {
      await expect(requestSaveTarget("clip.webm", "webm-vp9", 5)).resolves.toBeNull();
      await expect(requestSaveTarget("clip-again.webm", "webm-vp9", 5)).resolves.toBeNull();
      expect(picker).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
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

describe("title-card geometry", () => {
  it("keeps a three-line title inside a compact upper band", () => {
    const card = titleCardGeometry(720, 1280, 3, 36, 25);
    expect(card).toEqual({ x: 25, y: 58, width: 670, height: 160 });
    expect(card.y + card.height).toBeLessThan(1280 * 0.2);
  });
});
