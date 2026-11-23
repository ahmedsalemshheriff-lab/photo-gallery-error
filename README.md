# Funfair Fiesta: Ticket to Fiesta Counter

Funfair Fiesta is a party photo site. Guests roll a meme pose (Solo, Duo or Group 3+), recreate it, and post the photo to a shared **Gallery Wall**. After posting, they get a Fiesta ticket. Guests can like photos on the wall, and organizers can delete any photo with the organizer passkey.

## Pages

- **Pose Roll** (`/`): roll a random pose or browse the pose deck by party size, then upload a photo.
- **Gallery Wall** (`/wall`): every guest photo, with filters by party size, likes, and organizer delete tools.

## Tech

- Static HTML, CSS and ES modules in `public/`. There is no frontend build step.
- A Netlify Server (Hono) in `netlify/server/index.ts` serves the `/api/*` endpoints.
- Netlify Database (Postgres, via Drizzle ORM) stores posts and likes. The schema is in `db/schema.ts`, and migrations are in `netlify/database/migrations/`.
- Netlify Blobs stores the uploaded photos.
- Netlify Image CDN resizes the pose reference images.

## Running locally

```bash
npm install
netlify dev --port 8889
```

## Organizer passkey

Only organizers can delete photos from the Gallery Wall. The passkey defaults to `2026`. To change it without touching the code, set the `GALLERY_ORGANIZER_CODE` environment variable.

## Adding poses

1. Put a JPG in `public/img/<pose-id>.jpg`.
2. Add an entry to `public/poses.mjs` with an `id`, a `mode` (`solo`, `duo` or `group`), a `name` and a `tip`.
