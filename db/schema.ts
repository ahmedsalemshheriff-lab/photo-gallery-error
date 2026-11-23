import { index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

// One row per photo on the Gallery Wall. The image itself lives in Netlify Blobs under `id`.
export const posts = pgTable(
  "posts",
  {
    id: uuid().primaryKey().defaultRandom(),
    guestName: text("guest_name").notNull(),
    caption: text().notNull().default(""),
    mode: text().notNull(),
    poseId: text("pose_id"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  (table) => [index("posts_mode_created_idx").on(table.mode, table.createdAt, table.id), index("posts_created_idx").on(table.createdAt, table.id)],
);

// One row per visitor per liked photo, so each browser can like a photo once.
export const postLikes = pgTable(
  "post_likes",
  {
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.visitorId] })],
);
