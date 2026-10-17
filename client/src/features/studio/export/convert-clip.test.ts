import { describe, expect, it, vi } from "vitest";
import { unzipSync } from "fflate";
import {
  cropForPortrait,
  drawExportFrame,
  executeConversionWithAbort,
  exportClip,
  mapAudioSampleToRanges,
  mapIntervalToOutputSegments,
  mapSourceTimeToExportOutput,
  portraitCropQuality,
  remapRanges,
  resolveOutputPreviewSourceTime,
  requestSaveTarget,
  supportedOutputFormat,
  titleCardGeometry,
  videoBitrateForHeight,
} from "./convert-clip";
import { createZip, uniqueFilename } from "./download";
import { mapSourceTimeToOutput } from "../analysis/clip-analysis";
import { DEFAULT_SETTINGS } from "../types";
import type { Conversion } from "mediabunny";
import type { ClipSuggestion, SpeechRange, StudioProject } from "../types";

describe("video bitrate profile", () => {
  it("uses more headroom for both supported portrait output sizes", () => {
    expect(videoBitrateForHeight(1280)).toBe(6_000_000);
    expect(videoBitrateForHeight(1920)).toBe(12_000_000);
  });

  it("allows silent-video export when VideoEncoder exists but AudioEncoder does not", async () => {
    const FakeVideoEncoder = Object.assign(function FakeVideoEncoder() {}, {
      isConfigSupported: vi.fn(async () => ({ supported: true })),
    });
    vi.stubGlobal("VideoEncoder", FakeVideoEncoder);
    vi.stubGlobal("AudioEncoder", undefined);
    try {
      await expect(supportedOutputFormat(1280, false)).resolves.toBe("mp4");
      await expect(supportedOutputFormat(1280, true)).resolves.toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("A/V timeline mapping", () => {
  const ranges: SpeechRange[] = [{ start: 0, end: 1 }, { start: 3, end: 4 }];

  it("keeps a legitimate audio-to-video offset on the shared clip origin", () => {
    const video = mapIntervalToOutputSegments(0, 1 / 30, [{ start: 0, end: 2 }]);
    const audio = mapAudioSampleToRanges(0.1, 480, 48_000, [{ start: 0, end: 2 }]);
    expect(video[0].outputTime).toBe(0);
    expect(audio[0].outputTime).toBeCloseTo(0.1, 6);
  });

  it("splits audio samples crossing removed-silence boundaries without moving the kept tail", () => {
    const before = mapAudioSampleToRanges(0.95, 4_800, 48_000, ranges);
    const after = mapAudioSampleToRanges(2.95, 4_800, 48_000, ranges);
    expect(before).toHaveLength(1);
    expect(before[0]).toMatchObject({ startFrame: 0, endFrame: 2_400, outputTime: 0.95 });
    expect(before[0].duration).toBeCloseTo(0.05, 6);
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({ startFrame: 2_400, endFrame: 4_800, outputTime: 1 });
    expect(after[0].duration).toBeCloseTo(0.05, 6);
  });

  it("clips video frame duration at each kept-range boundary", () => {
    expect(mapIntervalToOutputSegments(0.95, 0.1, ranges)).toEqual([
      { sourceStart: 0.95, duration: expect.closeTo(0.05, 6), outputTime: 0.95 },
    ]);
    expect(mapIntervalToOutputSegments(2.95, 0.1, ranges)).toEqual([
      { sourceStart: 3, duration: expect.closeTo(0.05, 6), outputTime: 1 },
    ]);
  });

  it("pads compressed range boundaries to unique 30fps output timestamps", () => {
    const decimalRanges = [{ start: 1.38, end: 2.22 }, { start: 3.68, end: 4.52 }];
    expect(mapSourceTimeToExportOutput(2.2, decimalRanges)).toBeCloseTo(0.82, 6);
    expect(mapSourceTimeToExportOutput(3.68, decimalRanges)).toBeCloseTo(26 / 30, 6);
    const lastFrameBeforeGap = mapIntervalToOutputSegments(2.2, 1 / 30, decimalRanges)[0];
    const firstFrameAfterGap = mapIntervalToOutputSegments(3.6666667, 1 / 30, decimalRanges)[0];
    expect(firstFrameAfterGap.outputTime - lastFrameBeforeGap.outputTime).toBeGreaterThanOrEqual(1 / 30);
  });

  it("resolves preview seeks to kept source time and stops at the last exported range", () => {
    const decimalRanges = [{ start: 1.38, end: 2.22 }, { start: 3.68, end: 4.52 }];
    expect(resolveOutputPreviewSourceTime(0, decimalRanges)).toBeCloseTo(1.38, 6);
    expect(resolveOutputPreviewSourceTime(0.5, decimalRanges)).toBeCloseTo(1.38, 6);
    expect(resolveOutputPreviewSourceTime(2.5, decimalRanges)).toBeCloseTo(3.68, 6);
    expect(resolveOutputPreviewSourceTime(3.8, decimalRanges)).toBeCloseTo(3.8, 6);
    expect(resolveOutputPreviewSourceTime(5, decimalRanges)).toBeCloseTo(4.52, 6);
  });
});

describe("manual subtitle silence ranges", () => {
  const clip = { start: 0, end: 6 } as ClipSuggestion;
  const project = {
    settings: { ...DEFAULT_SETTINGS, silenceRemoval: true, silenceThresholdSeconds: 1.2 },
    words: [],
    editedCues: [
      { id: "cue-1", start: 1.5, end: 2.1, text: "Keep this line.", words: [] },
      { id: "cue-2", start: 3.8, end: 4.4, text: "Second retained line.", words: [] },
    ],
  } as StudioProject;

  it("uses imported SRT cue timing when no Whisper words are available", () => {
    const ranges = remapRanges(project, clip);
    expect(ranges).toHaveLength(2);
    expect(ranges[0].start).toBeCloseTo(1.38, 6);
    expect(ranges[0].end).toBeCloseTo(2.22, 6);
    expect(ranges[1].start).toBeCloseTo(3.68, 6);
    expect(ranges[1].end).toBeCloseTo(4.52, 6);
  });

  it("uses timed words inside edited cues when the Whisper transcript is empty", () => {
    const withTimedEditedCue = {
      ...project,
      editedCues: [{
        id: "word-cue",
        start: 1.5,
        end: 2.1,
        text: "Keep this line.",
        words: [{ id: "word-1", text: "Keep", start: 1.5, end: 2.1 }],
      }],
    } as StudioProject;
    const ranges = remapRanges(withTimedEditedCue, clip);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].start).toBeCloseTo(1.38, 6);
    expect(ranges[0].end).toBeCloseTo(2.22, 6);
  });

  it("keeps the complete clip when silence removal is disabled", () => {
    const withoutRemoval = {
      ...project,
      settings: { ...project.settings, silenceRemoval: false },
    } as StudioProject;
    expect(remapRanges(withoutRemoval, clip)).toEqual([{ start: 0, end: 6 }]);
  });
});

describe("conversion cancellation", () => {
  it("cancels a running conversion and rejects even if execute resolves afterwards", async () => {
    let finish!: () => void;
    let state: "executing" | "canceled" = "executing";
    const conversion = {
      get state() { return state; },
      execute: () => new Promise<void>((resolve) => { finish = resolve; }),
      cancel: vi.fn(async () => { state = "canceled"; finish(); }),
    } as unknown as Conversion;
    const controller = new AbortController();
    const pending = executeConversionWithAbort(conversion, controller.signal);

    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(conversion.cancel).toHaveBeenCalledTimes(1);
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
  it("enforces the one-second minimum stated to the user", async () => {
    const project = { duration: 30 } as StudioProject;
    const clip = { start: 1, end: 1.5 } as ClipSuggestion;
    await expect(exportClip({
      file: new File([], "source.mp4"),
      project,
      clip,
      cues: [],
      faceKeyframes: [],
      format: "webm-vp9",
      signal: new AbortController().signal,
      onProgress: vi.fn(),
    })).rejects.toThrow("between 1 second and 3 minutes");
  });

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
