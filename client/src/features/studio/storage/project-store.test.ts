import "fake-indexeddb/auto";
import { beforeAll, describe, expect, it } from "vitest";
import { defaultBrandSettings, deleteBrandKit, listBrandKits, loadSourceLocally, saveBrandKit, saveSourceLocally, sourceMatchesProject } from "./project-store";
import { DEFAULT_SETTINGS } from "../types";

beforeAll(() => {
  (globalThis as typeof globalThis & { window: typeof globalThis }).window = globalThis;
});

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

describe("Brand Kit IndexedDB persistence", () => {
  it("creates, lists, updates, and deletes a Brand Kit", async () => {
    const id = `test-kit-${Date.now()}`;
    const kit = { id, name: "Test kit", createdAt: 1, updatedAt: 1, ...defaultBrandSettings(DEFAULT_SETTINGS) };
    await saveBrandKit(kit);
    expect((await listBrandKits()).find((item) => item.id === id)?.name).toBe("Test kit");

    await saveBrandKit({ ...kit, name: "Updated kit" });
    expect((await listBrandKits()).find((item) => item.id === id)?.name).toBe("Updated kit");

    await deleteBrandKit(id);
    expect((await listBrandKits()).some((item) => item.id === id)).toBe(false);
  });
});

describe("source file IndexedDB persistence", () => {
  it("round-trips the original video file and its identity", async () => {
    const projectId = `source-test-${Date.now()}`;
    const source = new File(["video-bytes"], "original.webm", { type: "video/webm", lastModified: 1234 });
    await saveSourceLocally(projectId, source);
    const restored = await loadSourceLocally(projectId);
    expect(restored).not.toBeNull();
    expect(restored?.name).toBe(source.name);
    expect(restored?.type).toBe(source.type);
    expect(restored?.lastModified).toBe(source.lastModified);
    expect(restored?.size).toBe(source.size);
  });
});
