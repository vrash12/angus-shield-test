# Site VIP · Developer test submission

- **Live app:** https://angus-shield-test.vercel.app
- **Source:** https://github.com/vrash12/angus-shield-test
- **Demo:** tap **Use demo account** on the login screen (credentials are in the README)
- **Monthly rate (AUD):** $800 per month

---

# Round two · Keeping it safe

## Part 1 · The hardened app

- **Real sign-up and login.** Tap **Create an account**: business name, email, password. Every sign-up gets its own, empty business.
- **Passwords are never stored.** Supabase Auth keeps only a bcrypt hash (`$2a$10$…`). The password goes from the phone straight to Supabase over TLS and never passes through our server. The server requires 10+ characters with letters and a number, sign-up also rejects passwords found in known breaches, and repeated attempts are rate-limited.
- **Business A can never see business B.** Separation is enforced by Postgres Row Level Security on every table, not by the app. The database, not the phone, sets who owns each record, so it can't be forged. Records can't be edited, only undone in the first 10 minutes, and nobody can add themselves to another business.
- **Try to break it.** `npm run security-check` creates two businesses and runs 26 attacks straight at the database API as business A: reading, writing, deleting and renaming B's data, forging ownership, editing the login token, back-dating, weak passwords, taking over the demo. All 26 are blocked on the live database.
- **Also:** a strict Content Security Policy with a per-request nonce, HSTS, no framing, SSL enforced on the database, the shared demo login locked against takeover, and the only secret key kept off Vercel entirely.

## Part 2 · The three biggest ways bank or tax data leaks, and how we stop each

1. **One business reading another's data**, the classic SaaS breach, caused by one missed filter in the code.
2. We stop it in the database, not the code: Row Level Security on every table, deny by default, ownership set by the server, and the cross-business attack suite runs before every release.
3. **Stolen logins**: phished or reused passwords, credential stuffing, a stolen session on a lost phone.
4. We stop them with hashed passwords, breached-password checks, rate limits, short-lived sessions, mandatory MFA before any bank or tax data goes live, and alerts on new devices.
5. We also re-check identity before anything that moves money or changes bank details.
6. **Leaked keys and over-broad access**: a service key in code, a staff account that can read every customer, bank-feed tokens sitting in plain text, personal data in logs or backups.
7. We stop that with secrets only in a vault (never in the repo or browser), least privilege, and separate encryption for bank and tax tokens.
8. Every staff read of customer data is logged, logs carry no personal data, and backups are encrypted.
9. The standard is the ATO's DSP Operational Security Framework: MFA, encryption, audit logging and Australian hosting.
10. We verify it with automated tests on every deploy and an external penetration test before launch, then yearly.

## Part 3 · A customer says they've been breached: the first hour

1. **Minute 0–5:** reply personally, treat it as real, and open an incident log. Every action is timestamped from here on.
2. **Contain their business:** sign out every session, force a password reset, revoke bank-feed and integration tokens, and freeze bank-detail changes and payments.
3. **Find the source:** was it their account, or us? Check auth logs (sign-ins, IPs, devices), the data-access audit log, staff access and recent deploys.
4. **If there's any sign it's us:** rotate keys and signing keys, suspend staff access we don't need, and patch or roll back the cause.
5. **Protect everyone else:** search every other business for the same IPs, devices and patterns, and block them.
6. **Preserve evidence:** snapshot logs and database state. Nothing gets wiped or "cleaned up".
7. **Tell the customer what we've done and what's next**, and warn them about follow-up scam calls pretending to be the bank or the ATO.
8. **Start the notifications:** the ATO within one business day if tax data is involved (a DSP obligation), a Notifiable Data Breaches assessment for the OAIC, and our banking-data provider if bank data is involved.
9. **Name one incident lead** (me until we have a team) and send updates to you and the customer on a fixed schedule.
10. Afterwards: a written post-incident review and a fix that stops the same thing happening to anyone else.

## Part 4 · Protecting you from your own developer

1. **You own everything:** the domain, DNS, email, GitHub organisation, Vercel, Supabase, app stores and billing, all under your name with a hardware security key. Developers are invited members, never owners.
2. **This repository moves to your GitHub organisation on day one.** I'll transfer it.
3. **No shared logins, least privilege:** developers work in staging with fake data. Production data access is time-limited, approved by you and logged.
4. **No change goes live unreviewed:** a protected main branch, every change by pull request with a second reviewer and the security checks passing, and deploys only from main.
5. **That review is also how we stop back doors:** no hidden admin routes, plus dependency and secret scanning on every change.
6. **Keys live in the platforms' secret stores,** never in code, chat or laptops. You hold the master credentials in a password manager only you control.
7. **An audit trail developers can't delete:** admin actions, role changes, new keys and data exports alert you.
8. **Backups you control:** point-in-time recovery, plus a regular encrypted copy in a separate account only you can reach, so even a deleted project comes back.
9. **Offboarding in an afternoon:** remove access everywhere and rotate every key the same day. It's a checklist, not a scramble.
10. **On paper:** IP assignment and confidentiality in the contract, and an external security review before launch, then yearly.

