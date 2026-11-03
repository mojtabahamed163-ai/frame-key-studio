import type { BrandKit, VideoTemplate } from "./types";
import { BRAND_KITS, USER_TEMPLATES } from "../storage/project-store";

const DB_NAME = "framekey-studio-local";
const DB_VERSION = 2;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BRAND_KITS)) db.createObjectStore(BRAND_KITS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(USER_TEMPLATES)) db.createObjectStore(USER_TEMPLATES, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local design storage is unavailable."));
  });
}

async function request<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const result = action(tx.objectStore(storeName));
    result.onerror = () => { db.close(); reject(result.error); };
    tx.oncomplete = () => { db.close(); resolve(result.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export const listBrandKits = () => request<BrandKit[]>(BRAND_KITS, "readonly", (store) => store.getAll());
export const saveBrandKit = (kit: BrandKit) => request<IDBValidKey>(BRAND_KITS, "readwrite", (store) => store.put({ ...kit, updatedAt: Date.now() }));
export const deleteBrandKit = (id: string) => request<undefined>(BRAND_KITS, "readwrite", (store) => store.delete(id));
export const listUserTemplates = () => request<VideoTemplate[]>(USER_TEMPLATES, "readonly", (store) => store.getAll());
export const saveUserTemplate = (template: VideoTemplate) => request<IDBValidKey>(USER_TEMPLATES, "readwrite", (store) => store.put(template));
export const deleteUserTemplate = (id: string) => request<undefined>(USER_TEMPLATES, "readwrite", (store) => store.delete(id));

export function serializeBrandKit(kit: BrandKit): Promise<string> {
  return new Promise((resolve) => {
    if (!kit.logo) { resolve(JSON.stringify({ ...kit, logo: undefined })); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(JSON.stringify({ ...kit, logo: { data: reader.result, type: kit.logo?.type } }));
    reader.readAsDataURL(kit.logo);
  });
}

export async function deserializeBrandKit(json: string): Promise<BrandKit> {
  const parsed = JSON.parse(json) as BrandKit & { logo?: { data?: string; type?: string } };
  if (!parsed || typeof parsed.name !== "string" || typeof parsed.primaryColor !== "string") throw new Error("Invalid Brand Kit file.");
  if (parsed.logo?.data && parsed.logo.data.length > 8 * 1024 * 1024) throw new Error("This Brand Kit file is too large.");
  let logo: Blob | undefined;
  if (parsed.logo?.data) {
    const response = await fetch(parsed.logo.data);
    logo = await response.blob();
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(logo.type)) throw new Error("The Brand Kit logo format is not supported.");
    if (logo.size > 5 * 1024 * 1024) throw new Error("The Brand Kit logo is larger than 5 MB.");
  }
  return { ...parsed, id: crypto.randomUUID(), logo, createdAt: Date.now(), updatedAt: Date.now() };
}
