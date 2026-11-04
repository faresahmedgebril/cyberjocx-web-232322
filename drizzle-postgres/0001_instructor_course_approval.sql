ALTER TYPE "public"."users_role_enum" ADD VALUE 'instructor';--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "instructorUserId" integer;--> statement-breakpoint
CREATE TABLE "courseChangeRequests" (
  "id" serial PRIMARY KEY NOT NULL,
  "courseId" integer NOT NULL,
  "instructorUserId" integer NOT NULL,
  "changesJson" text NOT NULL,
  "status" varchar(24) DEFAULT 'pending' NOT NULL,
  "reviewedBy" integer,
  "reviewNote" text,
  "requestedAt" timestamp DEFAULT now() NOT NULL,
  "reviewedAt" timestamp
);--> statement-breakpoint
ALTER TABLE "courseChangeRequests" ADD CONSTRAINT "courseChangeRequests_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courseChangeRequests" ADD CONSTRAINT "courseChangeRequests_instructorUserId_users_id_fk" FOREIGN KEY ("instructorUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courseChangeRequests" ADD CONSTRAINT "courseChangeRequests_reviewedBy_users_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "courseChangeRequests_status_requestedAt_idx" ON "courseChangeRequests" USING btree ("status","requestedAt");--> statement-breakpoint
CREATE INDEX "courseChangeRequests_instructorUserId_idx" ON "courseChangeRequests" USING btree ("instructorUserId","requestedAt");