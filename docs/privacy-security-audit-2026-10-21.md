# Frame & Key Studio — Privacy, Security, Licensing & Repository Audit

Date: 2026-10-21
Branch: `task/8-privacy-security-audit`

## Scope and evidence

The audit inspected the checked-out repository, Git remote and history, application routes, client media and storage code, server configuration, dependency manifests and lockfile, third-party notices, and the existing automated tests. No secrets, private videos, or confidential project files were uploaded or printed.

The repository was already an established application. Existing legal notices, the public inquiry flow, the local studio flow, and unrelated changes were preserved.

## Data flow and privacy findings

- The `/studio` media path accepts a local `File`, creates browser object URLs, reads metadata/audio locally, and passes audio windows to a browser worker. There is no `/api` or object-storage call in the studio media path for video, audio, captions, transcripts, thumbnails, or exports.
- Optional model downloads are external requests to public model hosting when the user explicitly starts transcription, translation, or face detection. These downloads do not include the user’s media or transcript.
- Projects, settings, transcripts, and optional OPFS source files are stored in the user’s browser. The source video is not persisted unless the user explicitly selects the local-source option. Clearing browser storage can remove project records.
- The existing home-page inquiry form is intentionally different: it sends the submitted name, email, role, and message to `/api/leads`, stores the inquiry in the managed database, and may send the inquiry to the project owner through the configured notification service. This is disclosed separately in the product flow.
- The application requests Google Fonts from `fonts.googleapis.com`/`fonts.gstatic.com` for the interface. This request does not contain studio media or transcript content. The external-font notice was added to `THIRD_PARTY_NOTICES.md`.
- OAuth, platform configuration, maps, storage helpers, and server-side speech/image helpers exist in the starter/server surface. The current `appRouter` does not expose a media-upload or remote-transcription procedure. The server-side speech helper is therefore not part of the reachable studio flow; it must be re-audited before any future route exposes it.
- The built-in Manus debug collector is a platform diagnostic asset under `client/public/__manus__/`; it is not application analytics. It may collect diagnostic console/UI events when the host enables it.

## Confirmed issues and remediation

### High — production dependency advisories

`pnpm audit --prod --audit-level=high` initially reported 92 advisories, including high/critical issues in Axios, MySQL2, tRPC, Drizzle ORM, fast-xml-parser, Express transitive packages, and nanoid. The direct packages were updated to patched compatible releases, and supported transitive fixes were pinned in `pnpm-workspace.yaml` without a broad framework rewrite. The final production audit reported **0 info, 0 low, 0 moderate, 0 high, 0 critical** advisories.

### Medium — sensitive upstream response details could enter logs/errors

The notification helper logged the upstream response body, storage helpers included upstream response text in thrown errors, and the dormant storage proxy logged the Forge response body. Those bodies can contain internal service details or echoed request data. The helpers and proxy now report only status/status text or status codes.

### Medium — unnecessarily large request body limit

The server had 50 MB JSON and URL-encoded body limits even though the application does not accept media uploads through those routes. The limits are now 1 MB, which remains far above the inquiry schema’s 1,200-character message limit and reduces avoidable memory/DoS exposure.

## Secrets and repository hygiene

- `.env` is ignored and no environment file, private key, credential file, media export, or archive is tracked.
- The repository history scan found no matching credential literals for common AWS, GitHub, OpenAI-style, bearer-token, or private-key patterns.
- Runtime secrets are read from environment configuration and are not committed. No real secret values were printed.
- The existing Git remote is the user-selected GitHub repository. Work was performed on a dedicated task branch; no force-push or history rewrite was used.

## Licensing and attribution

- The package manifest declares MIT for the application.
- Relevant studio dependencies and models are listed in `THIRD_PARTY_NOTICES.md`, including Mediabunny MPL-2.0, Transformers.js/TensorFlow.js/face detection Apache-2.0, fflate MIT, Whisper Tiny Apache-2.0, and OPUS-MT model attribution under CC BY 4.0 as documented by the project’s source cards.
- The external Google Fonts request is now disclosed. Model files remain externally hosted and are not bundled in the repository.
- License terms and upstream availability can change; the notices explicitly require rechecking the authoritative source before redistribution or commercial use.

## Validation

The following checks passed after remediation:

- `pnpm check`
- `pnpm test -- --run` — 9 test files, 50 tests passed
- `pnpm build`
- `git diff --check`
- `pnpm audit --prod --audit-level=high` — 0 high/critical findings and 0 total findings in the final report

The build still emits two non-blocking warnings already present in the project: the platform config script is not a module, and some generated chunks exceed 500 kB. These are performance/build warnings, not privacy or security failures.

## Remaining risks and manual actions

- Browser-local storage is not encryption at rest; anyone with access to the same browser profile can inspect it. Users should avoid storing sensitive recordings in shared profiles and should clear local projects when appropriate.
- Public model downloads depend on the model host, the browser cache, and the model’s current license/availability. The app does not guarantee offline inference or a fixed download size beyond the UI estimates.
- The public inquiry endpoint still stores submitted contact information by design and relies on the configured managed database and notification service. Production owners should configure retention/access policies for that service.
- Before exposing any currently unreachable server-side media/transcription helper, add an explicit privacy review, route-level authorization, upload limits, content-type validation, and tests demonstrating the exact data flow.
- This is an evidence-based repository audit, not a guarantee of absolute security or a substitute for infrastructure/provider review.
