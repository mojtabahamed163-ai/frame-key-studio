import { describe, expect, it } from "vitest";
import { parseSubtitleFile } from "./subtitles";

describe("subtitle file import", () => {
  it("parses numbered SRT cues and comma milliseconds", () => {
    const cues = parseSubtitleFile("1\n00:00:01,200 --> 00:00:02,700\nA clear line.\n\n2\n00:00:03,000 --> 00:00:04,000\nTry the next edit.");
    expect(cues).toHaveLength(2);
    expect(cues[0].start).toBe(1.2);
    expect(cues[0].end).toBe(2.7);
    expect(cues[1].text).toBe("Try the next edit.");
  });

  it("parses WEBVTT cues and strips cue markup", () => {
    const cues = parseSubtitleFile("\uFEFFWEBVTT\n\n00:02.000 --> 00:04.200\n<c.bold>Check the caption</c>");
    expect(cues).toHaveLength(1);
    expect(cues[0].start).toBe(2);
    expect(cues[0].text).toBe("Check the caption");
  });

  it("rejects a file without valid cue timestamps", () => {
    expect(() => parseSubtitleFile("not subtitles" )).toThrow("No valid SRT/VTT");
  });

  it.each(["-00:00:01,000", "00:00:61,000", "00:61:00,000", "-1:20.000", "00:00:01,1234"])(
    "rejects an invalid timestamp component: %s",
    (timestamp) => {
      expect(() => parseSubtitleFile(`1\n${timestamp} --> 00:00:02,000\nCaption`)).toThrow("No valid SRT/VTT");
    },
  );
});
