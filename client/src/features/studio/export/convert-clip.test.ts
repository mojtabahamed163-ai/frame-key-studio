import { describe, expect, it, vi } from "vitest";
import { unzipSync } from "fflate";
import { cropForPortrait, drawExportFrame, exportClip, portraitCropQuality, requestSaveTarget, titleCardGeometry, videoBitrateForHeight } from "./convert-clip";
import { createZip, uniqueFilename } from "./download";
import { mapSourceTimeToOutput } from "../analysis/clip-analysis";
import { DEFAULT_SETTINGS } from "../types";
import type { ClipSuggestion, StudioProject } from "../types";

describe("video bitrate profile", () => {
  it("uses more headroom for both supported portrait output sizes", () => {
    expect(videoBitrateForHeight(1280)).toBe(6_000_000);
    expect(videoBitrateForHeight(1920)).toBe(12_000_000);
  });
});

describe("batch filenames", () => {
  it("makes repeated names unique", () => {
    const used = new Set<string>();
    expect(uniqueFilename("same.webm", used)).toBe("same.webm");
    expect(uniqueFilename("same.webm", used)).toBe("same-2.webm");
    expect(uniqueFilename("same.webm", used)).toBe("same-3.webm");
    expect(uniqueFilename("SAME.WEBM", used)).toBe("SAME-4.WEBM");
  });

  it("keeps duplicate direct ZIP entries instead of silently overwriting one", async () => {
    const blob = createZip([
      { name: "same.webm", data: new Uint8Array([1]) },
      { name: "same.webm", data: new Uint8Array([2]) },
    ]);
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    expect(Object.keys(files).sort()).toEqual(["same-2.webm", "same.webm"]);
    expect([...files["same.webm"]]).toEqual([1]);
    expect([...files["same-2.webm"]]).toEqual([2]);
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

describe("export source boundaries", () => {
  it("refuses a clip that extends beyond the source duration", async () => {
    const project = { duration: 30.75 } as StudioProject;
    const clip = { start: 20, end: 38.38 } as ClipSuggestion;
    await expect(exportClip({
      file: new File([], "source.mp4"),
      project,
      clip,
      cues: [],
      faceKeyframes: [],
      format: "webm-vp9",
      signal: new AbortController().signal,
      onProgress: vi.fn(),
    })).rejects.toThrow("outside the source video");
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

describe("full-frame and compressed-time rendering", () => {
  function fakeCanvasContext(width: number, height: number) {
    return {
      canvas: { width, height },
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  }

  it("contains a 720×1440 source in a 720×1280 output without stretching", () => {
    const context = fakeCanvasContext(720, 1280);
    let fitted = { width: 0, height: 0 };
    const sample = {
      displayWidth: 720,
      displayHeight: 1440,
      drawWithFit: vi.fn((target: CanvasRenderingContext2D, options: { fit: string }) => {
        expect(options.fit).toBe("contain");
        const scale = Math.min(target.canvas.width / 720, target.canvas.height / 1440);
        fitted = { width: 720 * scale, height: 1440 * scale };
      }),
    };
    const clip = { start: 0, end: 2, selectedTitle: "Title", titleOptions: [] } as ClipSuggestion;
    const settings = { ...DEFAULT_SETTINGS, framingMode: "full" as const, showTitleCard: false, showCaptions: false };

    const outputTime = drawExportFrame(context, sample as never, 0, [{ start: 0, end: 2 }], clip, [], [], settings, null);

    expect(outputTime).toBe(0);
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 720, 1280);
    expect(fitted).toEqual({ width: 640, height: 1280 });
    expect(fitted.width / fitted.height).toBeCloseTo(720 / 1440);
  });

  it("draws the title at output time zero when the first kept range starts after silence", () => {
    const context = fakeCanvasContext(720, 1280);
    const sample = { displayWidth: 720, displayHeight: 1280, drawWithFit: vi.fn() };
    const clip = { start: 10, end: 20, selectedTitle: "Opening title", titleOptions: [] } as ClipSuggestion;
    const settings = { ...DEFAULT_SETTINGS, framingMode: "full" as const, showTitleCard: true, showCaptions: false };
    const ranges = [{ start: 3, end: 5 }, { start: 8, end: 10 }];

    const mapped = mapSourceTimeToOutput(3, ranges);
    const outputTime = drawExportFrame(context, sample as never, 3, ranges, clip, [], [], settings, null);

    expect(mapped).toBe(0);
    expect(outputTime).toBe(0);
    expect(context.fillText).toHaveBeenCalledWith("Opening title", 360, expect.any(Number), expect.any(Number));
  });
});
