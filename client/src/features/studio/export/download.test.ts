import { describe, expect, it } from "vitest";
import { unzipSync } from "fflate";
import { createZip, safeFileStem, uniqueFilename } from "./download";

describe("export filenames and ZIP archives", () => {
  it("makes repeated clip titles distinct without changing their extension", () => {
    const used = new Set<string>();
    expect(uniqueFilename("same-title.mp4", used)).toBe("same-title.mp4");
    expect(uniqueFilename("same-title.mp4", used)).toBe("same-title-2.mp4");
    expect(uniqueFilename("same-title.mp4", used)).toBe("same-title-3.mp4");
    expect([...used]).toEqual([
      "same-title.mp4",
      "same-title-2.mp4",
      "same-title-3.mp4",
    ]);
  });

  it("keeps every repeated-title export in the ZIP with valid bytes", async () => {
    const used = new Set<string>();
    const names = ["Room tour", "Room tour"].map(title =>
      uniqueFilename(`${safeFileStem(title)}.webm`, used)
    );
    const archive = createZip(
      names.map((name, index) => ({
        name,
        data: new Uint8Array([index + 1, 2, 3]),
      }))
    );
    const files = unzipSync(new Uint8Array(await archive.arrayBuffer()));
    expect(Object.keys(files)).toEqual(["Room-tour.webm", "Room-tour-2.webm"]);
    expect([...files["Room-tour.webm"]]).toEqual([1, 2, 3]);
    expect([...files["Room-tour-2.webm"]]).toEqual([2, 2, 3]);
  });

  it("rejects unsafe or duplicate archive entries instead of silently replacing them", () => {
    expect(() =>
      createZip([{ name: "../clip.mp4", data: new Uint8Array([1]) }])
    ).toThrow(/file names/);
    expect(() =>
      createZip([
        { name: "clip.mp4", data: new Uint8Array([1]) },
        { name: "clip.mp4", data: new Uint8Array([2]) },
      ])
    ).toThrow(/Duplicate ZIP entry/);
    expect(() =>
      createZip([
        { name: "Clip.mp4", data: new Uint8Array([1]) },
        { name: "clip.mp4", data: new Uint8Array([2]) },
      ])
    ).toThrow(/Duplicate ZIP entry/);
  });
});
