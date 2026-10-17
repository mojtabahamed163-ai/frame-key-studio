export interface SourceOperationIdentity {
  sourceGeneration: number;
  projectRevision: number;
  projectId: string;
  sourceFile: File;
}

export interface FaceTrackIdentity {
  sourceGeneration: number;
  projectRevision: number;
  projectId: string;
  clipId: string;
  clipStart: number;
  clipEnd: number;
}

export interface TranslationIdentity {
  projectRevision: number;
  projectId: string;
  clipId: string;
  targetLanguage: string;
}

export interface ProjectSnapshotIdentity { projectId: string; projectRevision: number }

export function isCurrentProjectSnapshot(expected: ProjectSnapshotIdentity, current: ProjectSnapshotIdentity): boolean {
  return expected.projectId === current.projectId && expected.projectRevision === current.projectRevision;
}

export function createSerializedAsyncQueue() {
  let tail: Promise<void> = Promise.resolve();
  return function enqueue<T>(operation: () => T | Promise<T>): Promise<T> {
    const result = tail.then(operation, operation);
    tail = result.then(() => undefined, () => undefined);
    return result;
  };
}

export function isOperationOwner(expected: AbortController, current: AbortController | null): boolean {
  return expected === current;
}

export function isCurrentSourceOperation(expected: SourceOperationIdentity, current: SourceOperationIdentity): boolean {
  return expected.sourceGeneration === current.sourceGeneration
    && expected.projectRevision === current.projectRevision
    && expected.projectId === current.projectId
    && expected.sourceFile === current.sourceFile;
}

export function isCurrentFaceTrack(expected: FaceTrackIdentity, current: FaceTrackIdentity): boolean {
  return expected.sourceGeneration === current.sourceGeneration
    && expected.projectRevision === current.projectRevision
    && expected.projectId === current.projectId
    && expected.clipId === current.clipId
    && expected.clipStart === current.clipStart
    && expected.clipEnd === current.clipEnd;
}

export function isCurrentTranslation(expected: TranslationIdentity, current: TranslationIdentity): boolean {
  return expected.projectRevision === current.projectRevision
    && expected.projectId === current.projectId
    && expected.clipId === current.clipId
    && expected.targetLanguage === current.targetLanguage;
}

export function matchesReselectedSource(
  saved: { sourceFileName: string; sourceSize: number; sourceLastModified?: number; sourceSavedInOpfs?: boolean },
  selected: Pick<File, "name" | "size" | "lastModified">,
): boolean {
  if (selected.name !== saved.sourceFileName || selected.size !== saved.sourceSize) return false;
  if (saved.sourceSavedInOpfs || !Number.isFinite(saved.sourceLastModified)) return true;
  return selected.lastModified === saved.sourceLastModified;
}

export function recoveryProjectAfterOpenFailure<T extends { sourceSavedInOpfs: boolean }>(project: T): T | null {
  return project.sourceSavedInOpfs ? project : null;
}

export function shouldClearPendingProject(pending: { id: string } | null, deleted: { id: string }): boolean {
  return pending?.id === deleted.id;
}

export function markSourceSavedIfMatchingProject<T extends { id: string; sourceSavedInOpfs: boolean }>(
  current: T | null,
  projectId: string,
): T | null {
  return current?.id === projectId ? { ...current, sourceSavedInOpfs: true } : current;
}
