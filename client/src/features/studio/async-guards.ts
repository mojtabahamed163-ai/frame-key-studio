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
