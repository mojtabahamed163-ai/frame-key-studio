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

export function downloadText(
  text: string,
  filename: string,
  mime = "text/plain;charset=utf-8"
): void {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

export function safeFileStem(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "framekey-clip"
  );
}

export function uniqueFilename(filename: string, used: Set<string>): string {
  const match = filename.match(/^(.*?)(\.[^.]+)?$/);
  const stem = match?.[1] || "framekey-clip";
  const extension = match?.[2] || "";
  let candidate = filename;
  let suffix = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${stem}-${suffix}${extension}`;
    suffix += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export function replaceOutputForClip<T extends { clipId: string }>(current: T[], next: T): T[] {
  return [next, ...current.filter((item) => item.clipId !== next.clipId)];
}

export function createZip(
  files: Array<{ name: string; data: Uint8Array }>
): Blob {
  const entries: Record<string, Uint8Array> = {};
  const names = new Set<string>();
  for (const file of files) {
    if (
      !file.name ||
      file.name === "." ||
      file.name === ".." ||
      file.name.includes("/") ||
      file.name.includes("\\")
    ) {
      throw new Error(
        "ZIP entry names must be non-empty file names without path separators."
      );
    }
    const normalizedName = file.name.toLowerCase();
    if (names.has(normalizedName))
      throw new Error(`Duplicate ZIP entry: ${file.name}`);
    names.add(normalizedName);
    entries[file.name] = file.data;
  }
  const zip = zipSync(entries, { level: 1 });
  return new Blob([zip], { type: "application/zip" });
}
