# AGENTS.md — Site VIP / Angus Shield Developer Test

## Mission

Build the smallest polished product that proves the Site VIP / Angus Shield idea:

> One login. One screen. One outcome: know whether the business is in the black.

The product philosophy is **“Out-simple them.”**

Every implementation decision should reduce taps, reduce cognitive load, reduce setup, and make the app feel obvious to a busy Australian tradie using a phone.

This is a hiring test. Optimize for:
1. Simplicity
2. Mobile polish
3. Correct working behavior
4. Fast deployment
5. Clear product judgment
6. A practical accreditation plan

Do **not** build a large SaaS platform. Build the smallest credible slice that feels like a real product.

---

## Required Deliverables

The repository must end with all of the following ready:

- Live Next.js app deployed on Vercel
- Supabase-backed authentication and data
- GitHub-ready source code
- `README.md` with setup, environment variables, demo login, and deployment notes
- `SUBMISSION.md` containing:
  - live URL placeholder/URL
  - GitHub URL placeholder/URL
  - Part 2 answer, maximum 10 lines
  - Part 3 answer, maximum 10 lines
  - monthly rate in AUD placeholder
- Clean production build with no TypeScript, lint, or build errors

Do not fabricate the final Vercel or GitHub URLs. Use placeholders until they exist.

---

# Product Scope

## Authentication

Implement one simple login flow with Supabase Auth.

Preferred:
- Email + password
- Minimal, premium login screen
- A clearly available demo account path for the reviewer

The reviewer should not need email verification or a magic-link round trip just to test the app.

Never commit real secrets or production credentials.

After login, the user goes directly to the dashboard.

There should be no onboarding wizard.

---

# Main App

After login there is **ONE primary screen**.

The screen must immediately communicate:

- `This month`
- `$ in`
- `$ out`
- `Profit`

The financial numbers are the hero of the interface.

### Profit state

If:

`money_in - money_out >= 0`

show the result as clearly positive / “in the black”.

If:

`money_in - money_out < 0`

show the result as clearly negative.

Do not rely on color alone. Include a short text status such as:

- `In the black`
- `Behind this month`

Keep the wording short and human.

---

# "Job done" Flow

The main action is:

**Job done**

It must be obvious and easy to hit with one thumb.

Tapping it should open a mobile-friendly sheet/modal on the same screen.

Required fields:

- Customer
- Job
- Price

Keep the form intentionally minimal.

Recommended behavior:

- Customer: text
- Job: text
- Price: numeric currency input
- Primary action: `Add $X`
- Submit with one tap
- Optimistically update `$ in` and `Profit`
- Persist to Supabase
- Close the sheet
- Show lightweight success feedback

Do not add:
- quote builders
- invoice editors
- tax configuration
- contact management
- job scheduling
- project boards
- reporting pages
- navigation menus
- settings screens

Those features belong to the larger product, not this test.

---

# Money Out

The brief requires `$ out`, but the only required interaction is `Job done`.

For this test:

- Store expenses/outgoing transactions in Supabase.
- Seed a small amount of realistic demo expense data for the current month.
- Display the total on the dashboard.
- Do **not** add a full expense-management workflow unless it can be added without harming the one-screen simplicity.

The reviewer must be able to add a completed job and immediately see:
- `$ in` increase
- `Profit` increase
- profit status update when applicable

---

# Recommended Data Model

Keep the schema minimal.

## `transactions`

Suggested fields:

- `id` — UUID primary key
- `user_id` — UUID, references authenticated user
- `type` — `income` or `expense`
- `amount` — numeric/decimal, positive value
- `customer` — nullable text
- `job_name` — nullable text
- `description` — nullable text
- `created_at` — timestamptz, default now()

Use Row Level Security.

Policy goal:
- authenticated users can only read/write their own transactions

Avoid unnecessary tables unless clearly justified.

---

# Monthly Totals

Calculate totals for the current calendar month:

- Money in = sum of `income`
- Money out = sum of `expense`
- Profit = money in - money out

Use the user's/browser's current month boundaries and convert them safely for the database query.

Currency:
- AUD
- Format with Australian currency conventions where practical

Example display:

`$18,450`

Do not show unnecessary cents for large dashboard totals unless cents are meaningful.

---

# UX Direction

The reviewer will test this on a phone.

Design mobile-first.

