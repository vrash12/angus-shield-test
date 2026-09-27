# Site VIP

**One login. One screen. One outcome: know whether the business is in the black.**

A deliberately small, mobile-first slice of the Site VIP / Angus Shield idea for Australian tradies: this month's **$ in**, **$ out** and **Profit** at a glance, and one thumb-sized **Job done** button to record a finished job.

- **Live app:** https://angus-shield-test.vercel.app
- **Submission answers:** [SUBMISSION.md](SUBMISSION.md)

## Try it

Tap **Create an account** to set up your own business (name, email, password), or tap **Use demo account** to look around without signing up.

| Demo login | |
| --- | --- |
| Email | `demo@example.com` |
| Password | `InTheBlack-2026` |

The demo is a small plumbing business whose month starts **slightly behind**, so adding one finished job usually tips it back **into the black**. Both states appear in a single tap.

## What's on the screen

1. **This month:** calendar month in the user's own time zone.
2. **Profit:** the hero number, with a plain-English status: **In the black** or **Behind this month** (text and icon, never colour alone).
3. **$ in / $ out:** the two numbers profit is made of.
4. **Latest:** the last three entries, so you can trust the totals.
5. **Job done:** a bottom sheet with Customer, Job and Price. The button reads **Add $1,450** as you type; totals update instantly (optimistically), save to Supabase in the background, and a toast confirms with **Undo**.

## Security

Round two of the test: real sign-up, hashed passwords, and business A can never see business B. Every claim below can be checked.

| Claim | How it's enforced | Check it yourself |
| --- | --- | --- |
| Passwords are never stored | Supabase Auth keeps only a bcrypt hash. Sign-in and sign-up go from the browser straight to Supabase, so the password never touches our server | `select left(encrypted_password, 7) from auth.users` returns `$2a$10# Site VIP

**One login. One screen. One outcome: know whether the business is in the black.**

A deliberately small, mobile-first slice of the Site VIP / Angus Shield idea for Australian tradies: this month's **$ in**, **$ out** and **Profit** at a glance, and one thumb-sized **Job done** button to record a finished job.

- **Live app:** https://angus-shield-test.vercel.app
- **Submission answers:** [SUBMISSION.md](SUBMISSION.md)

## Try it

Tap **Create an account** to set up your own business (name, email, password), or tap **Use demo account** to look around without signing up.

| Demo login | |
| --- | --- |
| Email | `demo@example.com` |
| Password | `InTheBlack-2026` |

The demo is a small plumbing business whose month starts **slightly behind**, so adding one finished job usually tips it back **into the black**. Both states appear in a single tap.

## What's on the screen

1. **This month:** calendar month in the user's own time zone.
2. **Profit:** the hero number, with a plain-English status: **In the black** or **Behind this month** (text and icon, never colour alone).
3. **$ in / $ out:** the two numbers profit is made of.
4. **Latest:** the last three entries, so you can trust the totals.
5. **Job done:** a bottom sheet with Customer, Job and Price. The button reads **Add $1,450** as you type; totals update instantly (optimistically), save to Supabase in the background, and a toast confirms with **Undo**.

 |
| Strong passwords only | The server requires 10+ characters with letters and digits. Sign-up also checks Have I Been Pwned (only 5 characters of the SHA-1 hash leave the device) | Try `Password123` at sign-up |
| Business A never sees business B | Postgres Row Level Security on every table. Businesses and memberships are created only by a sign-up trigger. Owner, business and timestamp are set by the database: the app isn't even granted those columns | `npm run security-check` |
| Records can't be tampered with | No update policy. Delete only for the person who recorded an entry, within 10 minutes (Undo). Amounts capped at $1,000,000 | `npm run security-check` |
| Brute force is slowed | Supabase Auth rate-limits sign-in and sign-up per IP. That works because the requests come from the user's device, not from our server | |
| The shared demo can't be hijacked | A trigger blocks any change to the demo account's password, email or phone. MFA enrolment is off until the app has an MFA screen, so nobody can lock the demo behind their own authenticator | `npm run security-check` |
| Scripts can't be injected | A strict Content Security Policy with a fresh nonce per request, plus HSTS, `X-Frame-Options: DENY`, `nosniff`, a tight `Permissions-Policy` and no `X-Powered-By` | `curl -sI https://angus-shield-test.vercel.app/login` |
| Secrets stay secret | Only the publishable key reaches the browser. The service-role key is used by local scripts only, never deployed. The database requires SSL. The cron route is closed without `CRON_SECRET` | |

`npm run security-check` creates two throwaway businesses, runs 26 attacks as business A straight against the database API (bypassing the app), then deletes both. Against the live database: **26 of 26 blocked.**

