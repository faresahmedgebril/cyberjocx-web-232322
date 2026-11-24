# CyberJocx course content, instructors, labs and roadmap setup

## 1. Encryption key

Lesson body text is encrypted in the API with AES-256-GCM before the ciphertext, nonce and authentication tag are written to PostgreSQL. The key is **not** stored in PostgreSQL or the repository.

Generate one stable key:
```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Set the exact output as the `COURSE_CONTENT_ENCRYPTION_KEY` secret on the production Cloudflare Worker (Cloudflare Dashboard > Workers & Pages > cyberjocx-api > Settings > Variables and Secrets, mark it as Secret), or use:
```bash
wrangler secret put COURSE_CONTENT_ENCRYPTION_KEY
```

For local development, put it in the local `.env` file only. Never paste the key into source control, a database row, a PR comment, or a chat. The Cloudflare Worker copies the secret into the API runtime environment.

**Key-loss warning:** existing encrypted lessons cannot be decrypted if this key is lost. Back it up in an approved secrets manager. Do not rotate it by overwriting the value: rotation needs a versioned re-encryption migration and must preserve the old key until all stored lessons are re-encrypted.

## 2. Database migration

This PR adds `drizzle-postgres/0002_instructor_malware_course_labs_roadmaps.sql`. Apply it to the Neon production branch only after a verified database backup:
```bash
pnpm db:migrate
```
Do not use `db:push` to bypass the committed migration. Verify that the new tables and columns exist before opening course publishing.

## 3. Private course assets

Course lesson files use object keys (not public URLs) in PostgreSQL. The API issues a 15-minute signed upload URL to an instructor for a lesson in their own unpublished course draft; students receive a 15-minute signed download URL only after both the course and lesson are published and the course catalog is open.

Configure the configured S3/R2 bucket as private. Do not attach a public R2 custom domain to the course-content bucket and do not set `STORAGE_PUBLIC_BASE_URL` for it. Configure bucket CORS to allow `PUT` from the CyberJocx frontend origin and allow the `Content-Type` header. The current app-level AES-256-GCM encryption covers lesson **text**; uploaded video/PDF/ZIP assets are access-controlled using private storage and short-lived signed URLs, not browser-proof DRM.

## 4. Instructor approval and course workflow

1. A signed-in user submits an instructor application from **انضم كمدرّس**.
2. The platform owner reviews it in Admin > Instructor approvals.
3. Approval changes the account role to `instructor`; it is not self-service role escalation.
4. Instructors can create unpublished course drafts, add encrypted text lessons, attach private PDF/MP4/WEBM/ZIP files, and propose Lab templates.
5. The owner approves course drafts and lab proposals. Only approved active Lab templates are visible to learners.
6. The owner links Roadmap modules to courses and active Lab templates from Admin > Roadmap graph.

No real container runtime is provisioned by this change. Approving a Lab template only makes the template selectable in CyberJocx; actual execution still depends on the existing isolated Lab Manager service and its `LAB_MANAGER_URL` / `LAB_MANAGER_TOKEN` configuration.

## 5. Access and rollout notes

- Learner lesson APIs require a signed-in session, a published course and published lesson, and `COURSES_COMING_SOON=false`.
- The app does not yet have enrollment or payment entitlements. Once a course is opened, any authenticated account can read its published lessons; add enrollment/purchase checks before introducing paid course access.
- Malware create/update/delete, instructor approval, Lab review and Roadmap linking are restricted to the configured platform owner.
- Run the encryption tests with `pnpm test` and verify typecheck/build before applying the migration or enabling the encryption key in production.
