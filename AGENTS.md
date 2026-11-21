# PawTrack architecture

PawTrack is a framework-free, installable pet-care journal. Serve `public/` directly and route only `/api/*` to the Netlify Server. Do not introduce a catch-all rewrite that shadows the API.

- `public/index.html` contains the application shell, metadata, navigation, and dialogs. `public/style.css` contains the responsive layout, care-category colors, and typography.
- `public/views.js` renders the overview, activity list, schedule, and weight graph. Use `esc` for user-supplied markup values. Use the local SVG sprite for UI icons.
- `public/app.js` handles form interactions, API persistence, and portable backup/restore. `public/seed.js` contains the sample journal from the original tracker. `public/journal.js` shares validation rules with the server.
- `public/install.js`, `public/manifest.webmanifest`, and `public/sw.js` implement installation and the offline fallback. The worker does not cache private journal responses or pet photos. Keep installation available even when the native prompt event is absent.
- `netlify/server/index.mjs` handles journal reads, revision-checked writes, and private photo uploads and reads. Notes and care records live in Netlify Database; images live in Netlify Blobs. Do not use browser storage as the source of truth.
- `db/schema.ts` is the database schema. Track generated migrations in `netlify/database/migrations/`. A notebook is saved atomically because backup restores, pet deletions, and record edits must not leave orphaned activities. Never return its internal owner key.
- `public/img/` includes a custom starter portrait, the original pet-type illustrations, and the PWA icons. Serve the starter photograph through the Image CDN and keep a local fallback. Fonts are self-hosted in `public/fonts/`.

Preserve the original JSON backup format where feasible. New fields should be optional or have a migration path. Preserve error reporting: the UI must not report a successful save until the database has acknowledged it. Reminders are in-app schedule entries, not OS notifications.
