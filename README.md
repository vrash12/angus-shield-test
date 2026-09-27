# Site VIP

**One login. One screen. One outcome: know whether the business is in the black.**

A deliberately small, mobile-first slice of the Site VIP / Angus Shield idea for Australian tradies: this month's **$ in**, **$ out** and **Profit** at a glance, and one thumb-sized **Job done** button to record a finished job.

- **Live app:** _add Vercel URL once deployed_
- **Submission answers:** [SUBMISSION.md](SUBMISSION.md)

## Try it

On the login screen, tap **Use demo account**: no sign-up and no email to confirm.

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

## What's deliberately not here

No CRM, scheduling, quotes, invoice editor, expense workflow, reports, charts, settings, navigation, notifications or admin. Each is part of the bigger product, but none of them helps a tradie answer *"am I in the black?"* or record a finished job faster, which is the test for this slice. Expenses (`$ out`) are stored and seeded, but there's no expense workflow: one primary action keeps the screen obvious.

## Decisions worth knowing

- **Numbers render on the server.** The dashboard arrives with this month's figures already in the HTML; no spinner after login.
- **"This month" means the user's month.** Boundaries are computed in the browser's time zone (remembered in a cookie so the server renders the right month) and sent to Postgres as exact UTC instants. That matters in Australia, where the UTC month starts 10–11 hours late.
- **Money is integer cents.** Big totals drop cents; the figures always add up on screen (profit = shown $ in − shown $ out), while the in-the-black status uses the exact amount.
- **Saving is forgiving.** A job appears instantly; if the network drops it rolls back with a one-tap **Retry**. Its ID is generated on the phone, so a retry can never record the same job twice, and a double tap can't either.
- **Undo instead of edit.** Entries can't be edited (no update policy in the database), but a mistake can be undone for 8 seconds after adding it.
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

**Hosted Supabase (recommended).** Create a project (the Sydney region keeps it close to Australian users), then run [`supabase/migrations/20260927000000_transactions.sql`](supabase/migrations/20260927000000_transactions.sql) in the **SQL Editor**. Or apply it with the CLI:

```bash
npx supabase db push --db-url "postgresql://postgres.<project-ref>:<db-password>@<pooler-host>:5432/postgres"
```

**Local Supabase (Docker).** `npx supabase start` starts a local stack and applies the migration automatically. This repo uses ports `55321` (API) and `55322` (database) so it won't clash with other local Supabase projects. `npx supabase status` prints the local URL and keys.

### 2. Fill in `.env.local`

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Publishable (`sb_publishable_…`) or legacy anon key. Safe to expose: RLS protects the data |
| `SUPABASE_SERVICE_ROLE_KEY` | `npm run seed` only | Secret (`sb_secret_…`) or legacy service_role key. **Never** add it to Vercel or the browser |
| `DEMO_EMAIL`, `DEMO_PASSWORD` | Server only | The account behind **Use demo account** |
| `CRON_SECRET` | Server only, optional | Protects the daily keep-alive route |

### 3. Create the demo account and run

```bash
npm run seed   # creates (or resets) the demo account, already confirmed
npm run dev
```

Open http://localhost:3000. Run `npm run seed` again at any time to reset the demo to a fresh month.

## Database

One table, `transactions`: `type` (`income` | `expense`), positive `amount numeric(12,2)`, `customer`, `job_name`, `description`, `created_at`, and `user_id` defaulting to `auth.uid()`.

- **Row Level Security:** authenticated users can read, add and delete only their own rows (delete exists for Undo). There is no update policy, and anonymous visitors get nothing.
- **Constraints:** a positive amount, no blank names, and every income row names its customer and job.
- **`ensure_demo_month(month_start, month_end)`:** fills the current month with sample activity, but only for the account flagged `app_metadata.demo = true` (set by the seed script; users can't set it themselves), and only when that month is empty.

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel (it detects Next.js; no build settings needed).
2. Add the environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DEMO_EMAIL`, `DEMO_PASSWORD` and, optionally, `CRON_SECRET`. **Don't** add the service role key.
3. Deploy. [`vercel.json`](vercel.json) runs functions in Singapore (`sin1`), next to the demo database. Change it to match your Supabase region (for example `syd1` for Sydney).
4. [`vercel.json`](vercel.json) also schedules a daily call to `/api/keep-alive`. Free Supabase projects pause after a week without activity; this keeps the demo awake for reviewers and its month seeded.

Password sign-in needs no Supabase redirect-URL setup.

## Project map

```
src/
  app/(app)/page.tsx       Dashboard route: auth check, this month's data, server-rendered
  app/login/               Login screen
  app/actions.ts           Log in, demo log in, log out (server actions)
  app/api/keep-alive/      Daily cron: keeps the free database awake
  components/dashboard.tsx Optimistic add, Undo, Retry, refresh on return
  components/job-sheet.tsx The Job done sheet
  lib/money.ts             Cents, formatting, price parsing
  lib/month.ts             Time-zone-aware month boundaries
  lib/transactions.ts      Data access
  proxy.ts                 Session refresh and login redirects
supabase/migrations/       Schema, RLS and the demo-month function
scripts/seed-demo.mjs      Creates or resets the demo account
```

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```
