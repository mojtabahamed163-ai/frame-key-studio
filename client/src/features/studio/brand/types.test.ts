import { describe, expect, it } from "vitest";
import { makeBrandKit, TEMPLATE_CATALOG } from "./types";

describe("Brand Kit and template catalog", () => {
  it("ships fifteen distinct editable templates across five categories", () => {
    expect(TEMPLATE_CATALOG).toHaveLength(15);
    expect(new Set(TEMPLATE_CATALOG.map((item) => item.name)).size).toBe(15);
    expect(new Set(TEMPLATE_CATALOG.map((item) => item.category))).toEqual(new Set(["Real Estate", "Restaurants", "Podcast", "Education", "Marketing"]));
    expect(TEMPLATE_CATALOG.every((item) => item.layout && item.primaryColor && item.fontFamily && item.description)).toBe(true);
  });

  it("creates a local Brand Kit snapshot with caption and logo settings", () => {
    const logo = new Blob(["logo"], { type: "image/png" });
    const kit = makeBrandKit({ brandName: "Acme", primaryColor: "#112233", accentColor: "#DDAA44", captionStyle: "bold", fontFamily: "Arial, sans-serif", logoPosition: "top-right", logo }, "Acme Identity");
    expect(kit.name).toBe("Acme Identity");
    expect(kit.logo).toBe(logo);
    expect(kit.captionWeight).toBe(700);
    expect(kit.logoPosition).toBe("top-right");
  });
});
