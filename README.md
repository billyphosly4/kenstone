# Kestone Mediation Centre & Consultancy

This workspace contains a Vite/React TypeScript enquiry wizard and a separate TypeScript/Express API.

## Deploy the frontend and API together on Vercel

The repository is configured as one Vercel project: Vite produces the static site in `dist`, and explicit files under `api/` expose the public API routes as Vercel Functions. The SPA rewrite serves `index.html` for client-side navigation. Vercel's runtime keeps notification work alive after the response with `waitUntil`; it is still best-effort, not a durable queue.

1. Import the repository into Vercel as a Vite project. Keep the Root Directory at the repository root.
2. Set the build command to `npm run prisma:generate && npm run build` and output directory to `dist` (these values are also in `vercel.json`).
3. Configure `DATABASE_URL` (Supabase transaction pooler), `DIRECT_URL` (migration connection), and SMTP variables from `.env.example` in Vercel Project Settings for Production and Preview as appropriate. Never prefix secrets with `VITE_`.
4. Configure `CORS_ORIGINS` if a separate frontend origin must call the API. For a same-origin frontend/API deployment, leave `VITE_API_BASE_URL` empty so browser requests use `/api`.
5. Apply reviewed Prisma migrations separately with `npm run prisma:migrate` from a trusted environment. Do not run migrations as part of a Vercel Function invocation.
6. Deploy a Preview, verify `/api/health`, course reads, and form submissions using test data, then promote to Production.

Vercel request instances are ephemeral: the Express in-memory rate limiter is not a shared production abuse-control system. Add Vercel Firewall rate limits or a shared external rate-limit store before relying on it in production. Review the required Vercel environment variables and SMTP connectivity before enabling public submissions. `vercel dev` can be used to test the Vercel routing locally after linking the project.

## API setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to the Supabase transaction-pooler URL and `DIRECT_URL` to the direct PostgreSQL connection. Use Supabase's connection details and database password; do not commit `.env`.
2. Install dependencies with `npm install`.
3. Generate the Prisma client with `npm run prisma:generate`.
4. Apply migrations with `npm run prisma:migrate` after creating and reviewing migrations. To create a migration during local development, use `npx prisma migrate dev --name init`.
5. Start the API with `npm run dev:server`; compile it with `npm run build:server` and run the compiled server with `npm run start:server`.
6. Configure the SMTP environment variables in `.env` to enable asynchronous submission notifications. Use credentials issued by your SMTP provider; do not commit them.

The Prisma datasource uses `DATABASE_URL` for pooled application queries and `DIRECT_URL` for migration operations. Configure `CORS_ORIGINS` as a comma-separated allowlist of trusted frontend origins. When deploying behind a reverse proxy, set `TRUST_PROXY_HOPS` to the exact trusted hop count.

## Submission endpoints

- `POST /api/enquiries`
- `POST /api/academy/register`
- `POST /api/academy-registrations`
- `POST /api/consultancy-enquiries`
- `GET /health`

Submission endpoints accept JSON only and are limited to five requests per IP address per 15 minutes. Inputs are sanitized and validated using strict Zod schemas. At least one of `email` or `phone` is required. The API returns a non-confidentiality warning in submission and validation responses.

**IMPORTANT: NEVER submit, accept, or upload sensitive or confidential evidence, legal documents, or private case details through these endpoints.**

The in-memory rate limiter is suitable for a single server instance. Use a shared rate-limit store when deploying multiple instances.

## Submission email notifications

After a submission is stored successfully, the API dispatches an internal alert to `ADMIN_NOTIFICATION_EMAIL` (defaults to `info@kestonemediation.com`) and an acknowledgement to the client when an email address is available. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `EMAIL_FROM` in `.env`. SMTP credentials are optional only for providers that permit unauthenticated relay; otherwise configure both username and password.

Email delivery is intentionally non-blocking: SMTP failures are logged as structured events containing the submission type, generated reference, notification kind, and error class only. They do not expose provider error text or affect the successful database response. Notification email bodies include contact and submission metadata only; free-text descriptions, registration notes, and consultancy request details are deliberately excluded. Delivery runs in process memory, so a process exit during delivery can lose a notification; use a durable job queue/outbox for stronger delivery guarantees.

## Enquiry wizard

Start the API with `npm run dev:server` and the frontend with `npm run dev`. The Vite development server proxies `/api` requests to `http://localhost:3000`; set `VITE_API_BASE_URL` when the deployed API is hosted on another origin. The wizard uses Formik, Yup, and Axios. Its safety screening blocks submission when a risk flag is selected.

The Request Mediation form sends the selected dispute category, preferred contact method, other-party status, and physical/virtual consultation preference to the API. Apply the `request_mediation_fields` Prisma migration before deploying the updated API and form.

## Land, Property & Real Estate practice page

The flagship practice page is accessible from the home-page Practice Areas navigation and the Land & Property card. Its six topic panels use native accessible disclosures. The downloadable `/property-mediation-guide.pdf` is general information only and includes an independent-legal-advice disclaimer.

## Academy programmes

The Academy explorer fetches published course records from `GET /api/academy/courses` and posts registrations to `POST /api/academy/register`. Both endpoints have explicit Vercel Function entry points under `api/academy/`. Apply the checked-in Prisma migration using `npm run prisma:migrate` after reviewing it. To publish the five Academy learning areas requested for the site, run `npm run seed:academy` after confirming the `DATABASE_URL` points to the intended database. This idempotent command creates or updates the course descriptions and learning outcomes; it does not set dates, duration, delivery mode, or accreditation claims. Registrations retain the existing fields while linking to the selected course and storing notes.
# kenstone
