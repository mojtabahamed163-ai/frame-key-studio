import { useState, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Menu,
  Play,
  Scissors,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

const HERO_IMAGE = "/property-interior.svg";
const BRAND_MARK = "/framekey-platform-mark.svg";

type FormState = "idle" | "sending" | "success" | "error";

const included = [
  "Four vertical clips, 15–45 seconds each",
  "Burned-in captions and a clear opening line",
  "One consistent visual treatment for your brand",
  "One consolidated revision round",
  "First delivery within five business days",
];

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark${small ? " brand-mark--small" : ""}`} aria-hidden="true">
      <img src={BRAND_MARK} alt="" />
      <Play className="brand-mark__fallback" fill="currentColor" />
    </span>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setFormState("sending");

    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We couldn't send your request.");
      form.reset();
      setFormState("success");
    } catch {
      setFormState("error");
    }
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell">
      <div className="topline">
        <span className="topline__dot" />
        <p>Short-form edits for real estate teams with a story to tell.</p>
        <a href="#pricing">See the $80 pilot <ArrowRight size={13} aria-hidden="true" /></a>
      </div>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Frame and Key Studio home" onClick={closeMenu}>
          <BrandMark />
          <span className="wordmark__text">
            <strong>Frame <i>&amp;</i> Key</strong>
            <small>STUDIO / PROPERTY CUTS</small>
          </span>
        </a>

        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <nav className={`main-nav${menuOpen ? " main-nav--open" : ""}`} aria-label="Main navigation">
          <a href="#service" onClick={closeMenu}>The edit</a>
          <a href="#process" onClick={closeMenu}>How it works</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <a href="#faq" onClick={closeMenu}>FAQ</a>
          <a className="main-nav__studio" href="/studio" onClick={closeMenu}>Try the local editor <ArrowRight size={13} aria-hidden="true" /></a>
        </nav>

        <a className="button button--dark header-cta" href="#inquiry">
          Request a pilot <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </header>

      <main>
        <section className="hero section-wrap" id="top">
          <div className="hero-copy">
            <p className="eyebrow"><span>01</span> PROPERTY CONTENT, CUT WITH INTENTION</p>
            <h1>One long recording.<br /><em>Four ready-to-post</em><br />property clips.</h1>
            <p className="hero-lede">
              We turn your existing real estate videos into concise vertical edits—with captions,
              considered pacing and a clean first line. Your footage stays yours.
            </p>
            <div className="hero-actions">
              <a className="button button--copper" href="#inquiry">Start with the $80 pilot <ArrowUpRight size={17} aria-hidden="true" /></a>
              <a className="text-link" href="#service">See what’s included <ArrowDownRight size={16} aria-hidden="true" /></a>
            </div>
            <div className="hero-proofline">
              <span><Check size={15} aria-hidden="true" /> One-time pilot</span>
              <span><Check size={15} aria-hidden="true" /> No views promised</span>
              <span><Check size={15} aria-hidden="true" /> No payment on this page</span>
            </div>
            <p className="hero-markets">Designed for property teams in the <strong>U.S. · UK · Canada · Australia · Europe</strong></p>
          </div>

          <div className="hero-art" aria-label="Illustrative property image and vertical-video format preview">
            <div className="hero-art__image">
              <img src={HERO_IMAGE} alt="Illustrative contemporary home interior in warm natural light" />
              <span className="image-stamp">ILLUSTRATIVE IMAGE</span>
              <div className="frame-label"><span className="frame-label__square" /> PROPERTY STORY / 001</div>
            </div>
            <div className="vertical-card" aria-label="Illustration of a vertical video format">
              <div className="vertical-card__top"><span>F&amp;K / EDIT FORMAT</span><span>9:16</span></div>
              <div className="vertical-card__scene"><img src={HERO_IMAGE} alt="" /><span className="scene-play"><Play size={13} fill="currentColor" /></span></div>
              <div className="vertical-card__caption">A little more room<br />to see it differently.</div>
              <div className="vertical-card__meter"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
            </div>
            <div className="hero-note"><span className="hero-note__asterisk">✳</span><p>Your footage.<br /><b>A sharper cut.</b></p></div>
          </div>
        </section>

        <div className="ticker" aria-label="Service details">
          <span>REAL ESTATE STORIES</span><i>✳</i><span>SHORT-FORM EDITING</span><i>✳</i><span>HUMAN-REVIEWED</span><i>✳</i><span>READY FOR 9:16</span><i>✳</i>
        </div>

        <section className="intro section-wrap" id="service">
          <div className="section-kicker"><span>02 / THE EDIT</span><span>FROM YOUR RECORDING TO THE FEED</span></div>
          <div className="intro__grid">
            <h2>The best moments<br />are already <em>in the room.</em></h2>
            <div className="intro__copy">
              <p className="body-large">Property teams make useful videos every week. The editing backlog is what keeps those moments from becoming a steady stream of short-form content.</p>
              <p>Frame &amp; Key works from footage you provide—market updates, explainers, podcast conversations or property walk-throughs—and shapes the clearest moments into vertical clips people can watch without the full recording.</p>
              <div className="honesty-note"><Sparkles size={18} aria-hidden="true" /><span>AI can assist with transcription and first-pass selects. A person reviews every cut and caption before delivery.</span></div>
            </div>
          </div>
        </section>

        <section className="service-band">
          <div className="service-band__inner section-wrap">
            <div className="service-band__heading">
              <p className="eyebrow eyebrow--light"><span>WHAT YOU GET</span></p>
              <h2>A clean edit.<br /><em>Not another content job.</em></h2>
              <p>Bring the source. We handle the short-form finish, then send the files back for your approval.</p>
            </div>
            <div className="service-list">
              <article className="service-item"><span className="service-item__icon"><Scissors size={20} /></span><div><h3>Purposeful cuts</h3><p>Trim the pauses, keep the useful thought and give each clip a clear beginning.</p></div><span className="service-item__no">01</span></article>
              <article className="service-item"><span className="service-item__icon"><span className="caption-glyph">Aa</span></span><div><h3>Readable captions</h3><p>On-screen captions checked for names, numbers and the meaning of the original.</p></div><span className="service-item__no">02</span></article>
              <article className="service-item"><span className="service-item__icon"><Play size={17} fill="currentColor" /></span><div><h3>Vertical-ready exports</h3><p>9:16 MP4 files prepared for Reels, Shorts or TikTok—ready for your review.</p></div><span className="service-item__no">03</span></article>
            </div>
          </div>
        </section>

        <section className="process section-wrap" id="process">
          <div className="section-kicker"><span>03 / THE ROUTE</span><span>THREE STEPS, NO MYSTERY</span></div>
          <div className="process-heading"><h2>From long-form<br /><em>to in-motion.</em></h2><p>You stay in control of the footage, the message and the final approval.</p></div>
          <div className="steps">
            <article className="step"><div className="step__top"><span>01</span><span className="step__line" /></div><h3>Send one recording</h3><p>Share a video you own and a few notes on your audience, brand and what matters most.</p><span className="step__tag">YOU PROVIDE THE SOURCE</span></article>
            <article className="step"><div className="step__top"><span>02</span><span className="step__line" /></div><h3>We shape the moments</h3><p>We select concise sections, format for vertical viewing, add captions and apply a simple visual style.</p><span className="step__tag">WE EDIT + REVIEW</span></article>
            <article className="step"><div className="step__top"><span>03</span><span className="step__line" /></div><h3>You approve the cuts</h3><p>Review the MP4s, send one consolidated revision and post only when you’re happy with them.</p><span className="step__tag">YOU KEEP THE FINAL SAY</span></article>
          </div>
        </section>

        <section className="pricing section-wrap" id="pricing">
          <div className="section-kicker"><span>04 / THE INVESTMENT</span><span>START SMALL, STAY OPTIONAL</span></div>
          <div className="pricing-heading"><div><h2>A first step<br /><em>without a retainer.</em></h2></div><p>Try the editing rhythm with a single paid pilot. If it fits your workflow, choose monthly clips later. Prices are in USD; final scope is confirmed before work starts.</p></div>
          <div className="price-layout">
            <article className="price-card price-card--featured">
              <div className="price-card__top"><span className="price-label">THE PILOT</span><span className="price-chip">ONE-TIME</span></div>
              <div className="price-amount"><span className="currency">$</span><span className="amount">80</span><span className="per">/ 4 clips</span></div>
              <p className="price-desc">A focused first edit from one client-provided recording of up to 30 minutes.</p>
              <ul>{included.map((item) => <li key={item}><Check size={16} aria-hidden="true" />{item}</li>)}</ul>
              <a className="button button--copper button--wide" href="#inquiry">Request the pilot <ArrowUpRight size={16} aria-hidden="true" /></a>
              <p className="price-footnote">No payment is collected on this website.</p>
            </article>
            <article className="price-card price-card--monthly">
              <div className="price-card__top"><span className="price-label">THE STEADY EDIT</span><span className="price-chip price-chip--outline">OPTIONAL MONTHLY</span></div>
              <div className="price-amount"><span className="currency">$</span><span className="amount">300</span><span className="per">/ month</span></div>
              <p className="price-desc">For teams with a regular recording habit and a calendar to fill.</p>
              <ul>
                <li><Check size={16} aria-hidden="true" />12 vertical clips from up to 3 recordings</li>
                <li><Check size={16} aria-hidden="true" />Captions and opening lines on every clip</li>
                <li><Check size={16} aria-hidden="true" />One revision round per clip</li>
                <li><Check size={16} aria-hidden="true" />Agree the next month only if it suits you</li>
              </ul>
              <a className="button button--outline button--wide" href="#inquiry">Ask about monthly edits <ArrowUpRight size={16} aria-hidden="true" /></a>
              <p className="price-footnote">The monthly option is not required to start.</p>
            </article>
          </div>
          <p className="pricing-disclaimer"><ShieldCheck size={16} aria-hidden="true" /> You own your source footage. Final exports are for your channels. No promise of reach, leads or sales—just a clear editing scope.</p>
        </section>

        <section className="faq section-wrap" id="faq">
          <div className="section-kicker"><span>05 / THE DETAILS</span><span>GOOD QUESTIONS, STRAIGHT ANSWERS</span></div>
          <div className="faq-layout"><div><h2>Before we<br /><em>press play.</em></h2><p>Still unsure if your footage is a fit? Send a short note and we’ll take a look at the scope.</p><a className="text-link" href="#inquiry">Ask about your recording <ArrowRight size={16} /></a></div>
            <div className="faq-list">
              <details><summary>Do you film or write scripts? <ChevronDown size={18} /></summary><p>No. This offer is for editing footage you already have. Filming, new scripts, posting and scheduling are outside this package.</p></details>
              <details><summary>What kind of footage works? <ChevronDown size={18} /></summary><p>Market explainers, property walk-throughs, interviews or podcast/video recordings. For the pilot, one source recording can be up to 30 minutes. Please send only footage you have permission to use.</p></details>
              <details><summary>How do revisions and delivery work? <ChevronDown size={18} /></summary><p>The first pilot batch is delivered within five business days after the source file and brand notes arrive. One consolidated revision round is included. We confirm timing before starting.</p></details>
              <details><summary>Who owns the footage and finished clips? <ChevronDown size={18} /></summary><p>You keep ownership of your source material and may publish the final MP4 exports on your own channels. Editable project files, third-party stock and music licenses are not included.</p></details>
              <details><summary>Will the videos get more views or leads? <ChevronDown size={18} /></summary><p>There is no guarantee of reach, enquiries or sales. The service is an editing deliverable, not a performance promise.</p></details>
              <details><summary>Is there a checkout or automatic subscription? <ChevronDown size={18} /></summary><p>No. This page collects an enquiry only. We confirm fit and scope first; no payment is taken here, and the monthly option is entirely optional.</p></details>
            </div>
          </div>
        </section>

        <section className="contact-section" id="inquiry">
          <div className="contact-inner section-wrap">
            <div className="contact-copy">
              <p className="eyebrow eyebrow--light"><span>06 / YOUR NEXT CUT</span></p>
              <h2>Let’s find the<br /><em>right moments.</em></h2>
              <p>Tell us what you record and what you’d like to make from it. This is an enquiry—not a purchase or a commitment.</p>
              <div className="contact-promise"><span className="contact-promise__icon"><ShieldCheck size={18} /></span><p><b>Privacy, kept practical.</b><br />Your details are used to review and reply to this request. They are not used for a marketing list. Please don’t include sensitive information.</p></div>
            </div>
            <div className="contact-form-panel">
              {formState === "success" ? (
                <div className="form-success" role="status" aria-live="polite">
                  <span className="success-icon"><Check size={23} /></span>
                  <p className="eyebrow">REQUEST RECEIVED</p>
                  <h3>Thanks for the context.</h3>
                  <p>We’ll review your note and follow up about the fit and next steps. No payment was taken.</p>
                  <button className="text-link text-button" type="button" onClick={() => setFormState("idle")}>Send another enquiry <ArrowRight size={15} /></button>
                </div>
              ) : (
                <form className="inquiry-form" onSubmit={handleSubmit}>
                  <div className="form-heading"><span>START WITH THE PILOT</span><span>~ 2 MIN</span></div>
                  <label htmlFor="fullName">Your name <span>*</span></label>
                  <input id="fullName" name="fullName" autoComplete="name" placeholder="Alex Morgan" minLength={2} maxLength={100} required />
                  <label htmlFor="email">Work email <span>*</span></label>
                  <input id="email" name="email" type="email" autoComplete="email" placeholder="alex@yourbusiness.com" maxLength={320} required />
                  <label htmlFor="role">What best describes you? <span>*</span></label>
                  <select id="role" name="role" defaultValue="" required>
                    <option value="" disabled>Choose one</option>
                    <option value="agent">Real estate agent</option>
                    <option value="investor-educator">Investor / educator</option>
                    <option value="brokerage-team">Brokerage or team</option>
                    <option value="other">Other property business</option>
                  </select>
                  <label htmlFor="message">What do you record—and what do you need? <span>*</span></label>
                  <textarea id="message" name="message" rows={4} minLength={10} maxLength={1200} placeholder="A weekly market update, a property tour, a podcast…" required />
                  <div className="honeypot" aria-hidden="true"><label htmlFor="website">Leave this field blank</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
                  {formState === "error" && <p className="form-error" role="alert">We couldn’t send that just now. Please check the fields and try again.</p>}
                  <button className="button button--copper button--wide form-submit" type="submit" disabled={formState === "sending"}>
                    {formState === "sending" ? "Sending…" : "Send my enquiry"} <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                  <p className="form-privacy">By sending this form, you’re asking us to reply about this enquiry. No marketing emails. No payment collected.</p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="wordmark wordmark--footer" href="#top">
          <BrandMark small />
          <span className="wordmark__text"><strong>Frame <i>&amp;</i> Key</strong><small>STUDIO / PROPERTY CUTS</small></span>
        </a>
        <p>Considered short-form edits for property stories.</p>
        <a className="back-top" href="#top">BACK TO TOP <ArrowUpRight size={14} /></a>
        <span className="footer-legal">Illustrative imagery. No performance outcomes guaranteed.</span>
      </footer>
    </div>
  );
}
