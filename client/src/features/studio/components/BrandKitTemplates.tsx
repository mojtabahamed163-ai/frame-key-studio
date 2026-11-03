import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, ImagePlus, Palette, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import type { StudioSettings } from "../types";
import { deleteBrandKit, deleteUserTemplate, deserializeBrandKit, listBrandKits, listUserTemplates, saveBrandKit, saveUserTemplate, serializeBrandKit } from "../brand/brand-store";
import { makeBrandKit, TEMPLATE_CATALOG, type BrandKit, type VideoTemplate } from "../brand/types";

type DesignSnapshot = Partial<VideoTemplate> & Partial<BrandKit>;

function applyDesign(design: DesignSnapshot, onChange: (patch: Partial<StudioSettings>) => void) {
  onChange({
    ...( "name" in design ? { brandName: design.name } : {}),
    primaryColor: design.primaryColor,
    secondaryColor: design.secondaryColor,
    accentColor: design.accentColor,
    backgroundColor: design.backgroundColor,
    textColor: design.textColor,
    fontFamily: design.fontFamily,
    captionStyle: design.captionStyle,
    logoPosition: design.logoPosition,
    logo: design.logo,
    ...(design.captionFontSize ? { captionFontSize: design.captionFontSize } : {}),
    ...(design.captionWeight ? { captionWeight: design.captionWeight } : {}),
    ...(design.captionAlign ? { captionAlign: design.captionAlign } : {}),
    ...(design.captionLineHeight ? { captionLineHeight: design.captionLineHeight } : {}),
    ...(design.captionShadow !== undefined ? { captionShadow: design.captionShadow } : {}),
    ...(design.captionPosition ? { captionPosition: design.captionPosition } : {}),
    ...( "id" in design ? { templateId: design.id } : {}),
    ...( "layout" in design ? { templateLayout: design.layout, showTitleCard: design.showTitleCard, showCaptions: design.showCaptions } : {}),
  });
}

