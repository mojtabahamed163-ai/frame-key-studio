import { describe, expect, it, vi } from "vitest";
import {
  createSerializedAsyncQueue,
  isCurrentFaceTrack,
  isCurrentProjectSnapshot,
  isCurrentSourceOperation,
  isCurrentTranslation,
  isOperationOwner,
  markSourceSavedIfMatchingProject,
  matchesReselectedSource,
  recoveryProjectAfterOpenFailure,
  shouldClearPendingProject,
} from "./async-guards";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("async studio operation guards", () => {
  it("serializes project writes and lets a queued delete remain the final mutation", async () => {
    const queue = createSerializedAsyncQueue();
    const firstWrite = deferred<void>();
    const applied: string[] = [];
    const write = queue(async () => { applied.push("write-start"); await firstWrite.promise; applied.push("write-end"); });
    const remove = queue(() => { applied.push("delete"); });

    await Promise.resolve();
    expect(applied).toEqual(["write-start"]);
    firstWrite.resolve();
    await Promise.all([write, remove]);
    expect(applied).toEqual(["write-start", "write-end", "delete"]);
  });

  it("rejects a stale project-save callback after switching projects or revisions", () => {
    const current = { projectId: "new-project", projectRevision: 8 };
    expect(isCurrentProjectSnapshot({ projectId: "old-project", projectRevision: 7 }, current)).toBe(false);
    expect(isCurrentProjectSnapshot({ projectId: "new-project", projectRevision: 7 }, current)).toBe(false);
    expect(isCurrentProjectSnapshot(current, current)).toBe(true);
  });

  it("does not let an earlier operation clear a newer controller", () => {
    const earlier = new AbortController();
    const current = new AbortController();
    expect(isOperationOwner(earlier, current)).toBe(false);
    expect(isOperationOwner(current, current)).toBe(true);
  });

  it("does not let analysis A overwrite source B after A finishes late", async () => {
    const fileA = new File(["A"], "source.webm", { lastModified: 10 });
    const fileB = new File(["B"], "source.webm", { lastModified: 20 });
    const initial = { sourceGeneration: 1, projectRevision: 3, projectId: "project-a", sourceFile: fileA };
    let current = initial;
    const result = deferred<string>();
    const committed = vi.fn((words: string) => words);
    const completion = result.promise.then((words) => {
      if (isCurrentSourceOperation(initial, current)) committed(words);
    });

    current = { sourceGeneration: 2, projectRevision: 4, projectId: "project-b", sourceFile: fileB };
    result.resolve("late transcript A");
    await completion;

    expect(committed).not.toHaveBeenCalled();
    expect(current.projectId).toBe("project-b");
    expect(current.sourceFile).toBe(fileB);
  });

  it("rejects a late face track after clip boundaries change", async () => {
    const initial = { sourceGeneration: 4, projectRevision: 9, projectId: "p", clipId: "clip-1", clipStart: 5, clipEnd: 20 };
    let current = initial;
    const result = deferred<Array<{ time: number; x: number; y: number; confidence: number }>>();
    const committed = vi.fn();
    const completion = result.promise.then((keyframes) => {
      if (isCurrentFaceTrack(initial, current)) committed(keyframes);
    });

    current = { ...initial, projectRevision: 10, clipStart: 6, clipEnd: 19 };
    result.resolve([{ time: 0, x: 0.5, y: 0.5, confidence: 1 }]);
    await completion;

    expect(committed).not.toHaveBeenCalled();
    expect(current).toMatchObject({ clipStart: 6, clipEnd: 19 });
  });

  it("does not save a translation after the target language changes during await", async () => {
    const initial = { projectRevision: 7, projectId: "p", clipId: "clip-1", targetLanguage: "fr" };
    let current = initial;
    const result = deferred<string[]>();
    const committed = vi.fn();
    const completion = result.promise.then((translated) => {
      if (isCurrentTranslation(initial, current)) committed(translated, current.targetLanguage);
    });

    current = { ...initial, projectRevision: 8, targetLanguage: "de" };
    result.resolve(["ancienne traduction"]);
    await completion;

    expect(committed).not.toHaveBeenCalled();
  });

  it("requires lastModified for non-OPFS source re-selection but preserves OPFS recovery", () => {
    const file = { name: "same.webm", size: 100, lastModified: 20 };
    const saved = { sourceFileName: "same.webm", sourceSize: 100, sourceLastModified: 10, sourceSavedInOpfs: false };
    expect(matchesReselectedSource(saved, file)).toBe(false);
    expect(matchesReselectedSource({ ...saved, sourceLastModified: 20 }, file)).toBe(true);
    expect(matchesReselectedSource({ ...saved, sourceSavedInOpfs: true }, file)).toBe(true);
    expect(matchesReselectedSource({ sourceFileName: saved.sourceFileName, sourceSize: saved.sourceSize }, file)).toBe(true);
  });

  it("restores an OPFS project as pending when opening its saved source fails", () => {
    const project = { id: "p", sourceSavedInOpfs: true };
    expect(recoveryProjectAfterOpenFailure(project)).toBe(project);
    expect(recoveryProjectAfterOpenFailure({ id: "q", sourceSavedInOpfs: false })).toBeNull();
  });

  it("merges a completed OPFS source save into the latest project instead of restoring a stale snapshot", () => {
    const latest = { id: "p", name: "Edited while saving", sourceSavedInOpfs: false, revision: 9 };
    expect(markSourceSavedIfMatchingProject(latest, "p")).toEqual({ ...latest, sourceSavedInOpfs: true });
    expect(markSourceSavedIfMatchingProject({ ...latest, id: "new-project" }, "p")).toMatchObject({
      id: "new-project",
      sourceSavedInOpfs: false,
    });
  });

  it("clears a pending project when that saved project is deleted", () => {
    expect(shouldClearPendingProject({ id: "deleted" }, { id: "deleted" })).toBe(true);
    expect(shouldClearPendingProject({ id: "other" }, { id: "deleted" })).toBe(false);
    expect(shouldClearPendingProject(null, { id: "deleted" })).toBe(false);
  });
});
