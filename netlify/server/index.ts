import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { db } from "../../db/index.js";
import { postLikes, posts } from "../../db/schema.js";
// Shared with the browser so the server accepts exactly the poses shown in the deck.
import { poseById } from "../../public/poses.mjs";

export const config = { path: "/api/*" };

// Organizers delete photos with this passkey. Set GALLERY_ORGANIZER_CODE to rotate it without a code change.
const DEFAULT_ORGANIZER_PASSKEY = "2026";
const MODES = new Set(["solo", "duo", "group"]);
const PAGE_SIZE = 12;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const VISITOR_COOKIE = "ff_visitor";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const photos = getStore("gallery-photos");
const app = new Hono();

const fail = (c: Context, status: 400 | 403 | 404 | 413 | 500, message: string) =>
  c.json({ message }, status);

// Anonymous per-browser id so each guest can like a photo once.
function visitor(c: Context, create: boolean) {
  const existing = getCookie(c, VISITOR_COOKIE);
  if (existing && UUID.test(existing)) return existing;
  if (!create) return undefined;
  const id = randomUUID();
  setCookie(c, VISITOR_COOKIE, id, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

const likeCount = sql<number>`(select count(*)::int from ${postLikes} where ${postLikes.postId} = ${posts.id})`;
const likedBy = (visitorId: string | undefined) =>
  visitorId
    ? sql<boolean>`exists(select 1 from ${postLikes} where ${postLikes.postId} = ${posts.id} and ${postLikes.visitorId} = ${visitorId})`
    : sql<boolean>`false`;

const postFields = (visitorId: string | undefined) => ({
  id: posts.id,
  guestName: posts.guestName,
  caption: posts.caption,
  mode: posts.mode,
  poseId: posts.poseId,
  createdAt: posts.createdAt,
  likes: likeCount,
  liked: likedBy(visitorId),
});

type Row = { id: string; guestName: string; caption: string; mode: string; poseId: string | null; createdAt: Date | string; likes: number; liked: boolean };

const serialize = (row: Row) => ({
  id: row.id,
  guestName: row.guestName,
  caption: row.caption,
  mode: row.mode,
  poseId: row.poseId,
  createdAt: new Date(row.createdAt).toISOString(),
  likes: Number(row.likes) || 0,
  liked: Boolean(row.liked),
});

function encodeCursor(row: Row) {
  return Buffer.from(`${new Date(row.createdAt).toISOString()}|${row.id}`).toString("base64url");
}

function decodeCursor(value: string | undefined) {
  if (!value) return undefined;
  const [time, id] = Buffer.from(value, "base64url").toString("utf8").split("|");
  const createdAt = new Date(time ?? "");
  if (Number.isNaN(createdAt.getTime()) || !UUID.test(id ?? "")) return undefined;
  return { createdAt, id };
}

function passkeyMatches(supplied: string) {
  const expected = process.env.GALLERY_ORGANIZER_CODE?.trim() || DEFAULT_ORGANIZER_PASSKEY;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(supplied), digest(expected));
}

const isJpeg = (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

app.get("/api/gallery", async (c) => {
  const mode = c.req.query("mode");
  const cursor = decodeCursor(c.req.query("cursor"));
  const conditions = [];
  if (mode && MODES.has(mode)) conditions.push(eq(posts.mode, mode));
  if (cursor) {
    conditions.push(
      or(lt(posts.createdAt, cursor.createdAt), and(eq(posts.createdAt, cursor.createdAt), lt(posts.id, cursor.id))),
    );
  }
  const rows = (await db
    .select(postFields(visitor(c, false)))
    .from(posts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(PAGE_SIZE + 1)) as Row[];
  const page = rows.slice(0, PAGE_SIZE);
  c.header("Cache-Control", "no-store");
  return c.json({
    posts: page.map(serialize),
    nextCursor: rows.length > PAGE_SIZE ? encodeCursor(page[page.length - 1]) : undefined,
  });
});

app.post("/api/gallery", async (c) => {
  const form = await c.req.formData().catch(() => undefined);
  const photo = form?.get("photo");
  if (!form || !(photo instanceof File) || photo.size === 0) return fail(c, 400, "Choose a photo to post.");
  if (photo.size > MAX_PHOTO_BYTES) return fail(c, 413, "That photo is too large. Please choose a smaller one.");
  const bytes = new Uint8Array(await photo.arrayBuffer());
  if (!isJpeg(bytes)) return fail(c, 400, "We couldn’t read that photo. Try JPG or PNG, or take a new photo.");

  const pose = poseById.get(String(form.get("pose") ?? ""));
  const requestedMode = String(form.get("mode") ?? "");
  const mode = pose?.mode ?? (MODES.has(requestedMode) ? requestedMode : "solo");
  const guestName = String(form.get("name") ?? "").trim().slice(0, 40) || "A Fiesta guest";
  const caption = String(form.get("caption") ?? "").trim().slice(0, 140);

  const id = randomUUID();
  await photos.set(id, bytes.buffer as ArrayBuffer);
  try {
    await db.insert(posts).values({ id, guestName, caption, mode, poseId: pose?.id ?? null });
  } catch (error) {
    await photos.delete(id).catch(() => {});
    console.error("Failed to save gallery post", error);
    return fail(c, 500, "We couldn’t post right now. Please try again.");
  }
  return c.json({ id }, 201);
});

app.get("/api/gallery/:id", async (c) => {
  const id = c.req.param("id");
  if (!UUID.test(id)) return fail(c, 404, "This photo isn’t on the wall.");
  const [row] = (await db.select(postFields(visitor(c, false))).from(posts).where(eq(posts.id, id))) as Row[];
  if (!row) return fail(c, 404, "This photo isn’t on the wall.");
  c.header("Cache-Control", "no-store");
  return c.json(serialize(row));
});

app.get("/api/gallery/:id/image", async (c) => {
  const id = c.req.param("id");
  if (!UUID.test(id)) return c.notFound();
  const image = await photos.get(id, { type: "arrayBuffer" });
  if (!image) return c.notFound();
  return c.body(image, 200, {
    "Content-Type": "image/jpeg",
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  });
});

async function reaction(c: Context, liked: boolean) {
  const id = c.req.param("id") ?? "";
  if (!UUID.test(id)) return fail(c, 404, "This photo isn’t on the wall.");
  const [exists] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id));
  if (!exists) return fail(c, 404, "This photo isn’t on the wall.");
  const visitorId = visitor(c, true)!;
  if (liked) {
    await db.insert(postLikes).values({ postId: id, visitorId }).onConflictDoNothing();
  } else {
    await db.delete(postLikes).where(and(eq(postLikes.postId, id), eq(postLikes.visitorId, visitorId)));
  }
  const [row] = (await db.select(postFields(visitorId)).from(posts).where(eq(posts.id, id))) as Row[];
  return c.json({ likes: Number(row?.likes) || 0, liked: Boolean(row?.liked) });
}

app.put("/api/gallery/:id/like", (c) => reaction(c, true));
app.delete("/api/gallery/:id/like", (c) => reaction(c, false));

// Organizer-only removal: the passkey is checked on the server and never shipped to the browser.
app.delete("/api/gallery/:id", async (c) => {
  const id = c.req.param("id");
  const passkey = c.req.header("X-Gallery-Organizer-Code")?.trim() ?? "";
  if (!passkey || !passkeyMatches(passkey)) {
    return fail(c, 403, "That organizer passkey isn’t right. Only organizers can remove photos.");
  }
  if (!UUID.test(id)) return fail(c, 404, "This photo is already off the wall.");
  const removed = await db.delete(posts).where(eq(posts.id, id)).returning({ id: posts.id });
  await photos.delete(id).catch((error) => console.error("Failed to delete gallery photo blob", error));
  if (!removed.length) return fail(c, 404, "This photo is already off the wall.");
  return c.json({ deleted: true });
});

app.notFound((c) => c.json({ message: "Not found" }, 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ message: "Something went wrong. Please try again." }, 500);
});

export default app;
