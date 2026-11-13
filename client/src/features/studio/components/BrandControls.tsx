import { useEffect, useState } from "react";
import { ImagePlus, Pencil, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { defaultBrandSettings, deleteBrandKit, listBrandKits, saveBrandKit } from "../storage/project-store";
import type { BrandKit, CaptionStyle, StudioSettings } from "../types";

const PRESETS: Array<{ name: string; primaryColor: string; accentColor: string; captionStyle: CaptionStyle; captionPosition: StudioSettings["captionPosition"]; fontFamily: string }> = [
  { name: "Frame / clean", primaryColor: "#203A31", accentColor: "#C9794B", captionStyle: "clean", captionPosition: "bottom", fontFamily: "DM Sans, Arial, sans-serif" },
  { name: "Signal / bold", primaryColor: "#14222D", accentColor: "#92D9CE", captionStyle: "bold", captionPosition: "middle", fontFamily: "Arial, sans-serif" },
  { name: "Field / editorial", primaryColor: "#314239", accentColor: "#D4A46E", captionStyle: "editorial", captionPosition: "top", fontFamily: "Georgia, serif" },
];
function kitFromSettings(settings: StudioSettings, name: string, existing?: BrandKit): BrandKit {
  const now = Date.now();
  return { id: existing?.id ?? `kit-${now}-${Math.random().toString(16).slice(2)}`, name: name.trim().slice(0, 60) || "Untitled Brand Kit", createdAt: existing?.createdAt ?? now, updatedAt: now, ...defaultBrandSettings(settings) };
}
export function BrandControls({ settings, onChange }: { settings: StudioSettings; onChange: (patch: Partial<StudioSettings>) => void }) {
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [kitName, setKitName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kitError, setKitError] = useState("");
  const refresh = () => { void listBrandKits().then(setKits).catch(() => setKitError("Brand Kits are unavailable in this browser.")); };
  useEffect(refresh, []);
  const setPreset = (preset: typeof PRESETS[number]) => onChange({ ...preset });
  const applyKit = (kit: BrandKit) => onChange({ brandName: kit.brandName, primaryColor: kit.primaryColor, accentColor: kit.accentColor, captionStyle: kit.captionStyle, captionPosition: kit.captionPosition, fontFamily: kit.fontFamily, logoPosition: kit.logoPosition, logo: kit.logo });
  async function saveKit() {
    const name = kitName.trim();
    if (!name) { setKitError("Give the Brand Kit a name before saving."); return; }
    try { await saveBrandKit(kitFromSettings(settings, name, kits.find((item) => item.id === editingId))); refresh(); setKitName(""); setEditingId(null); setKitError(""); }
    catch { setKitError("Could not save this Brand Kit locally."); }
  }
  async function removeKit(id: string) { try { await deleteBrandKit(id); refresh(); if (editingId === id) { setEditingId(null); setKitName(""); } } catch { setKitError("Could not delete this Brand Kit."); } }
  return <section className="studio-panel">
    <div className="studio-panel-heading"><span className="studio-panel-heading__index">06</span><div><p>BRAND KITS</p><h3>Make it yours.</h3></div><span className="studio-save-tag">SAVED ON THIS DEVICE</span></div>
    <div className="brand-presets" role="group" aria-label="Caption design presets">{PRESETS.map((preset) => <button key={preset.name} type="button" className={`brand-preset${settings.captionStyle === preset.captionStyle && settings.primaryColor === preset.primaryColor ? " is-selected" : ""}`} onClick={() => setPreset(preset)}><span className="brand-preset__swatch" style={{ background: preset.primaryColor, color: preset.accentColor }}><i /><b>Aa</b></span><span>{preset.name}</span></button>)}</div>
    <div className="brand-kit-list">{kits.length ? kits.map((kit) => <div className="brand-kit-row" key={kit.id}><button type="button" onClick={() => applyKit(kit)}><span className="brand-kit-swatch" style={{ background: kit.primaryColor, color: kit.accentColor }}>Aa</span><span><strong>{kit.name}</strong><small>{kit.captionStyle} · {kit.captionPosition} · {kit.fontFamily.split(",")[0]}</small></span></button><button type="button" className="studio-icon-button" aria-label={`Edit ${kit.name}`} onClick={() => { setEditingId(kit.id); setKitName(kit.name); }}><Pencil size={13} /></button><button type="button" className="studio-icon-button" aria-label={`Delete ${kit.name}`} onClick={() => void removeKit(kit.id)}><Trash2 size={13} /></button></div>) : <p className="studio-empty-inline">No saved Brand Kits yet. Create one from the current controls.</p>}</div>
    <div className="brand-kit-actions"><input maxLength={60} value={kitName} onChange={(event) => setKitName(event.target.value)} placeholder={editingId ? "Rename this Brand Kit" : "New Brand Kit name"} /><button type="button" className="studio-button studio-button--small" onClick={() => void saveKit()}><Plus size={14} />{editingId ? "Update kit" : "Save kit"}</button></div>
    {kitError && <p className="studio-inline-warning">{kitError}</p>}
    <label className="studio-field">Brand name<input maxLength={50} value={settings.brandName} onChange={(event) => onChange({ brandName: event.target.value })} placeholder="Your brand" /></label>
    <div className="brand-color-row"><label className="studio-field">Primary color<span className="color-input-wrap"><input type="color" value={settings.primaryColor} onChange={(event) => onChange({ primaryColor: event.target.value })} /><code>{settings.primaryColor}</code></span></label><label className="studio-field">Accent color<span className="color-input-wrap"><input type="color" value={settings.accentColor} onChange={(event) => onChange({ accentColor: event.target.value })} /><code>{settings.accentColor}</code></span></label></div>
    <label className="studio-field">Caption font<select value={settings.fontFamily} onChange={(event) => onChange({ fontFamily: event.target.value })}><option value="DM Sans, Arial, sans-serif">DM Sans — clean</option><option value="Arial, sans-serif">Arial — neutral</option><option value="Georgia, serif">Georgia — editorial</option><option value="Trebuchet MS, sans-serif">Trebuchet — rounded</option></select></label>
    <label className="studio-field">Caption style<select value={settings.captionStyle} onChange={(event) => onChange({ captionStyle: event.target.value as CaptionStyle })}><option value="clean">Clean text</option><option value="bold">Bold text</option><option value="editorial">Editorial text</option></select></label>
    <label className="studio-field">Caption position<select value={settings.captionPosition} onChange={(event) => onChange({ captionPosition: event.target.value as StudioSettings["captionPosition"] })}><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select></label>
    <label className="studio-field">Caption timing<select value={settings.captionMode} onChange={(event) => onChange({ captionMode: event.target.value as StudioSettings["captionMode"] })}><option value="block">Sentence / short blocks</option><option value="word">One word at a time</option></select><small>Word timing is available from speech recognition. Imported or translated captions remain line-timed.</small></label>
    <label className="studio-field">Logo position<select value={settings.logoPosition} onChange={(event) => onChange({ logoPosition: event.target.value as StudioSettings["logoPosition"] })}><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option></select></label>
    <div className="brand-logo-row"><label className="studio-file-button"><Upload size={15} /><span>{settings.logo ? "Replace local logo" : "Add a logo file"}<small>PNG, SVG, JPG · kept locally</small></span><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (file && file.size <= 5 * 1024 * 1024) onChange({ logo: file }); event.currentTarget.value = ""; }} /></label>{settings.logo ? <button type="button" className="brand-logo-clear" onClick={() => onChange({ logo: undefined })} aria-label="Remove local logo"><RotateCcw size={14} /> Remove</button> : <span className="brand-logo-note"><ImagePlus size={14} /> Max 5 MB</span>}</div>
  </section>;
}
