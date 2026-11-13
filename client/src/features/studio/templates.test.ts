import { describe, expect, it } from "vitest";
import { applyTemplate, STUDIO_TEMPLATES } from "./templates";
import { DEFAULT_SETTINGS } from "./types";

describe("studio template catalog", () => {
  it("contains exactly 15 templates with three in every category", () => {
    expect(STUDIO_TEMPLATES).toHaveLength(15);
    expect(new Set(STUDIO_TEMPLATES.map((template) => template.id)).size).toBe(15);
    const counts = new Map<string, number>();
    for (const template of STUDIO_TEMPLATES) counts.set(template.category, (counts.get(template.category) ?? 0) + 1);
    expect([...counts.values()]).toEqual([3, 3, 3, 3, 3]);
  });

  it("provides valid render settings for every template", () => {
    for (const template of STUDIO_TEMPLATES) {
      expect(template.primaryColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(template.accentColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(template.description.length).toBeGreaterThan(10);
      expect(["top", "middle", "bottom"]).toContain(template.captionPosition);
      expect(["banner", "minimal", "split", "corner"]).toContain(template.titleStyle);
    }
  });

  it("applies a template without discarding project-specific state", () => {
    const current = { ...DEFAULT_SETTINGS, brandName: "My brand", targetLanguage: "fr" as const };
    const next = applyTemplate(STUDIO_TEMPLATES[7], current);
    expect(next.templateId).toBe(STUDIO_TEMPLATES[7].id);
    expect(next.brandName).toBe("My brand");
    expect(next.targetLanguage).toBe("fr");
    expect(next.primaryColor).toBe(STUDIO_TEMPLATES[7].primaryColor);
  });
});
