import { describe, expect, it } from "vitest";
import { cropForPortrait } from "./convert-clip";

describe("portrait crop geometry", () => {
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