Deliberately left for launch, not for this test: mandatory MFA (the ATO requires it for DSPs), verified email via a custom-domain mail sender (Supabase's built-in sender only mails the project team, so email confirmation is off here), Supabase's server-side leaked-password protection (a paid-plan feature), Australian hosting (this demo database is in Singapore), and an external penetration test.

## What's deliberately not here

No CRM, scheduling, quotes, invoice editor, expense workflow, reports, charts, settings, navigation, notifications or admin. Each is part of the bigger product, but none of them helps a tradie answer *"am I in the black?"* or record a finished job faster, which is the test for this slice. Expenses (`$ out`) are stored and seeded, but there's no expense workflow: one primary action keeps the screen obvious.

## Decisions worth knowing

- **Numbers render on the server.** The dashboard arrives with this month's figures already in the HTML; no spinner after login.
- **"This month" means the user's month.** Boundaries are computed in the browser's time zone (remembered in a cookie so the server renders the right month) and sent to Postgres as exact UTC instants. That matters in Australia, where the UTC month starts 10–11 hours late.
- **Money is integer cents.** Big totals drop cents; the figures always add up on screen (profit = shown $ in − shown $ out), while the in-the-black status uses the exact amount.
- **Saving is forgiving.** A job appears instantly; if the network drops it rolls back with a one-tap **Retry**. Its ID is generated on the phone, so a retry can never record the same job twice, and a double tap can't either.
- **Undo instead of edit.** Entries can't be edited (no update policy in the database), but a mistake can be undone for 8 seconds after adding it. The database allows that delete for 10 minutes, then the record is permanent.
- **The demo month seeds itself.** A database function fills the demo account's current month the first time it's opened in any month, so the demo never goes stale. Real accounts never get sample data.
- **Native `<dialog>` for the sheet.** It gives focus trapping, Escape and an inert page for free, and the sheet sits above the iOS keyboard via the Visual Viewport API.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Auth + Postgres with Row Level Security) · Vercel · Lucide icons. No other runtime dependencies.

## Run it locally

Requires Node 20+.

```bash
npm install
cp .env.example .env.local
```

### 1. Create the database

**Hosted Supabase (recommended).** Create a project (the Sydney region keeps it close to Australian users), then run the files in [`supabase/migrations/`](supabase/migrations/), in order, in the **SQL Editor**. Or apply them with the CLI:

```bash
npx supabase db push --db-url "postgresql://postgres.<project-ref>:<db-password>@<pooler-host>:5432/postgres"
```

**Local Supabase (Docker).** `npx supabase start` starts a local stack and applies the migrations automatically. This repo uses ports `55321` (API) and `55322` (database) so it won't clash with other local Supabase projects. `npx supabase status` prints the local URL and keys.

### 2. Fill in `.env.local`

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Publishable (`sb_publishable_…`) or legacy anon key. Safe to expose: RLS protects the data |
| `SUPABASE_SERVICE_ROLE_KEY` | `npm run seed` and `npm run security-check` only | Secret (`sb_secret_…`) or legacy service_role key. **Never** add it to Vercel or the browser |
| `DEMO_EMAIL`, `DEMO_PASSWORD` | Server only | The account behind **Use demo account** |
| `CRON_SECRET` | Server only | Required by the daily keep-alive route, which refuses every call without it. Any long random string |

### 3. Match the Auth settings

[`supabase/config.toml`](supabase/config.toml) holds the settings the local stack uses. Push the ones that matter to a hosted project with `npx supabase config push --project-ref <ref>`, or set them in the dashboard: minimum password length 10 with letters and digits, email confirmation off (see Security), secure password change on, TOTP MFA off, SSL enforcement on, and Site URL set to your deployed URL.

### 4. Create the demo account and run

```bash
npm run seed   # creates (or resets) the demo account, already confirmed
npm run dev
```

Open http://localhost:3000. Run `npm run seed` again at any time to reset the demo to a fresh month.

## Database

Three tables, all behind Row Level Security. Anonymous visitors get nothing.

- **`businesses`** and **`business_members`:** each login belongs to one business (staff logins can join later without changing a policy). Both are read-only to the app and created only by the `create_business_for_new_user` trigger when someone signs up.
- **`transactions`:** `type` (`income` | `expense`), positive `amount numeric(12,2)` up to $1,000,000, `customer`, `job_name`, `description`. `business_id`, `user_id` (who recorded it) and `created_at` are always set by the database. A business reads and adds only its own rows, the person who recorded an entry can undo it within 10 minutes, and nothing is ever updated.
- **`ensure_demo_month(month_start, month_end)`:** fills the current month with sample activity, but only for the account flagged `app_metadata.demo = true` (set by the seed script; users can't set it themselves), and only when that month is empty. Its privileged half lives in a `private` schema the API doesn't expose.
- **`protect_demo_account`:** a trigger that stops anyone changing the shared demo login's password, email or phone.

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel (it detects Next.js; no build settings needed).
2. Add the environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DEMO_EMAIL`, `DEMO_PASSWORD` and `CRON_SECRET`. **Don't** add the service role key.
3. Deploy. [`vercel.json`](vercel.json) runs functions in Singapore (`sin1`), next to the demo database. Change it to match your Supabase region (for example `syd1` for Sydney).
4. [`vercel.json`](vercel.json) also schedules a daily call to `/api/keep-alive`. Free Supabase projects pause after a week without activity; this keeps the demo awake for reviewers and its month seeded.

Password sign-in needs no Supabase redirect-URL setup.

## Project map

```
src/
  app/(app)/page.tsx       Dashboard route: auth check, this month's data, server-rendered
  app/login/               Log in and sign up
  app/actions.ts           Demo log in, log out (server actions)
  components/auth-form.tsx Sign-up and log-in, straight from the browser to Supabase Auth
  app/api/keep-alive/      Daily cron: keeps the free database awake
  components/dashboard.tsx Optimistic add, Undo, Retry, refresh on return
  components/job-sheet.tsx The Job done sheet
  lib/csp.ts               Content Security Policy
  lib/money.ts             Cents, formatting, price parsing
  lib/password.ts          Password rules and the breached-password check
  lib/month.ts             Time-zone-aware month boundaries
  lib/transactions.ts      Data access
  proxy.ts                 Session refresh, login redirects, CSP nonce
supabase/migrations/       Schema, businesses, RLS, triggers and the demo-month function
scripts/seed-demo.mjs      Creates or resets the demo account
scripts/security-check.mjs 26 cross-business attacks against the live database API
```

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm run security-check
```
