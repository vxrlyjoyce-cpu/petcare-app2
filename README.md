# PawTrack

PawTrack is an installable pet-care journal based on the supplied multi-pet tracker. It includes pet profiles and photos, meal and exercise logs, medication and wellness entries, weight trends, and a care schedule. Barnaby and Mochi are starter profiles: choose **Switch pet → Add a pet** to create your own.

The **Install app** button opens the native installation prompt when the browser offers one. Otherwise it shows device-specific instructions. Installation requires a secure context (HTTPS or localhost). Installation is optional; the journal works in a normal browser tab as well. Recording and retrieving care data requires a connection; offline launches display a reconnect page.

## Technology

The browser app uses native HTML, CSS, ES modules, a web manifest, and a service worker. Fonts and illustrations ship with the app. A Node.js Netlify Server handles the private journal API. Drizzle and Netlify Database store each notebook with a revision check to prevent conflicting writes. Pet photos use Netlify Blobs.

An HTTP-only cookie identifies each browser’s notebook. This is not an account system: it does not automatically sync separate browsers or devices. Use **Journal settings → Export backup** before clearing cookies, changing browsers, or moving to another device. Restoring a backup replaces the current notebook after confirmation. Exports include photos; backups from the original tracker are supported.

## Local development

Use Node.js 24 and a Netlify CLI linked to this project. Run `npm ci`, then `netlify dev --port 8889`, and open `http://localhost:8889`. Use the Netlify environment so the server has access to the managed database and blob storage. Opening the HTML file directly does not start the API.

The static publish directory is `public/`; there is no frontend build step. Database schema changes belong in `db/schema.ts`. Generate corresponding migrations with `npm run db:generate -- --name descriptive_name`. Migrations are applied on deploy.
