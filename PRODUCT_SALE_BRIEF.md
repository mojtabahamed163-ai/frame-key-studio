# Frame & Key Studio — Product Sale Brief

## Product

Frame & Key Studio is a browser-local short-form video editor for turning longer recordings into editable vertical clips. The current product runs inside a modern browser: the user chooses a local video, reviews or creates a clip, adjusts the in/out points, selects framing and export quality, configures captions and brand styling, and exports a WebM file locally.

This is a source-code product asset and a local browser editor. It is **not** being represented as a hosted SaaS product, a cloud media-processing service, or a product with existing users, customers, or revenue.

## Commercial value without overclaiming

The project may be useful to a buyer who wants a working starting point for a privacy-oriented browser editor, a local-first video workflow, or a vertical-content production tool. Its value is in the existing implementation, tests, documentation, local media pipeline, editable UI, and extensible architecture. Commercial value will depend on the buyer's rights review, product positioning, browser support, model availability, distribution plan, and any further work they choose to fund.

No revenue, customer count, usage, conversion rate, market validation, or guaranteed audience growth is claimed.

## Potential buyer profiles

- Small media, real-estate, education, podcast, restaurant, or marketing teams that want local clip preparation.
- Developers evaluating browser-local video processing with WebAssembly/WebCodecs.
- Product teams seeking a base for a privacy-oriented editing workflow.
- Agencies or internal content teams that need editable portrait exports without sending source media to a server.

These are possible use cases, not evidence of current customers or market adoption.

## Implemented capabilities

- Local video selection and browser-side media inspection.
- Local project persistence using browser storage where supported.
- Manual clip selection and editable start/end points.
- Rule-based clip suggestions from timed speech when a successful local Whisper run is available; suggestions remain subject to user review.
- Local Whisper worker integration for English and multilingual speech models.
- Optional local English-to-Arabic, French, Spanish, and German OPUS-MT translation models.
- Caption workflow controls, including source/translation track selection, word-caption mode, active-word color presets, text/stroke styling, and subtitle file export.
- Portrait framing, fit-with-background, smart-framing and manual horizontal framing options.
- Face assistance that tracks a face locally but does not infer speaker identity.
- Editable templates, brand controls, local brand kits, title/post-copy fields, and optional locally kept logo input.
- Local WebM/VP9 + Opus export with quality and resolution options, direct save support where the browser provides it, and a memory-limited ZIP path for small batches.
- A small inherited server shell for the public page, optional inquiry form, and platform integrations; those services are not required for the local `/studio` workflow.

## Technology

React, TypeScript, Vite, Tailwind CSS, Mediabunny, Transformers.js, TensorFlow.js, Web Workers, WebAssembly/WebCodecs, IndexedDB/OPFS where supported, and a Node/Express server shell. See `README.md`, `BUYER_HANDOFF.md`, `THIRD_PARTY_NOTICES.md`, `ASSET_LICENSES.md`, and `INDEPENDENCE_AUDIT.md` for implementation and licensing details.

## Operation and independence

The core Studio path can be run locally after installing Node.js and pnpm. Source video, audio, transcripts, captions, and exports are processed in the browser and are not uploaded by the Studio media path. The first use of Whisper or OPUS-MT requires network access to download public model files from Hugging Face. The buyer must use buyer-owned credentials for any optional database, OAuth, platform, storage, or inherited server integrations.

Typical local setup:

```bash
pnpm install --frozen-lockfile
pnpm dev
# open /studio
```

For a production-style local build:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

## What the buyer receives

- The Git repository and source history on the agreed GitHub repository.
- Client, server, shared, migrations, tests, configuration, and package lock files.
- Existing product and handoff documentation.
- `buyer-materials/` with the real UI screenshots and the real manually exported portrait WebM produced during this handoff validation.
- Historical validation reports where they are useful for understanding the implementation.

The buyer does not receive ownership of third-party packages, model weights, public model hosts, external fonts, third-party media, GitHub/Manus/Forge accounts, domains, credentials, customer data, or any trademark rights not covered by a separate written agreement.

## Buyer setup responsibilities

The buyer should create and control their own GitHub, hosting/platform, database, OAuth, storage, and external service accounts as needed. They should review current package and model licenses, confirm rights for any media used in demonstrations, rotate any credentials held outside the repository, test target browsers and codecs, and obtain any legal or trademark review required for their distribution.

## Known limits

- Maximum export clip length is 3 minutes; longer clips must be shortened before export.
- Whisper and translation model downloads may be slow or unavailable depending on network access, browser storage, memory, and model-host availability.
- Whisper output can contain recognition, language, name, word-boundary, or timing errors and requires human review.
- Automatic suggestions use transcript timing and rule-based scoring; they do not understand virality, guarantee engagement, or replace editorial review.
- OPUS-MT translation is currently English-source only for Arabic, French, Spanish, and German, with phrase-level timing.
- Portrait cropping cannot restore detail outside the source crop. Browser codec support varies; WebM/VP9 + Opus is the tested output path.
- Browser-local projects and cached models are device-specific, quota-limited, clearable, and not synchronized to the repository.
- The current handoff validation did not complete a Whisper transcription or Arabic translation because the local model stayed at 0% in the available browser environment. Those steps are therefore not claimed as demonstrated in the current sale package.
- No screen-recorded walkthrough is included in this package. The included video is a real local export from the Studio, not a screen recording.

## Handoff posture

This brief intentionally separates implemented code, observed validation evidence, historical reports, and future work. It does not promise deployment, customers, revenue, feature expansion, or successful operation in every browser.
