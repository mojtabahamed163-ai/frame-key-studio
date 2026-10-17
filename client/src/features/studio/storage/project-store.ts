import { DEFAULT_SETTINGS, type BrandSettings, type StudioProject, type StudioSettings } from "../types";

const DB_NAME = "framekey-studio-local";
const DB_VERSION = 1;
const PROJECTS = "projects";
const PREFERENCES = "preferences";

type BrowserStorageManager = StorageManager & {
  getDirectory?: () => Promise<FileSystemDirectoryHandle>;
  persist?: () => Promise<boolean>;
};

type FileSystemWritableHandle = FileSystemFileHandle & {
  createWritable: () => Promise<FileSystemWritableFileStream>;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not provide local project storage."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(PREFERENCES)) db.createObjectStore(PREFERENCES, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local project storage."));
  });
}

async function requestValue<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    let result: T;
    let settled = false;
    const fail = (cause: DOMException | Error | null | undefined) => {
      if (settled) return;
      settled = true;
      db.close();
      reject(cause ?? new Error("Local save failed."));
    };
    let request: IDBRequest<T>;
    try {
      request = action(transaction.objectStore(storeName));
    } catch (cause) {
      try { transaction.abort(); } catch { /* The transaction may already be inactive. */ }
      fail(cause instanceof Error ? cause : new Error("Local save failed."));
      return;
    }
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => fail(request.error);
    transaction.onerror = () => fail(transaction.error);
    transaction.onabort = () => fail(transaction.error ?? new Error("Local save was interrupted."));
    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      db.close();
      resolve(result);
    };
  });
}

export async function saveProject(project: StudioProject): Promise<void> {
  const updated = { ...project, updatedAt: Date.now() };
  await requestValue<IDBValidKey>(PROJECTS, "readwrite", (store) => store.put(updated));
}

export async function loadProject(id: string): Promise<StudioProject | null> {
  return (await requestValue<StudioProject | undefined>(PROJECTS, "readonly", (store) => store.get(id))) ?? null;
}

export async function listProjects(): Promise<StudioProject[]> {
  const projects = await requestValue<StudioProject[]>(PROJECTS, "readonly", (store) => store.getAll());
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveSettings(settings: StudioSettings): Promise<void> {
  await requestValue<IDBValidKey>(PREFERENCES, "readwrite", (store) => store.put({ key: "defaults", value: settings }));
}

export async function loadSettings(): Promise<StudioSettings> {
  const saved = await requestValue<{ key: string; value: Partial<StudioSettings> } | undefined>(PREFERENCES, "readonly", (store) => store.get("defaults"));
  return { ...DEFAULT_SETTINGS, ...(saved?.value ?? {}) };
}

export function createProject(sourceFile: File, settings: StudioSettings): StudioProject {
  const id = globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    id,
    name: sourceFile.name.replace(/\.[^.]+$/, "") || "Untitled edit",
    sourceFileName: sourceFile.name,
    sourceSize: sourceFile.size,
    sourceLastModified: sourceFile.lastModified,
    duration: 0,
    width: 0,
    height: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    step: "upload",
    words: [],
    editedCues: [],
    translatedCues: [],
    translatedLanguage: "none",
    sourceLanguage: "auto",
    clips: [],
    selectedClipId: null,
    faceKeyframesByClip: {},
    settings,
    sourceSavedInOpfs: false,
  };
}

export async function saveSourceToOpfs(projectId: string, file: File): Promise<boolean> {
  const storage = navigator.storage as BrowserStorageManager;
  if (!storage.getDirectory) return false;
  try {
    await storage.persist?.();
    const root = await storage.getDirectory();
    const folder = await root.getDirectoryHandle("framekey-studio", { create: true });
    const handle = await folder.getFileHandle(`${projectId}.source`, { create: true }) as FileSystemWritableHandle;
    const writable = await handle.createWritable();
    await writable.write(file);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

export async function loadSourceFromOpfs(projectId: string): Promise<File | null> {
  const storage = navigator.storage as BrowserStorageManager;
  if (!storage.getDirectory) return null;
  try {
    const root = await storage.getDirectory();
    const folder = await root.getDirectoryHandle("framekey-studio");
    const handle = await folder.getFileHandle(`${projectId}.source`);
    return await handle.getFile();
  } catch {
    return null;
  }
}

export async function deleteProject(project: StudioProject): Promise<void> {
  await requestValue<undefined>(PROJECTS, "readwrite", (store) => store.delete(project.id));
  if (!project.sourceSavedInOpfs) return;
  const storage = navigator.storage as BrowserStorageManager;
  try {
    if (!storage.getDirectory) return;
    const root = await storage.getDirectory();
    const folder = await root.getDirectoryHandle("framekey-studio");
    await folder.removeEntry(`${project.id}.source`);
  } catch {
    // A previously removed OPFS file does not prevent deleting the project record.
  }
}

export function defaultBrandSettings(settings: StudioSettings): BrandSettings {
  const { brandName, primaryColor, accentColor, captionStyle, fontFamily, logoPosition, logo } = settings;
  return { brandName, primaryColor, accentColor, captionStyle, fontFamily, logoPosition, logo };
}
