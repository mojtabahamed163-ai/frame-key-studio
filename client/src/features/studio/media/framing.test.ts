import { describe, expect, it } from "vitest";
import { cropForPortrait, objectPositionForPortraitCrop } from "./framing";

const portraitAspect = 9 / 16;

describe("portrait preview crop alignment", () => {
  it("maps source-space horizontal crops to CSS overflow percentages", () => {
    const crop = cropForPortrait(1920, 1080, portraitAspect, 0.2, 0.5);
    const position = objectPositionForPortraitCrop(1920, 1080, portraitAspect, 0.2, 0.5);

    expect(crop).toEqual({ left: 80, top: 0, width: 608, height: 1080 });
    expect(position.x).toBeCloseTo(80 / (1920 - 608));
    expect(position.y).toBe(0.5);
  });

  it("aligns edge crops to the same source boundaries as export", () => {
    expect(objectPositionForPortraitCrop(1920, 1080, portraitAspect, 0, 0.5)).toEqual({ x: 0, y: 0.5 });
    expect(objectPositionForPortraitCrop(1920, 1080, portraitAspect, 1, 0.5)).toEqual({ x: 1, y: 0.5 });
  });

  it("maps vertical overflow when the source is narrower than the portrait target", () => {
    expect(objectPositionForPortraitCrop(720, 1440, portraitAspect, 0.5, 0.25).y).toBe(0);
    expect(objectPositionForPortraitCrop(720, 1440, portraitAspect, 0.5, 0.75).y).toBe(1);
  });

  it("centers an exact portrait source where there is no overflow", () => {
    expect(objectPositionForPortraitCrop(1080, 1920, portraitAspect, 0.1, 0.9)).toEqual({ x: 0.5, y: 0.5 });
  });
});
