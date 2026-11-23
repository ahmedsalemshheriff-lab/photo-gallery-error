CREATE TABLE "post_likes" (
	"post_id" uuid,
	"visitor_id" text,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_likes_pkey" PRIMARY KEY("post_id","visitor_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"guest_name" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"mode" text NOT NULL,
	"pose_id" text,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "posts_mode_created_idx" ON "posts" ("mode","created_at","id");--> statement-breakpoint
CREATE INDEX "posts_created_idx" ON "posts" ("created_at","id");--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;