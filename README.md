# Suhana Education

A full-stack **J&K State Board (JKBOSE), Class 8–10** learning platform — Next.js (App Router, TypeScript) + Supabase (Postgres + Auth) with an optional Razorpay payment module.

It runs in two modes:

- **Demo mode** (no setup): browse courses, take mock tests with real scoring, and try the dashboards using local sample data. Auth and payments are simulated.
- **Live mode** (Supabase configured): real Google / phone-OTP / email auth, a Postgres database with row-level security, and real Razorpay checkout with server-side verification.

---

## Quick start (demo mode)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Everything is browsable; sign-in uses a simulated OTP of **123456**.

---

## Full setup (live mode)

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Create a Supabase project

1. Create a project at https://supabase.com.
2. In **SQL Editor**, run `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_plans.sql`, then `supabase/seed.sql`.
   (Or use the Supabase CLI: `supabase db push` with these files.)
3. In **Project Settings → API**, copy the Project URL, the `anon` public key, and the `service_role` key.

Fill `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Enable auth providers (in Supabase, not in code)

- **Google:** Auth → Providers → Google. Add your Google OAuth client id/secret
  (from Google Cloud Console). Set the authorised redirect URL to
  `https://<your-supabase-ref>.supabase.co/auth/v1/callback`.
- **Phone OTP:** Auth → Providers → Phone. Connect an SMS provider
  (Twilio, MSG91, Vonage, …) and enter its credentials.
- **Email:** enabled by default.
- Add `http://localhost:3000/auth/callback` (and your production URL) under
  Auth → URL Configuration → Redirect URLs.

### 4. Make yourself a teacher/admin

Sign up once, then in Supabase SQL editor:

```sql
update profiles set role = 'admin' where id = '<your-user-id>';
```

Only `teacher`/`admin` accounts can write courses/tests/questions (enforced by RLS)
and reach the Teacher/Admin consoles.

### 5. Run

```bash
npm run dev          # http://localhost:3000
npm run typecheck    # optional: tsc --noEmit
npm run build        # production build
```

---

## Razorpay (optional)

Payments stay in demo mode (no real charge) until these are set in `.env.local`:

```
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx            # server-only, never exposed to the browser
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_WEBHOOK_SECRET=xxx
```

Flow (all server-side money logic):

1. `POST /api/payments/create-order` — reads the price from the DB (never the client),
   creates a Razorpay order, records a pending `orders` row.
2. Checkout opens in the browser with that `order_id`.
3. `POST /api/payments/verify` — verifies the Checkout signature, marks the order paid
   and grants the enrollment.
4. `POST /api/payments/webhook` — the authoritative confirmation. In the Razorpay
   dashboard add a webhook pointing to `https://<your-domain>/api/payments/webhook`
   for the `payment.captured` event, using `RAZORPAY_WEBHOOK_SECRET`.

Access is only granted after a verified payment. The secret key never reaches the browser.

---

## Project structure

```
supabase/
  migrations/0001_init.sql   schema + RLS + triggers
  seed.sql                   demo courses, lectures, tests
src/
  app/                       routes (home, courses, tests, dashboard, teacher, admin, api/…)
  components/                UI (Navbar, CourseDetail, ExamRunner, Dashboard, AdminConsole, …)
  lib/                       supabase clients, data access, scoring, razorpay, seed, types
middleware.ts                session refresh + protected-route redirects
```

## What's real vs. what needs your accounts

| Feature | Status |
|---|---|
| Plans & pricing (Base / Rise / Elite, Class 8–10) + purchase | ✅ works (Razorpay in live mode, demo otherwise) |
| About / launch & free-eligibility page | ✅ works |
| Course catalog, filters, lectures, live schedule | ✅ works (DB or demo seed) |
| Mock-test engine, timer, palette, review, autosave/resume | ✅ works |
| Server-side scoring (answers never sent to client) | ✅ works |
| Student dashboard, progress, notifications | ✅ works |
| Teacher/Admin CRUD (courses, tests, questions) | ✅ works (DB in live mode; local in demo) |
| Google / phone-OTP / email auth | ✅ needs Supabase + provider setup |
| Database with RLS | ✅ needs Supabase |
| Razorpay payments | ✅ needs Razorpay keys + webhook |
| Live class video room ("Join") | ⛳ needs a video SDK (100ms / Agora / Zoom) — not included |
| Lecture video hosting/streaming | ⛳ add your CDN/storage `video_url` per lecture |

## Notes

- This is a production-shaped starting point, not a finished product. Review RLS
  policies, add rate limiting, error monitoring and backups before going live.
- Teacher names are editable placeholders (Admin → Courses).
- No fabricated statistics, reviews or endorsements are shipped.
