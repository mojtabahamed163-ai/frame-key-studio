# Delivery Manifest — Frame & Key Studio

This manifest defines what should be included in a clean buyer delivery. It is documentation only; it does not create an archive or change repository ownership.

## Include

### Source and build

- `client/`
- `server/`
- `shared/`
- `drizzle/`
- `patches/`
- `public`/asset files at the repository root and under `client/public/`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `vite.config.ts`
- `vitest.config.ts`
- `drizzle.config.ts`
- `Dockerfile`
- `.dockerignore`
- `app.config.ts`
- `template.json`
- `components.json`
- `.manus-starter-init.json`

### Documentation and legal notices

- `README.md`
- `BUYER_HANDOFF.md`
- `THIRD_PARTY_NOTICES.md`
- `docs/test-results-2026-11-03.md`
- `docs/manual-acceptance-checklist.md`
- `docs/delivery-manifest.md`
- Relevant historical reports under `docs/`
- `PROJECT_TRANSFER_AR.md` and `HANDOFF.md` when the buyer needs historical platform context
- `TODO.md`, `plan.md`, and relevant design/validation notes when the buyer wants project history

### Verification assets

- All `*.test.ts` and `*.test.tsx` files.
- Checked-in SQL migrations and Drizzle metadata.
- Any test fixture included in Git only when its redistribution rights are clear.

## Exclude from a clean delivery

- `node_modules/`
- `dist/`, `build/`, coverage directories, caches, and package-manager stores
- `.env`, `.env.*`, local secret/config files, credentials, tokens, private keys, and local database files
- Logs, shell history, editor metadata, OS files, and temporary files
- Personal lead records, platform account data, cookies, browser profiles, and user uploads
- Videos, audio, stock media, music, logos, screenshots, or fonts without clear redistribution rights
- Local model caches and downloaded model weights unless the buyer has reviewed the current model terms and explicitly wants them included
- Any files generated outside Git that are referenced only by historical reports unless they are legally redistributable and intentionally added to the handoff

## Pre-delivery checks

Run from a clean checkout:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test -- --run
pnpm build
git diff --check
git status --short
```

Then perform a full-history secret scan. Rotate any credentials that may have existed in platform settings or outside Git. Create buyer-owned Manus/Forge/database credentials rather than handing over personal credentials.

## Ownership boundary

The delivery can transfer the seller's rights in original project code according to the signed agreement. It does not transfer exclusive ownership of third-party packages, model weights, public model hosts, Manus/Forge services, domains, accounts, or media assets unless the agreement explicitly and legally covers those items. Keep `THIRD_PARTY_NOTICES.md` with every redistributed build.