---

# Round one

## Part 2 · Out-simple it

1. Decision: Quote → Job → Invoice → Paid → Safety sign-off is **one job record moving forward**, not five systems. It's born once, as a quote.
2. The tradie confirms outcomes, the software moves the paperwork. Only two taps matter: **Quote accepted** and **Job done** (the button in this app).
3. Accepting a quote *is* creating the job: customer, site, scope and price carry straight over. Nothing is typed twice.
4. **Job done** raises the invoice from the quote plus any variations and sends it; there's no invoice to build.
5. **Paid** isn't a task: the bank feed matches the deposit and closes the job. Only unmatched or overdue money asks for attention.
6. **Safety sign-off** appears only when the work requires it (gas, electrical, heights), as a short checklist inside Job done, never a module to remember.
7. Everything else defaults from context: the customer, their last job, the trade, the usual terms.
8. The home screen shows exceptions, not lists: quotes waiting, work not invoiced, money overdue. Normal work stays invisible.
9. **Delete:** re-typing, separate quote/job/invoice screens, status pickers, picking the customer at every step, "mark as paid", office-to-field handoffs, and any setting we can safely infer.
10. The rule: if a step doesn't change money or safety, the software does it without asking.

## Part 3 · ATO / DSP accreditation plan

1. **Scope:** lodging activity statements (BAS/GST), STP Phase 2 pay events and SuperStream super makes us DSP-hosted SaaS under the ATO's DSP Operational Security Framework (OSF): Category B at launch (medium-risk APIs), Category A past 10,000 client records.
2. **Register:** myID + RAM authorisation → Online services for DSPs → work with the Digital Partnership Office (DPO); get an EVT Product ID to build against the External Vendor Testing Environment (EVTE).
3. **Security before features:** MFA for every user and staff member, audit logs kept 12+ months, onshore hosting, encryption at rest and TLS 1.3 in transit, key management, entity validation, tenant isolation, monitoring, incident response, backups, change control. Start ISO/IEC 27001 now (mandatory at Category A).
4. **Ledger before integrations:** a double-entry ledger with a GST code on every line and an immutable audit trail. BAS, payroll and super are reports from it, never separate copies of the numbers.
5. **BAS:** GST and BAS from the ledger, lodged through the Activity Statements service on SBR2 (ebMS3) with cloud software authentication: our machine credential plus a software ID each client business notifies in Access Manager.
6. **Payroll:** STP Phase 2 pay events, including Payday Super's qualifying earnings, sent through a sending service provider at launch and direct over SBR2 once volume justifies it, after passing STP conformance testing.
7. **Super:** Payday Super applies from 1 July 2026 (funds must receive SG within 7 business days of payday), so pay through a SuperStream-compliant clearing house or gateway rather than building SuperStream first.
8. **Bank feeds:** receive them through an accredited Consumer Data Right (CDR) data recipient instead of seeking our own accreditation at launch; use them to match deposits to invoices and mark jobs paid.
9. **Go live service by service:** test in EVTE → OSF questionnaire and evidence → production verification (and extended conformance where required) → accept terms → whitelisting → Production Product ID and DPO Letter of Confirmation. Then say "ATO registered software product", never "ATO Approved".
10. **Stay compliant:** annual OSF review; report data breaches to the ATO within one business day and under the OAIC Notifiable Data Breaches scheme; tell the DPO about hosting or entity changes and passing 10,000 records; scheduled pen tests and security reviews.

---

<sub>Part 3 was checked against official ATO pages on 27 September 2026: [DSP OSF requirements](https://softwaredevelopers.ato.gov.au/RequirementsforDSPs) · [Meeting the requirements](https://softwaredevelopers.ato.gov.au/operational_framework/meeting-requirements) · [API risk ratings](https://softwaredevelopers.ato.gov.au/APIriskratings) · [Getting started](https://softwaredevelopers.ato.gov.au/getting_started) · [Maintaining compliance](https://softwaredevelopers.ato.gov.au/operational_framework/maintaining-compliance) · [Data breaches](https://softwaredevelopers.ato.gov.au/securityeventsanddatabreaches) · [Conditions of use](https://softwaredevelopers.ato.gov.au/usingourservices/dsp-conditions-use) · [Activity Statements on SBR](https://www.sbr.gov.au/digital-service-providers/developer-tools/australian-taxation-office-ato/activity-statements) · [Cloud software authentication](https://www.ato.gov.au/online-services/access-manager/cloud-software-authentication-and-authorisation) · [Payday Super](https://www.ato.gov.au/businesses-and-organisations/super-for-employers/about-payday-super)</sub>
