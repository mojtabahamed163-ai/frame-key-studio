import { ImagePlus, RotateCcw, Upload } from "lucide-react";
import type { CaptionStyle, StudioSettings } from "../types";

const PRESETS: Array<{ name: string; primaryColor: string; accentColor: string; captionStyle: CaptionStyle; fontFamily: string }> = [
  { name: "Frame / clean", primaryColor: "#203A31", accentColor: "#C9794B", captionStyle: "clean", fontFamily: "DM Sans, Arial, sans-serif" },
  { name: "Signal / bold", primaryColor: "#14222D", accentColor: "#92D9CE", captionStyle: "bold", fontFamily: "Arial, sans-serif" },
  { name: "Field / editorial", primaryColor: "#314239", accentColor: "#D4A46E", captionStyle: "editorial", fontFamily: "Georgia, serif" },
];

export function BrandControls({ settings, onChange }: { settings: StudioSettings; onChange: (patch: Partial<StudioSettings>) => void }) {
  const setPreset = (preset: typeof PRESETS[number]) => onChange({ ...preset });
  return (
    <section className="studio-panel">
      <div className="studio-panel-heading"><span className="studio-panel-heading__index">05</span><div><p>YOUR BRAND</p><h3>Make it yours.</h3></div><span className="studio-save-tag">SAVED ON THIS DEVICE</span></div>
      <div className="brand-presets" role="group" aria-label="Caption design presets">
        {PRESETS.map((preset) => <button key={preset.name} type="button" className={`brand-preset${settings.captionStyle === preset.captionStyle && settings.primaryColor === preset.primaryColor ? " is-selected" : ""}`} onClick={() => setPreset(preset)}>
          <span className="brand-preset__swatch" style={{ background: preset.primaryColor, color: preset.accentColor }}><i /><b>Aa</b></span><span>{preset.name}</span>
        </button>)}
      </div>
      <label className="studio-field">Brand name<input maxLength={50} value={settings.brandName} onChange={(event) => onChange({ brandName: event.target.value })} placeholder="Your brand" /></label>
      <div className="brand-color-row">
        <label className="studio-field">Primary color<span className="color-input-wrap"><input type="color" value={settings.primaryColor} onChange={(event) => onChange({ primaryColor: event.target.value })} /><code>{settings.primaryColor}</code></span></label>
        <label className="studio-field">Accent color<span className="color-input-wrap"><input type="color" value={settings.accentColor} onChange={(event) => onChange({ accentColor: event.target.value })} /><code>{settings.accentColor}</code></span></label>
      </div>
      <label className="studio-field">Caption font<select value={settings.fontFamily} onChange={(event) => onChange({ fontFamily: event.target.value })}><option value="DM Sans, Arial, sans-serif">DM Sans — clean</option><option value="Arial, sans-serif">Arial — neutral</option><option value="Georgia, serif">Georgia — editorial</option><option value="Trebuchet MS, sans-serif">Trebuchet — rounded</option></select></label>
      <label className="studio-field">Caption timing<select value={settings.captionMode} onChange={(event) => onChange({ captionMode: event.target.value as StudioSettings["captionMode"] })}><option value="block">Sentence / short blocks</option><option value="word">One word at a time</option></select><small>Word timing is available from speech recognition. Imported or translated captions remain line-timed.</small></label>
      <label className="studio-field">Logo position<select value={settings.logoPosition} onChange={(event) => onChange({ logoPosition: event.target.value as StudioSettings["logoPosition"] })}><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option></select></label>
      <div className="brand-logo-row">
        <label className="studio-file-button"><Upload size={15} /><span>{settings.logo ? "Replace local logo" : "Add a logo file"}<small>PNG, SVG, JPG · kept locally</small></span><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (file && file.size <= 5 * 1024 * 1024) onChange({ logo: file }); event.currentTarget.value = ""; }} /></label>
        {settings.logo ? <button type="button" className="brand-logo-clear" onClick={() => onChange({ logo: undefined })} aria-label="Remove local logo"><RotateCcw size={14} /> Remove</button> : <span className="brand-logo-note"><ImagePlus size={14} /> Max 5 MB</span>}
      </div>
    </section>
  );
}