The app should feel:
- premium
- calm
- fast
- obvious
- confident
- uncluttered

Use:
- strong hierarchy
- generous spacing
- large financial figures
- clear primary action
- rounded surfaces where appropriate
- subtle motion
- high-quality empty/loading/success states
- readable typography
- large touch targets
- accessible contrast

Avoid:
- dashboard clutter
- tiny text
- dense tables
- sidebars
- hamburger menus
- excessive gradients
- glassmorphism everywhere
- decorative charts with no decision value
- multiple competing CTAs
- excessive copy

Simple does not mean generic.

---

# Suggested Screen Structure

After login, the dashboard can roughly contain:

1. Small brand/header
2. `This month`
3. Large Profit figure and status
4. Two supporting figures: `$ in` and `$ out`
5. One dominant `Job done` button
6. Optional tiny recent activity row/list only if it improves trust without adding clutter

Do not add bottom navigation.

Do not create extra pages for the core workflow.

A sheet/modal for `Job done` is acceptable because the user remains in the same dashboard context.

---

# Brand / Visual Tone

This is a financial/operations product for Australian trades businesses.

Aim for:
- trustworthy
- practical
- premium
- modern
- not corporate-boring
- not playful like a consumer social app

Use a restrained palette.

Positive/negative financial states should be unmistakable.

Do not over-brand the test. Product clarity is more important than elaborate identity work.

---

# Tech Stack

Required:

- Next.js
- TypeScript
- Supabase
- Vercel

Preferred implementation:

- Next.js App Router
- Tailwind CSS
- Supabase JS client
- Supabase Auth
- Lucide icons if icons are needed

Avoid adding large dependencies unless they create clear value.

---

# Environment Variables

Use standard environment variables such as:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

If server-only Supabase credentials are required, keep them server-only and never expose privileged keys to the browser.

Never commit `.env.local`.

Provide `.env.example`.

---

# Supabase Requirements

Configure:

- Auth
- transactions table
- RLS enabled
- policies scoped to `auth.uid()`
- demo seed instructions

Include SQL migration/setup files in the repository where practical.

Suggested location:

`supabase/migrations/`

or

`supabase/schema.sql`

The repo should be reproducible by another developer.

---

# Loading and Error Behavior

Do not leave the user staring at raw errors.

Required:
- short loading state
- disabled submit while saving
- friendly retry/error message
- no duplicate submissions from double tapping
- correct currency validation
- reject zero/negative job price
- trim text fields

Keep error copy concise.

---

# Performance

The app should feel instant on a mobile connection.

Prefer:
- minimal client JavaScript
- no unnecessary animation libraries
- no heavy charts
- no large hero imagery
- no blocking third-party scripts

The dashboard should be usable quickly after authentication.

---

# Accessibility

At minimum:

- semantic form labels
- keyboard usable
- visible focus states
- sufficient contrast
- 44px+ primary touch targets where practical
- do not communicate profit/loss using color alone
- reduced-motion friendly animation

---

# Part 2 — "Out-simple it"

Create the final answer in `SUBMISSION.md`.

Maximum: **10 lines**.

The answer should explain how:

Quote → Job → Invoice → Paid → Safety sign-off

can feel like one continuous action instead of five separate systems.

Product principle:

**The user should confirm outcomes, not manage software objects.**

Strong direction:
- one job record
- status advances automatically
- defaults from customer/job context
- quote becomes job without re-entry
- completion generates invoice
- payment/bank event marks paid
- safety checklist appears only when required
- exceptions get attention; normal work stays invisible

Also answer what should be deleted.

Delete:
- duplicate data entry
- unnecessary statuses
- separate modules for the same job
- repeated customer selection
- manual handoffs
- configuration that can be safely inferred/defaulted

Do not turn Part 2 into a feature list.

It should read like a product decision.

---

# Part 3 — ATO / DSP Accreditation Plan

Create the final answer in `SUBMISSION.md`.

Maximum: **10 lines**.

This section must sound actionable and ordered.

The goal is not to complain about complexity. The goal is:

**“Here is the sequence we execute.”**

Before finalizing this section, verify current requirements against official Australian Taxation Office / Digital Service Provider documentation if internet access is available.

Prefer official ATO sources over blogs.

The plan should cover the path from product architecture to production accreditation, including the relevant items such as:

