import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { StepId } from "../types";

const STEPS: Array<{ id: StepId; number: string; label: string }> = [
  { id: "upload", number: "01", label: "Add source" },
  { id: "select", number: "02", label: "Pick moments" },
  { id: "edit", number: "03", label: "Refine edit" },
  { id: "export", number: "04", label: "Export" },
];

export function StudioHeader({ currentStep, onStep, sourceReady, busy = false }: { currentStep: StepId; onStep: (step: StepId) => void; sourceReady: boolean; busy?: boolean }) {
  const activeIndex = STEPS.findIndex((step) => step.id === currentStep);
  return (
    <>
      <header className="studio-topbar">
        <a className="studio-brand" href="/" aria-label="Back to Frame and Key service page">
          <span className="studio-brand__mark" aria-hidden="true"><span /><i /></span>
          <span><strong>Frame <em>&amp;</em> Key</strong><small>LOCAL EDIT STUDIO</small></span>
        </a>
        <a className="studio-back" href="/"><ArrowLeft size={15} /> Back to service page</a>
      </header>
      <div className="studio-intro">
        <div>
          <p className="studio-eyebrow">THE WORKSPACE / 01</p>
          <h1>Make the useful<br /><em>moments move.</em></h1>
          <p className="studio-lede">Find clear moments in a long recording, shape them into vertical clips, then keep every decision in your hands.</p>
        </div>
        <aside className="studio-privacy-note">
          <span className="studio-privacy-note__mark"><Check size={16} /></span>
          <div><strong>Your media stays on this device.</strong><p>Video and audio are processed in your browser. Public model files download only when you choose to use them.</p></div>
        </aside>
      </div>
      <nav className="studio-steps" aria-label="Editing steps">
        {STEPS.map((step, index) => {
          const completed = index < activeIndex || (step.id === "upload" && sourceReady && currentStep !== "upload");
          const disabled = busy || (!sourceReady && step.id !== "upload");
          return (
            <button key={step.id} type="button" className={`studio-step${step.id === currentStep ? " is-active" : ""}${completed ? " is-complete" : ""}`} onClick={() => onStep(step.id)} disabled={disabled} aria-current={step.id === currentStep ? "step" : undefined}>
              <span className="studio-step__number">{completed ? <Check size={13} /> : step.number}</span><span className="studio-step__label">{step.label}</span>
              {index < STEPS.length - 1 && <ArrowRight className="studio-step__arrow" size={14} aria-hidden="true" />}
            </button>
          );
        })}
      </nav>
    </>
  );
}
