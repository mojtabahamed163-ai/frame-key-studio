import { Clock3, FileText } from "lucide-react";
import type { CaptionCue } from "../types";

export function CaptionCueEditor({ cues, clipStart, clipEnd, onChange }: {
  cues: CaptionCue[];
  clipStart: number;
  clipEnd: number;
  onChange: (cue: CaptionCue, patch: Partial<Pick<CaptionCue, "text" | "start" | "end">>) => void;
}) {
  const visible = cues.filter((cue) => cue.end >= clipStart && cue.start <= clipEnd);
  if (!visible.length) return <div className="studio-empty-inline"><FileText size={17} /><span>No caption lines yet. Transcribe speech or import an SRT/VTT file.</span></div>;
  return (
    <div className="caption-editor-list">
      {visible.map((cue, index) => <article className="caption-editor-row" key={cue.id}>
        <div className="caption-editor-row__index"><span>{String(index + 1).padStart(2, "0")}</span><Clock3 size={13} /></div>
        <div className="caption-editor-row__fields">
          <label className="sr-only" htmlFor={`cue-text-${cue.id}`}>Caption text, line {index + 1}</label>
          <textarea id={`cue-text-${cue.id}`} value={cue.text} rows={2} onChange={(event) => onChange(cue, { text: event.target.value })} />
          <div className="caption-editor-row__times">
            <label>In <input type="number" aria-label={`Caption ${index + 1} start seconds`} min={clipStart} max={clipEnd} step="0.1" value={cue.start.toFixed(1)} onChange={(event) => onChange(cue, { start: Number(event.target.value) })} /></label>
            <label>Out <input type="number" aria-label={`Caption ${index + 1} end seconds`} min={clipStart} max={clipEnd} step="0.1" value={cue.end.toFixed(1)} onChange={(event) => onChange(cue, { end: Number(event.target.value) })} /></label>
          </div>
        </div>
      </article>)}
    </div>
  );
}
