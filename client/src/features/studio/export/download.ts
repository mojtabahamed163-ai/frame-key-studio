import { zipSync } from "fflate";

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function downloadText(text: string, filename: string, mime = "text/plain;charset=utf-8"): void {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

export function safeFileStem(value: string): string {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72) || "framekey-clip";
}

export function createZip(files: Array<{ name: string; data: Uint8Array }>): Blob {
  const entries: Record<string, Uint8Array> = {};
  for (const file of files) entries[file.name] = file.data;
  const zip = zipSync(entries, { level: 1 });
  return new Blob([zip], { type: "application/zip" });
}
