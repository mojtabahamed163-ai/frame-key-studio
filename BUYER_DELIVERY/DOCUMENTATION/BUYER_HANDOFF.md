# Buyer Handoff

## Repository and branch

The source repository is `https://github.com/mojtabahamed163-ai/frame-key-studio`. This delivery is prepared on branch `buyer-delivery-2026-11-16`. The final commit is recorded in `BUYER_DELIVERY/REPORTS/FINAL_BUYER_DELIVERY_REPORT.md` after push.

## Local operation

Use `pnpm install --frozen-lockfile`, then `pnpm dev:static` and open `/studio`. The Studio is browser-local and keeps project state in the active browser profile. It is not automatically synchronized between browsers or devices.

## Build and optional server shell

Use `pnpm check`, `pnpm test -- --run`, and `pnpm build`. The built server shell can be started with `NODE_ENV=production PORT=3000 pnpm start`, but server-side features need their documented environment and database configuration. Do not interpret a missing server integration as a failure of the local media workflow.

## Important configuration

Do not commit `.env` files, credentials, model weights, private media, database dumps, or API keys. The local Studio needs browser storage, WebAssembly, media decoding, and first-use public model downloads. Export behavior depends on WebCodecs and encoder support in the browser/device.

## Evidence package

- `DEMO/` contains preserved genuine recordings, an edited buyer-demo container, and explicit notices for the missing 70-second and new 5–8 minute recordings.
- `SOURCE/` contains the genuine 6:54 source WebM used by the earlier buyer evidence.
- `EXPORTS/` contains a verified source-language-caption WebM and a verified bilingual Arabic WebM. The requested Spanish export is explicitly marked not found.
- `REPORTS/` contains status, verification, probe, checksum, feature, and limitation reports.
- `VERIFICATION/` contains generated probe/decode records and representative frames.

## Known limitations

Whisper output requires human correction. Machine translation may contain linguistic errors and is phrase-timed. Face tracking is optional and must not be described as universally verified. WebM is the verified export format in the available evidence. Browser compatibility, long-export memory behavior, model download availability, and platform upload acceptance require buyer-specific testing. No production URL, hosted SaaS, revenue, customer traction, or billing system is claimed.
