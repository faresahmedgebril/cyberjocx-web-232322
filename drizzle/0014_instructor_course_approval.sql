ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'instructor';

ALTER TABLE "courses"
  ADD COLUMN IF NOT EXISTS "instructorUserId" integer;

CREATE TABLE IF NOT EXISTS "courseChangeRequests" (
  "id" serial PRIMARY KEY,
  "courseId" integer NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "instructorUserId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "changesJson" text NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'pending',
  "reviewedBy" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewNote" text,
  "requestedAt" timestamp NOT NULL DEFAULT now(),
  "reviewedAt" timestamp
);

CREATE INDEX IF NOT EXISTS "courseChangeRequests_status_requestedAt_idx"
  ON "courseChangeRequests" ("status", "requestedAt");

CREATE INDEX IF NOT EXISTS "courseChangeRequests_instructorUserId_idx"
  ON "courseChangeRequests" ("instructorUserId", "requestedAt");
