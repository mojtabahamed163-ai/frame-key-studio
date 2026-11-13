import { useMemo, useState } from "react";
import { Check, Layers3 } from "lucide-react";
import { applyTemplate, STUDIO_TEMPLATES, type TemplateCategory } from "../templates";
import type { StudioSettings } from "../types";

const CATEGORIES: TemplateCategory[] = ["Real Estate", "Restaurants & Food", "Education", "Podcasts & Interviews", "Marketing & Business"];
export function TemplateControls({ settings, onChange }: { settings: StudioSettings; onChange: (patch: Partial<StudioSettings>) => void }) {
  const [category, setCategory] = useState<TemplateCategory>("Real Estate");
  const visible = useMemo(() => STUDIO_TEMPLATES.filter((item) => item.category === category), [category]);
  return <section className="studio-panel template-controls">
    <div className="studio-panel-heading"><span className="studio-panel-heading__index">05</span><div><p>DESIGN SYSTEM</p><h3>Choose a template.</h3></div><span className="studio-save-tag">15 EDITABLE DESIGNS</span></div>
    <div className="template-category-tabs" role="tablist" aria-label="Template categories">
      {CATEGORIES.map((item) => <button key={item} type="button" role="tab" aria-selected={item === category} className={item === category ? "is-selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}
    </div>
    <div className="template-grid">
      {visible.map((item) => <button type="button" key={item.id} className={`template-card${settings.templateId === item.id ? " is-selected" : ""}`} onClick={() => onChange(applyTemplate(item, settings))}>
        <span className="template-card__preview" style={{ background: item.primaryColor, color: item.accentColor, fontFamily: item.fontFamily }}><i className={`template-card__accent template-card__accent--${item.titleStyle}`} /><strong>Aa</strong><small className={`template-card__caption template-card__caption--${item.captionPosition}`}>Caption</small></span>
        <span className="template-card__name"><strong>{item.name}</strong>{settings.templateId === item.id && <Check size={13} />}</span>
        <small>{item.description}</small>
        <span className="template-card__meta">{item.captionStyle} · {item.captionPosition} · {item.titleStyle}</span>
      </button>)}
    </div>
    <p className="studio-small-copy"><Layers3 size={14} /> Applying a template changes the live preview and export styling while preserving your clips, transcript, captions and logo. All settings remain editable below.</p>
  </section>;
}
