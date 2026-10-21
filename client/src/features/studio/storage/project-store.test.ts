import { describe, expect, it } from "vitest";
import { sourceMatchesProject } from "./project-store";

describe("saved source identity", () => {
  const project = {
    sourceFileName: "original.mp4",
    sourceSize: 4,
    sourceLastModified: 123,
  };

  it("accepts the original user-selected file only when identity matches", () => {
    expect(sourceMatchesProject(new File(["data"], "original.mp4", { lastModified: 123 }), project)).toBe(true);
    expect(sourceMatchesProject(new File(["data"], "renamed.mp4", { lastModified: 123 }), project)).toBe(false);
    expect(sourceMatchesProject(new File(["data"], "original.mp4", { lastModified: 456 }), project)).toBe(false);
  });

  it("accepts an OPFS-restored file name while retaining the size check", () => {
    expect(sourceMatchesProject(new File(["data"], "project-id.source", { lastModified: 456 }), project, true)).toBe(true);
    expect(sourceMatchesProject(new File(["bad"], "project-id.source", { lastModified: 456 }), project, true)).toBe(false);
  });
});