export function BrandKitTemplates({ settings, onChange, onNotice }: { settings: StudioSettings; onChange: (patch: Partial<StudioSettings>) => void; onNotice: (message: string) => void }) {
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [customTemplates, setCustomTemplates] = useState<VideoTemplate[]>([]);
  const [tab, setTab] = useState<"brand" | "templates">("brand");
  const [category, setCategory] = useState("All");
  const [kitName, setKitName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  async function refresh() { setKits(await listBrandKits()); setCustomTemplates(await listUserTemplates()); }
  useEffect(() => { void refresh().catch(() => undefined); }, []);
  const templates = useMemo(() => [...TEMPLATE_CATALOG, ...customTemplates].filter((item) => category === "All" || item.category === category), [category, customTemplates]);

  async function createKit() {
    const kit = makeBrandKit({ ...settings, logo: settings.logo }, kitName || settings.brandName);
    await saveBrandKit(kit); setKitName(""); await refresh(); onNotice(`Brand Kit “${kit.name}” saved locally.`);
  }
  async function duplicateKit(kit: BrandKit) { const copy = { ...kit, id: crypto.randomUUID(), name: `${kit.name} copy`, createdAt: Date.now(), updatedAt: Date.now() }; await saveBrandKit(copy); await refresh(); onNotice("Brand Kit duplicated locally."); }
  async function removeKit(kit: BrandKit) { if (!window.confirm(`Delete Brand Kit “${kit.name}”?`)) return; await deleteBrandKit(kit.id); await refresh(); onNotice("Brand Kit deleted."); }
  async function saveTemplate() {
    if (!templateName.trim()) return;
    const saved: VideoTemplate = { id: `custom-${crypto.randomUUID()}`, name: templateName.trim(), category: "Marketing", description: "Saved from the current Studio design.", layout: settings.templateLayout ?? "lower-third", primaryColor: settings.primaryColor, secondaryColor: settings.secondaryColor ?? "#F5EFE5", accentColor: settings.accentColor, backgroundColor: settings.backgroundColor ?? settings.primaryColor, textColor: settings.textColor ?? "#FFFFFF", fontFamily: settings.fontFamily, captionStyle: settings.captionStyle, logoPosition: settings.logoPosition, showTitleCard: settings.showTitleCard, showCaptions: settings.showCaptions, custom: true, createdAt: Date.now() };
    await saveUserTemplate(saved); setTemplateName(""); await refresh(); onNotice(`Custom template “${saved.name}” saved locally.`);
  }
  async function removeTemplate(template: VideoTemplate) { if (!window.confirm(`Delete template “${template.name}”?`)) return; await deleteUserTemplate(template.id); await refresh(); onNotice("Custom template deleted."); }
  async function exportKit(kit: BrandKit) { const text = await serializeBrandKit(kit); const blob = new Blob([text], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${kit.name.replace(/[^a-z0-9_-]+/gi, "-")}.brandkit.json`; a.click(); URL.revokeObjectURL(url); }
  async function importKit(event: React.ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (!file) return; try { if (file.size > 10 * 1024 * 1024) throw new Error("Brand Kit files must be under 10 MB."); const kit = await deserializeBrandKit(await file.text()); await saveBrandKit(kit); await refresh(); onNotice(`Imported “${kit.name}” locally.`); } catch (error) { onNotice(error instanceof Error ? error.message : "Could not import that Brand Kit."); } }

  return <section className="studio-panel studio-brand-library">
    <div className="studio-panel-heading"><span className="studio-panel-heading__index">08</span><div><p>DESIGN SYSTEM</p><h3>Brand Kit & Templates</h3></div><span className="studio-save-tag">LOCAL ONLY</span></div>
    <div className="brand-library-tabs"><button className={tab === "brand" ? "is-active" : ""} onClick={() => setTab("brand")} type="button"><Palette size={14} /> Brand Kit</button><button className={tab === "templates" ? "is-active" : ""} onClick={() => setTab("templates")} type="button"><Sparkles size={14} /> Video Templates</button></div>
    {tab === "brand" ? <>
      <p className="studio-small-copy">Save a complete visual identity, then apply it to the current clip. Logos and settings stay in this browser.</p>
      <div className="brand-create-row"><input value={kitName} onChange={(event) => setKitName(event.target.value)} placeholder="New Brand Kit name" maxLength={60} /><button type="button" className="studio-button studio-button--dark studio-button--small" onClick={() => void createKit()}><Plus size={14} />Save current</button></div>
      <div className="brand-library-actions"><button type="button" className="studio-text-button" onClick={() => importRef.current?.click()}><Upload size={13} />Import JSON</button><input ref={importRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importKit(event)} /></div>
      {!kits.length ? <div className="studio-empty-inline"><ImagePlus size={16} />No saved Brand Kits yet. Save the current design to start.</div> : <div className="brand-kit-list">{kits.map((kit) => <div className="brand-kit-card" key={kit.id}><div className="brand-kit-card__swatches"><span style={{ background: kit.primaryColor }} /><span style={{ background: kit.accentColor }} /><span style={{ background: kit.secondaryColor }} /></div><div className="brand-kit-card__body"><strong>{kit.name}</strong><small>{kit.fontFamily.split(",")[0]} · {kit.logo ? "logo saved" : "no logo"}</small></div><div className="brand-kit-card__actions"><button type="button" onClick={() => { applyDesign(kit, onChange); onNotice(`Applied Brand Kit “${kit.name}”.`); }} title="Apply Brand Kit"><Check size={14} /></button><button type="button" onClick={() => void duplicateKit(kit)} title="Duplicate"><Copy size={14} /></button><button type="button" onClick={() => void exportKit(kit)} title="Export JSON"><Download size={14} /></button><button type="button" onClick={() => void removeKit(kit)} title="Delete"><Trash2 size={14} /></button></div></div>)}</div>}
    </> : <>
      <p className="studio-small-copy">Choose a real, editable design system. Applying a template keeps the source video, transcript, cut points and framing.</p>
      <div className="template-library-toolbar"><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option><option>Real Estate</option><option>Restaurants</option><option>Podcast</option><option>Education</option><option>Marketing</option></select><div className="brand-create-row"><input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Save current as…" maxLength={60} /><button type="button" className="studio-button studio-button--dark studio-button--small" onClick={() => void saveTemplate()}><Plus size={14} />Save</button></div></div>
      <div className="template-grid">{templates.map((template) => <article className="template-card" key={template.id}><div className="template-card__preview" style={{ background: template.backgroundColor, color: template.textColor, fontFamily: template.fontFamily }}><span className={`template-card__shape template-card__shape--${template.layout}`} style={{ background: template.primaryColor, borderColor: template.accentColor }} /><b style={{ color: template.accentColor }}>Aa</b><strong>{template.name}</strong><i style={{ background: template.accentColor }} /></div><div className="template-card__body"><div><strong>{template.name}</strong><small>{template.category}{template.custom ? " · Custom" : ""}</small></div><p>{template.description}</p><div className="template-card__actions"><button type="button" className="studio-button studio-button--small studio-button--copper" onClick={() => { applyDesign(template, onChange); onNotice(`Applied template “${template.name}”.`); }}><Check size={13} />Apply</button>{template.custom && <button type="button" className="studio-text-button" onClick={() => void removeTemplate(template)}><Trash2 size={13} />Delete</button>}</div></div></article>)}</div>
    </>}
  </section>;
}
