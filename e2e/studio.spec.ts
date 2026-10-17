import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = path.join(ROOT, "e2e", ".fixtures");
const OUTPUTS = path.join(ROOT, "e2e", "artifacts");
const MEDIA_SCRIPT = path.join(ROOT, "scripts", "create-test-media.sh");

function fixture(name: string): string {
  return path.join(FIXTURES, name);
}

function generateFixtures(): void {
  execFileSync("bash", [MEDIA_SCRIPT, FIXTURES], { stdio: "inherit" });
}

function ffprobeJson(file: string): { streams?: Array<{ codec_type?: string }>; format?: { duration?: string } } {
  return JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-show_streams", "-of", "json", file], { encoding: "utf8" }));
}

test.beforeAll(() => {
  generateFixtures();
  mkdirSync(OUTPUTS, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      Object.defineProperty(window, "showSaveFilePicker", { configurable: true, value: undefined });
    } catch {
      // The fallback path remains covered when the browser does not expose the picker.
    }
  });
  await page.goto("/studio");
  await page.evaluate(() => new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase("framekey-studio-local");
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  }));
  await page.reload();
  await expect(page).toHaveTitle(/Local Video Studio/);
});

test("opens the studio and rejects a non-video file", async ({ page }) => {
  const input = page.locator('input[type="file"]').first();

  await input.setInputFiles(fixture("not-a-video.txt"));
  await expect(page.getByRole("alert")).toContainText(/supported video|video file/i);
});

test("rejects a source above the supported 1080p scope", async ({ page }) => {
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(fixture("too-large-dimension.mp4"));
  await expect(page.getByRole("alert")).toContainText(/1080p/i);
});

test("rejects a source above the supported 30-minute duration", async ({ page }) => {
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(fixture("too-long.mp4"));
  await expect(page.getByRole("alert")).toContainText(/30-minute/i);
});

test("accepts a real local video, creates a manual 9:16 cut, exports it, and produces a playable file", async ({ page }) => {
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(fixture("valid-horizontal.mp4"));

  await expect(page.getByText("valid-horizontal.mp4", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/640 × 360/)).toBeVisible();
  await expect(page.getByText(/audio detected/)).toBeVisible();

  await page.getByRole("button", { name: /Skip analysis and set a cut manually/i }).click();
  await expect(page.getByText("Shape the final cut.")).toBeVisible();
  await page.getByLabel("Portrait framing mode").selectOption("full");
  await page.getByLabel("Export resolution").selectOption("1280");
  await expect(page.getByLabel("Portrait framing mode")).toHaveValue("full");

  await page.getByRole("button", { name: /^Export$/ }).last().click();
  await expect(page.getByText("Export on your terms.")).toBeVisible();
  const exportButton = page.getByRole("button", { name: "Export selected clip" });
  await expect(exportButton).toBeEnabled({ timeout: 30_000 });
  await exportButton.click();
  await expect(page.getByText(/Export is ready|Export saved/)).toBeVisible({ timeout: 120_000 });

  const saveButton = page.getByRole("button", { name: "Save file" });
  await expect(saveButton).toBeVisible({ timeout: 15_000 });
  const downloadPromise = page.waitForEvent("download");
  await saveButton.click();
  const download = await downloadPromise;
  const output = path.join(OUTPUTS, download.suggestedFilename());
  await download.saveAs(output);
  expect(existsSync(output)).toBe(true);

  const probe = ffprobeJson(output);
  expect(probe.streams?.some((stream) => stream.codec_type === "video")).toBe(true);
  expect(Number(probe.format?.duration ?? 0)).toBeGreaterThan(0);
  expect(readFileSync(output).byteLength).toBeGreaterThan(0);
});

test("keeps the saved project shell after a reload when the source was not stored", async ({ page }) => {
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(fixture("valid-horizontal.mp4"));
  await expect(page.getByText("valid-horizontal.mp4", { exact: true })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /Skip analysis and set a cut manually/i }).click();
  await expect(page.getByText("Shape the final cut.")).toBeVisible();

  await page.reload();
  const savedProject = page.getByRole("button", { name: /valid-horizontal/ }).first();
  await expect(savedProject).toBeVisible({ timeout: 30_000 });
  await savedProject.click();
  await expect(page.getByText(/Source not stored\. Select the original video matching/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Choose the original source" }).first()).toBeVisible();
});

test.describe("mobile viewport", () => {
  test.use({ isMobile: true, viewport: { width: 390, height: 844 } });

  test("keeps the studio usable without horizontal overflow", async ({ page }) => {
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewport + 1);

    const input = page.locator('input[type="file"]').first();
    await input.setInputFiles(fixture("valid-horizontal.mp4"));
    await expect(page.getByText("valid-horizontal.mp4", { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /Skip analysis and set a cut manually/i })).toBeVisible();
  });
});
