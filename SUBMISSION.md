# Site VIP · Developer test submission

- **Live app:** _add Vercel URL once deployed_
- **Source:** https://github.com/vrash12/angus-shield-test
- **Demo:** tap **Use demo account** on the login screen (credentials are in the README)
- **Monthly rate (AUD):** $_____ per month

---

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
