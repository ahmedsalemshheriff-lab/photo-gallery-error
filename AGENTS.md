# AGENTS.md

## Architecture
- `public/`: the whole frontend. It is static and has no build step.
  - `index.html` + `booth.mjs`: the Pose Roll page (rolling, pose deck, upload dialog, ticket dialog).
  - `wall.html` + `wall.mjs`: the Gallery Wall (listing, filters, likes, organizer delete). Pretty URLs serve it at `/wall`.
  - `privacy.html`: the privacy policy (`/privacy`). Rule 1 is that no screenshots of the Gallery Wall are allowed in any manner.
  - `capture-guard.mjs`: screenshot deterrents loaded by `wall.mjs`. It covers guest photos on capture shortcuts, focus loss, tab hiding and print, and blocks saving or dragging images. It can't stop every device's screenshots.
  - `poses.mjs`: the single source of truth for the pose deck. The server imports it too, to check pose ids and set the party size.
  - `ui.mjs`: small DOM helpers. `styles.css`, `icons.svg` (SVG sprite) and `fonts/` hold the styling.
  - `img/<pose-id>.jpg`: pose reference photos, served through `/.netlify/images`.
- `netlify/server/index.ts`: a Hono app on the Netlify Server, limited to `/api/*` (`export const config`).
  - `GET /api/gallery?mode=&cursor=` returns `{ posts, nextCursor }` (keyset pagination on `created_at, id`).
  - `POST /api/gallery` takes multipart `photo` (JPEG, compressed in the browser), `name`, `caption`, `mode` and `pose`, and returns `{ id }`.
  - `GET /api/gallery/:id` and `GET /api/gallery/:id/image`.
  - `PUT|DELETE /api/gallery/:id/like` uses an anonymous `ff_visitor` httpOnly cookie.
  - `DELETE /api/gallery/:id` requires the `X-Gallery-Organizer-Code` header to match the organizer passkey (`GALLERY_ORGANIZER_CODE` env var, default `2026`).
- `db/schema.ts`: Drizzle schema (`posts`, `post_likes`). Like counts are computed from `post_likes`; there is no counter column.
- Photos are stored in the Netlify Blobs store `gallery-photos`, keyed by post id.

## Conventions
- Plain ES modules and DOM APIs in the browser. Keep it framework-free.
- Schema changes: edit `db/schema.ts`, then run `npx drizzle-kit generate --name <change>`. Never edit applied migrations.
- User-facing branding is "Funfair Fiesta" with the tagline "Ticket to Fiesta Counter".
- Party sizes are always `solo`, `duo` or `group` (3+).
