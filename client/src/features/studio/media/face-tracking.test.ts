import { describe, expect, it } from "vitest";
import { centerPortraitOnFace } from "./face-tracking";

describe("local portrait face framing", () => {
  it("keeps a face near the edge inside the horizontal-source crop when possible", () => {
    const framed = centerPortraitOnFace({ xMin: 20, yMin: 250, width: 110, height: 140 }, 1920, 1080, 0.1, 0.5);
    const cropWidth = (9 / 16) / (1920 / 1080);
    expect(framed.framingSafe).toBe(true);
    expect(framed.x - cropWidth / 2).toBeLessThanOrEqual(20 / 1920 + 0.0001);
    expect(framed.x + cropWidth / 2).toBeGreaterThanOrEqual((20 + 110) / 1920 - 0.0001);
  });

  it("reports when a face box is wider than a portrait crop", () => {
    const framed = centerPortraitOnFace({ xMin: 300, yMin: 200, width: 1000, height: 500 }, 1920, 1080, 0.5, 0.5);
    expect(framed.framingSafe).toBe(false);
    expect(framed.x).toBeGreaterThanOrEqual(0.158);
    expect(framed.x).toBeLessThanOrEqual(0.842);
  });
});