- define exact regulated services in scope
- register/engage as a Digital Service Provider where required
- map the current ATO DSP Operational Framework/security obligations
- establish secure identity, tenancy, audit logging, access controls, encryption, incident response, backups and change management
- build the accounting ledger/tax data model correctly before integrations
- implement BAS/GST calculation and reporting foundations
- implement payroll/STP in the required ATO-compatible format/process
- implement super obligations/integration path where applicable
- implement bank feeds through an appropriate supported provider/integration
- complete required conformance/testing/whitelisting/production-access steps for each ATO service
- maintain evidence, monitoring, security reviews and ongoing compliance after launch

Do not claim an accreditation, certification, or approval has been obtained unless it actually has.

Do not invent ATO program names or current requirements.

If a current regulatory detail is uncertain, verify it before writing the submission.

---

# What We Intentionally Leave Out

The evaluator explicitly cares about what was left out.

The app should intentionally omit:

- CRM pipeline
- full job management
- calendar
- staff/HR
- payroll UI
- BAS UI
- bank feeds UI
- safety module
- reports
- settings
- integrations marketplace
- notifications center
- admin console
- advanced permissions
- charts unless they materially improve the one-screen decision

Reason:

The test is proving the core promise, not rebuilding the whole company in 72 hours.

---

# Acceptance Criteria

The task is complete when all of the following are true:

## Login
- Reviewer can log in easily on mobile.
- Login leads directly to the dashboard.

## Dashboard
- One primary screen after login.
- Clearly shows this month's `$ in`, `$ out`, and `Profit`.
- Profit state is understandable in under 3 seconds.
- Positive and negative states both have clear visual/text treatment.

## Job Done
- Button is obvious.
- Customer, job, and price can be entered quickly.
- Valid submission persists to Supabase.
- Money in updates immediately.
- Profit updates immediately.
- No full page reload is required.

## Mobile
- Works cleanly around 360–430px widths.
- No horizontal scrolling.
- No cramped tap targets.
- Modal/sheet works with the mobile keyboard.

## Data
- Current month is queried correctly.
- RLS protects user data.
- Demo data is reproducible.

## Quality
- `npm run build` passes.
- No obvious console errors.
- No secrets committed.
- No dead buttons.
- No placeholder lorem ipsum.
- No unnecessary screens.

## Submission
- README is complete.
- SUBMISSION.md contains Part 2 and Part 3 within their 10-line limits.
- Monthly AUD rate placeholder is present.
- Live/GitHub links are ready to fill in or already filled once deployed.

---

# Recommended Implementation Order

Work in this order unless the existing repo dictates otherwise:

1. Inspect repository and existing setup.
2. Establish clean Next.js + TypeScript structure.
3. Add Supabase client/auth.
4. Create minimal database schema + RLS.
5. Build login.
6. Build mobile-first single-screen dashboard with seeded data.
7. Implement current-month financial query.
8. Implement `Job done` flow.
9. Add optimistic update/error handling.
10. Polish mobile UI and financial states.
11. Test positive and negative profit states.
12. Run lint/typecheck/build.
13. Deploy to Vercel.
14. Write README.
15. Write `SUBMISSION.md`.
16. Final mobile QA.

---

# Agent Working Rules

When working in this repository:

- Make reasonable product decisions without waiting for permission.
- Prefer the simpler implementation when two options are equally correct.
- Do not over-engineer.
- Do not build speculative features.
- Do not rewrite unrelated code.
- Keep the main workflow obvious.
- Maintain TypeScript correctness.
- Never hardcode secrets.
- Keep the repository deployable throughout the task.
- Verify after meaningful changes.
- Test the actual user flow, not only individual components.
- Treat mobile usability as a primary requirement, not a final polish step.

When deciding whether to add something, ask:

> Does this help a tradie understand the month or record a finished job faster?

If no, leave it out.

---

# Definition of "Shine"

"Shine" does not mean more features.

It means:
- excellent spacing
- crisp typography
- instant feedback
- smooth but restrained interaction
- intentional states
- professional mobile behavior
- strong visual hierarchy
- confidence that the product is finished

A three-component screen can beat a thirty-component dashboard if every detail is right.

---

# Final Reminder

The evaluator's priorities are:

1. Simple
2. Polished
3. Can-do
4. Good judgment about what to delete

Build the product as if the slogan is a technical requirement:

> **Out-simple them.**
