# Frame & Key Studio — Real Estate Short-Form Video Editing

React / Express / tRPC / Drizzle starter, adapted from the Sandbox web-db-user template.

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply new schema changes.
- `pnpm check` / `pnpm test`: types and application tests.

Start with the Webdev skill's default-template guide. Platform login, storage, payments and service contracts live in its shared references; read the relevant capability before extending its helper.

## Supported local-studio scope

The `/studio` editor is local-first: the selected video, audio, transcript and exported Blob stay in the browser unless the user separately submits the existing service inquiry form on the home page. The primary supported source scope is MP4/H.264 up to 1080p, 30 minutes, and 1 GB. Silent video is accepted for manual cuts and export, but speech analysis requires an audio track. Other formats may work when the browser decoder and WebCodecs support them, but they are not guaranteed.

The editor targets current Chrome, Firefox and Safari/WebKit on a capable desktop or recent mobile device. It can fall back from direct file saving to a browser download, while in-memory exports and ZIP batches remain intentionally limited to protect device memory. 4K, very long recordings and weak-memory devices are outside the stable scope. Projects and settings are saved in IndexedDB; the original video is not retained unless the user explicitly chooses the optional local OPFS source save.

For local development, run `pnpm install --frozen-lockfile`, then `pnpm dev`. Before delivery, run `pnpm check`, `pnpm test -- --run`, `pnpm build`, and `git diff --check`.

`server/_core/publicConfig.ts` exposes only named public runtime values. Private keys stay server-side. The platform serves managed `/manus-storage/` assets; the application does not register a second proxy.

Platform configuration is readable and editable through `webdev.config`. Default settings are initial values, not enforced constraints. The agent may modify the files, commands and configuration or follow the flexible guide for another stack.
