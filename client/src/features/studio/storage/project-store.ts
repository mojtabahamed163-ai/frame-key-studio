import { DEFAULT_SETTINGS, type BrandSettings, type StudioProject, type StudioSettings } from "../types";

const DB_NAME = "framekey-studio-local";
const DB_VERSION = 1;
const PROJECTS = "projects";
const PREFERENCES = "preferences";
let writeQueue: Promise<void> = Promise.resolve();

type BrowserStorageManager = StorageManager & {
  getDirectory?: () => Promise<FileSystemDirectoryHandle>;
  persist?: () => Promise<boolean>;
};

type FileSystemWritableHandle = FileSystemFileHandle & {
  createWritable: () => Promise<FileSystemWritableFileStream>;
};

export function sourceMatchesProject(
  file: File,
  project: Pick<StudioProject, "sourceFileName" | "sourceSize" | "sourceLastModified">,
  restoredFromOpfs = false,
): boolean {
  return (restoredFromOpfs || file.name === project.sourceFileName)
    && file.size === project.sourceSize
    && (restoredFromOpfs || !project.sourceLastModified || file.lastModified === project.sourceLastModified);
}

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
    const request = action(transaction.objectStore(storeName));
    let result: T;
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      db.close();
      callback();
    };
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => finish(() => reject(request.error ?? new Error("Local save failed.")));
    transaction.onerror = () => finish(() => reject(transaction.error ?? new Error("Local save failed.")));
    transaction.onabort = () => finish(() => reject(transaction.error ?? new Error("Local save was interrupted.")));
    transaction.oncomplete = () => finish(() => resolve(result));
  });
}

function enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(() => undefined, () => undefined);
  return next;
}

export async function saveProject(project: StudioProject): Promise<void> {
  const updated = { ...project, updatedAt: Date.now() };
  await enqueueWrite(() => requestValue<IDBValidKey>(PROJECTS, "readwrite", (store) => store.put(updated)));
}

export async function loadProject(id: string): Promise<StudioProject | null> {
  return (await requestValue<StudioProject | undefined>(PROJECTS, "readonly", (store) => store.get(id))) ?? null;
}

export async function listProjects(): Promise<StudioProject[]> {
  const projects = await requestValue<StudioProject[]>(PROJECTS, "readonly", (store) => store.getAll());
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveSettings(settings: StudioSettings): Promise<void> {
  await enqueueWrite(() => requestValue<IDBValidKey>(PREFERENCES, "readwrite", (store) => store.put({ key: "defaults", value: settings })));
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
  let writable: FileSystemWritableFileStream | null = null;
  try {
    await storage.persist?.();
    const root = await storage.getDirectory();
    const folder = await root.getDirectoryHandle("framekey-studio", { create: true });
    const handle = await folder.getFileHandle(`${projectId}.source`, { create: true }) as FileSystemWritableHandle;
    writable = await handle.createWritable();
    await writable.write(file);
    await writable.close();
    writable = null;
    return true;
  } catch {
    await writable?.abort().catch(() => undefined);
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
