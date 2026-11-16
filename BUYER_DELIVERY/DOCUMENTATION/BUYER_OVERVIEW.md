# Frame & Key Studio — Buyer Overview

**Prepared for:** Clinton Beiter — RETIEB Labs LLC  
**Repository:** https://github.com/mojtabahamed163-ai/frame-key-studio  
**Delivery status:** **PASS for the new continuous buyer demonstration; the distinct historical 70-second recording remains unavailable**

## What the product does

Frame & Key Studio is a browser-local short-form video editor. A user selects a local recording, reviews its duration and dimensions, runs optional browser-side Whisper transcription, receives transcript-based clip suggestions, edits captions and clip boundaries, reframes the selection for a 9:16 portrait canvas, optionally translates English captions locally, and exports a locally rendered WebM when the browser supports the required WebCodecs path.

The intended customers are real-estate marketers, social-content teams, educators, podcasters, interview editors, and creators who need a reviewable workflow for turning longer recordings into short social clips.

## Problem addressed

Useful moments in long recordings are expensive to identify and format manually. The Studio combines local media inspection, timed draft captions, rule-based moment suggestions, editable clip controls, portrait framing, optional branding, and local rendering in one browser workflow.

## Key features documented in the repository

- Local video metadata and audio inspection.
- Browser-worker Whisper transcription with editable timed captions.
- Rule-based clip suggestions derived from transcript timing and sentence rules.
- Manual clip boundaries and caption editing.
- English-source local translation to Arabic, French, Spanish, or German through OPUS-MT models.
- Portrait 9:16 framing, studio-background mode, caption styling, titles, logos, templates, and local Brand Kits.
- Optional face-assisted framing with manual fallback.
- IndexedDB project/settings persistence and optional OPFS source persistence.
- Browser-side WebM/VP9 + Opus export in the verified Chromium evidence.

## Architecture boundary

The core Studio is local browser software. Selected video/audio bytes, frames, transcripts, captions, and rendered media are not sent to the application API or object storage by the Studio media path. First use of Whisper and translation downloads public model files from Hugging Face. The repository also includes an inherited Express/tRPC application shell and inquiry route; those server-side capabilities require separate configuration and are not evidence of a hosted production SaaS.

## What is included

The repository includes the React/TypeScript/Vite client, the local Studio implementation, browser workers, export code, tests, server shell, configuration examples, prior QA reports, and the `BUYER_DELIVERY/` evidence package. The package preserves genuine source media, historical evidence, two new continuous end-to-end browser recordings, actual app-generated Spanish exports, independent media checks, and explicit notices for genuinely missing historical artifacts.

## What the buyer receives in this package

The package includes the genuine 6:54.502 source WebM; preserved 2:15.520 and 2:22.960 screen recordings; the prior edited buyer-demo MP4; a root-level 5:00.920 continuous demo; the recommended visual retake at 5:13.040; verified source-language and bilingual Arabic WebM exports; the existing Spanish export; and newly rendered Spanish WebM exports from the real Studio workflow. The preferred retake is 1920×1080/25 fps H.264, silent, and its representative middle frame shows the Spanish `Sin embargo,` subtitle visibly in the 9:16 portrait preview. The final Spanish clip export is 28.989 seconds at 608×1080, not a full-length source export.

The original historical 70-second recording was not found and is not claimed to be recovered. The new continuous demonstration is a separate deliverable. No other language export is mislabeled as Spanish.

## Production work still necessary

This is not a fully hosted production SaaS. Production deployment would still require a hosting decision, domain, environment and database configuration for server-side routes, authentication/platform integration if desired, operational monitoring, browser/device acceptance testing, legal/licensing review, and a product decision about local-only versus hosted processing. No production URL, revenue, customers, subscriptions, or commercial traction is claimed.
