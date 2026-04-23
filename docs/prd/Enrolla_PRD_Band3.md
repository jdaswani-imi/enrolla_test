# Enrolla PRD — Band 3

**Status:** In progress. Band 3 = Items 21–28, the commercial/integration layer that turns Enrolla from IMI's internal platform into a white-label SaaS product.

**Builds on:** Band 1 Foundations F.1–F.10 (sealed) and Band 2 Foundations F.11–F.15 (sealed). All references to F.1–F.15 are load-bearing — do not reinterpret.

**Write order:** F.16–F.18 → Item 22 → Item 21 → Item 24 → Item 25 → Item 26 → Item 27 → Item 23 (if unblocked) → Item 28.

---

# Band 3 Foundations (F.16–F.18)

These three foundations are additive to F.1–F.15. Every Band 3 item depends on at least one of them. They are written as a block before any item because items 24, 25, 26, 27, and 28 all reference them concretely and writing items first would force rewrites.

---

## F.16 Integration Framework

**Purpose.** F.16 defines the single contract that every outbound integration in Enrolla implements. Items 24 (payment gateways), 25 (WhatsApp BSP), 26 (Zoho Books/People), and any future integration — Google Calendar, Instagram, Mailchimp, Twilio SMS — plug into this framework. Without F.16, every integration would invent its own retry policy, its own secrets handling, its own webhook verification, and the platform would become ungovernable.

**Adapter model.** Every integration is an **adapter**. An adapter is a named module that implements four capabilities: `connect` (establish auth and verify reachability), `dispatch` (send an outbound action — API call, webhook, message), `receive` (handle inbound webhook or polled event), and `reconcile` (run periodic state reconciliation against the external system). Adapters are tenant-scoped: one tenant's Stripe adapter cannot see another tenant's Stripe data. Super Admin can register new adapter types at the platform level; tenants enable and configure individual adapter instances via M20 Tenant Settings.

**Secrets vault.** Integration credentials — OAuth tokens, API keys, webhook signing secrets, refresh tokens — never live in tenant-accessible tables. They live in an encrypted secrets vault, keyed by `(tenant_id, adapter_instance_id, secret_name)`. The vault enforces: encryption at rest with per-tenant key derivation, access only via the adapter runtime (not via SQL, not via admin tools, not via logs), automatic rotation for OAuth refresh tokens, and audit logging of every read (who, when, which adapter, purpose). When a tenant is terminated (F.18), the vault entries for that tenant are hard-deleted within 24 hours.

**Retry and backoff policy.** Every outbound dispatch uses exponential backoff with jitter: base 2 seconds, factor 2, max 300 seconds, max 6 attempts. Retries are idempotent — every dispatch carries an `idempotency_key` (UUID v4, generated at first attempt, reused on retry). Adapters that hit a permanent failure (4xx client error, auth revoked, resource not found) stop retrying immediately and raise a platform alert. Adapters that hit transient failures (5xx, timeout, rate limit) retry up to the max then fall back to the copy-paste path defined in the relevant module.

**Circuit breaker.** Per adapter instance, if 10 consecutive dispatches fail within 5 minutes, the circuit breaker opens. An open circuit means: all new dispatches of that type route directly to copy-paste fallback, the tenant's Admin Head receives a notification (via the in-platform notification queue — not via the broken adapter), and the circuit stays open for 15 minutes before a single probe dispatch tests recovery. Three failed probes in a row escalate to Super Admin and mark the adapter instance as `degraded` in PL-05. Circuit state is visible to tenant Admins in M20.

**Webhook inbound handling.** Inbound webhooks from external systems (payment gateway confirmations, BSP delivery receipts, Zoho sync callbacks) arrive at a single gateway endpoint: `/webhooks/{tenant_slug}/{adapter_type}`. The gateway verifies signature using the adapter's stored webhook secret, deduplicates by event ID within a 24-hour window, and queues the event for adapter-specific processing. Unsigned or invalid-signature webhooks are logged and dropped. Webhook processing is eventually consistent: a payment confirmation may take up to 60 seconds to reflect in M08, and UI must not assume instantaneous update.

**Reconciliation jobs.** Every adapter runs a scheduled reconciliation job — default nightly, configurable per adapter — that compares Enrolla state against external system state and flags divergence. For Item 24 (payments), this catches payments that succeeded externally but never fired a webhook. For Item 26 (Zoho), this catches records updated in Zoho but not mirrored in Enrolla. Reconciliation findings are surfaced as tasks in M16 assigned to HR/Finance or the relevant role, never auto-corrected silently.

**Rate limiting.** Outbound dispatches are rate-limited per adapter instance using token buckets: default 10 requests/second per tenant per adapter, burstable to 30. Exceeded rate limits queue dispatches rather than dropping them. Inbound webhooks are rate-limited at 100 requests/second per tenant per adapter, with overflow returning HTTP 429 to the external system (which typically triggers the external system's own retry).

**Connects.** All Band 3 integration items (24, 25, 26) implement this contract. F.13 Automation Engine (Band 2) uses F.16 adapters for its live-execution dispatch path. M13 Band 2 copy-paste fallback is the universal degraded path when any adapter fails.

**Out of scope for F.16.** GraphQL or streaming APIs (v1 is REST/webhook only). Real-time bidirectional sync (v1 is eventually-consistent pull/push). Tenant-written custom adapters (Phase 3 — tenants get the adapters Enrolla ships, nothing custom).

---

## F.17 External Auth Surface

**Purpose.** F.17 defines how non-staff users — parents and students — authenticate into Enrolla. Band 1 F.4 (Auth & Sessions) covers staff auth via email/password and the 12-role RBAC (PL-02). F.17 is deliberately a separate auth surface: different credential types, different session rules, different rate limits, different recovery flows, different data access paths. A parent never becomes a staff member by accident and vice versa; the two surfaces share no tokens.

**Primary credential: phone-OTP.** Parent portal login (Item 27) is phone-OTP as the primary and default path. User enters E.164 phone number, system sends a 6-digit code via the tenant's configured SMS/WhatsApp channel (F.16 adapter), user enters code, session is created. OTP is valid for 10 minutes, single-use, maximum 5 attempts before the number is rate-limited for 15 minutes. OTP delivery uses the same F.16 circuit breaker rules — if SMS delivery is failing, fall back to email magic link.

**Secondary credential: email magic link.** Users with a verified email on their guardian profile can request a magic link as an alternative to phone-OTP. Link is valid for 15 minutes, single-use, one-time-token bound to IP range (soft — warns on mismatch, doesn't block). Magic link is also the fallback path when phone-OTP delivery fails.

**No passwords. No social OAuth.** V1 has zero password storage for the external auth surface — reduces credential-stuffing attack surface to zero. Zero social OAuth providers (no Google, Apple, Microsoft, Facebook) — each provider is a new liability surface, and parents in IMI's demographic don't request them. Phase 2 may add passwords and social OAuth if white-label customers demand it; v1 does not.

**Session model.** Parent portal sessions are 30 days by default, tenant-configurable in M20 from 7 to 90 days. Sessions are bound to device (user-agent + IP range heuristics) — significant deviation triggers re-auth. Sessions invalidate immediately on: guardian profile deletion, linked-student-count reaching zero (no students to view), Super Admin impersonation ending, tenant suspension (F.18). Parents can view and revoke their own active sessions from the portal.

**Account recovery.** No passwords means no password reset flow. Recovery paths: (a) phone number still valid → re-request OTP; (b) phone number changed but email valid → magic link, then update phone on profile; (c) both lost → contact the tenant, who verifies identity against enrolment records and updates the guardian profile via M18, at which point the new phone/email works immediately. Enrolla platform staff cannot recover parent accounts — only the tenant can.

**Rate limiting.** Per phone number: 5 OTP requests per hour, 20 per day. Per IP: 30 OTP requests per hour across all phone numbers. Per tenant: 1,000 OTP sends per hour with platform alert at 80%. Magic links: 3 requests per 15 minutes per email. These limits are tenant-overridable in M20 with Super Admin approval only.

**Student portal.** Student sub-portal (Item 27's sub-item) reuses the same auth surface with one difference: students under 13 cannot create their own portal account — the linked guardian enables it and the student inherits auth via a guardian-delegated token. Students 13+ can auth directly via phone-OTP using their own phone number if captured on M17 Student Profile. Student sessions are 14 days, not 30.

**Connects.** Item 27 Parent Portal is the direct consumer. F.16 Integration Framework provides the SMS/WhatsApp delivery path for OTPs. M18 Guardian Profile is the source of truth for the phone number that receives OTPs — changes to M18 phone number invalidate all active parent sessions as a security measure.

**Out of scope.** Passwordless WebAuthn / passkeys (Phase 2). Biometric auth (Phase 2 mobile native only). Multi-factor beyond OTP (OTP is already the factor — no TOTP apps, no hardware keys). Enterprise SSO for parents (SAML/OIDC) — parents are consumers, not enterprise users.

---

## F.18 Commercial Tenant Model

**Purpose.** F.18 defines the lifecycle and commercial state of a tenant on the Enrolla platform. Band 1 F.1 established tenant isolation as an architectural property; F.18 adds the commercial overlay — subscription state, feature flags, DPA versioning, and termination handling — that makes Enrolla operable as a paid SaaS product. Item 28 (PL-05 Platform Admin Panel) is the UI over F.18.

**Tenant lifecycle states.** A tenant occupies exactly one of seven states at any time: **Prospect** (record exists, no platform access, pre-DPA), **Trial** (active access, time-limited, feature-limited, trial_ends_at set), **Active** (paid subscription, full feature access per plan), **Past Due** (payment failed, 14-day grace period, full access retained), **Suspended** (access revoked, data retained, read-only for tenant admins via support path), **Terminated** (scheduled for deletion, 30-day retention window, no access), and **Archived** (data hard-deleted, audit record retained for legal). State transitions are logged with actor, timestamp, and reason; only Super Admin can force a state transition, and Past Due → Active happens automatically on successful payment.

**Subscription plans.** Each tenant is on one plan at any time. Plans are defined at the platform level (not per tenant) and specify: base monthly/annual price, included student count, overage rate per student, included modules (the 15-toggle matrix subset), included integrations, support tier, and DPA version required. V1 ships with three reference plans — Starter, Growth, Enterprise — but the plan model supports arbitrary custom plans created by Super Admin for negotiated deals. Plan changes take effect at the next billing cycle by default; immediate changes are possible with prorated billing logic handled by the payment gateway (Item 24).

**Feature flags.** Every module and integration in Enrolla is gated by a feature flag. Flags exist at three scopes: **platform** (flag rolled out to all tenants or none — for platform-level features like a new auth method), **plan** (flag included in specific subscription plans), and **tenant** (override at individual tenant level, used for beta access, custom contracts, or support exceptions). Tenant-scope overrides are surfaced in PL-05 with a mandatory reason field and expire automatically after a configurable period (default 90 days) unless marked permanent. Feature flag checks happen at the module entry point — flipping a flag off immediately hides the module from tenant users on next page load, without requiring deployment.

**DPA version management.** Every tenant has a `dpa_version_accepted` field recording which version of the Data Processing Agreement they signed and when. Platform-level DPA updates create a new version record; tenants on the old version continue operating but are flagged for re-acceptance. Critical DPA changes (e.g., sub-processor additions affecting data location) trigger a 30-day re-acceptance window after which non-accepting tenants move to a read-only "DPA Pending" state. DPA acceptance is logged with the accepting user (must be a tenant Super Admin), timestamp, IP, and the exact version hash. PL-05 shows the DPA version matrix across all tenants.

**Billing integration.** Enrolla bills tenants through the same payment gateway stack built in Item 24, pointed at Enrolla's own merchant account. Tenants can pay in AED (UAE tenants default) or USD (international default), chosen at provisioning and locked thereafter unless Super Admin migrates. Failed subscription payments enter Past Due state, trigger retry per F.16 policy, and escalate to suspension after 14 days. Manual invoicing is the fallback: Super Admin generates a tenant invoice from PL-05, delivers it via email, and marks it paid on receipt. Manual-billed tenants bypass Past Due state — they go directly Active → Suspended on invoice non-payment after a configurable grace period (default 30 days for manual invoicing vs 14 for gateway).

**Termination handling.** When a tenant moves to Terminated state, the following sequence runs: day 0 — access revoked, data export generated and made available to tenant via secure link valid for 30 days; day 1–30 — data retained read-only for platform staff (support, legal, compliance access only); day 30 — hard delete of tenant data including the F.16 secrets vault entries for that tenant; day 30+ — audit record retained permanently containing tenant name, lifecycle timeline, termination reason, and deletion confirmation hash. Financial records retention follows the UAE 5-year rule (locked decision) — financial data is archived to cold storage before hard delete, not actually deleted.

**Tenant provisioning in v1.** Provisioning is Super Admin gated. Self-serve trial flow is specced in PL-05 (Item 28) but feature-flagged off by default for v1. First-tenant flow: Super Admin creates Prospect record → sends DPA → receives signed DPA → Super Admin marks DPA accepted → selects plan → configures initial module toggles → sets up first tenant Super Admin user → issues provisioning email → tenant Super Admin completes onboarding → state moves to Trial or Active depending on commercial terms.

**Connects.** Item 28 PL-05 is the UI layer over F.18. Item 24 Payment Gateway Integrations provides the billing execution path. F.1 Multi-Tenancy provides the underlying tenant isolation. F.16 Integration Framework holds the secrets vault that F.18 purges on termination. Every module in Enrolla checks F.18 feature flags at its entry point.

**Out of scope.** Tenant-to-tenant data sharing (never). Multi-region data residency beyond "UAE default" (Phase 3). Usage-based billing models beyond student-count overages (v1 is seat-ish, not usage-metered). Reseller/partner hierarchies (Phase 3). Tenant-custom plans with negotiated feature matrices are supported, but tenant-custom modules are not.

---

*End of Band 3 Foundations. Items begin next turn with Item 22 — REF-01 Full Notification Catalogue.*

---

# Item 22 — REF-01 Full Notification Catalogue

## Purpose

REF-01 is the single authoritative catalogue of every system-triggered notification in Enrolla. Band 1 and Band 2 hardcoded a working subset of notifications inline within their modules — attendance alerts, task assignments, concern escalations, NPS reminders — sufficient to make each module functional but not centrally governed. Band 3 Item 22 lifts every notification into a single tenant-configurable catalogue, adds the notifications that were deferred as "Band 3 scope" during Band 2 writing, and makes every notification in the platform answer the same four questions: who fires it, who receives it, through which channels, and whether the tenant can override it. Without REF-01 as a central catalogue, Enrolla ships with notification logic scattered across 20+ modules — impossible to audit, impossible to localise, impossible to tenant-configure, and impossible to diff when a tenant asks "why did I get this."

## What to build

A notification catalogue module (REF-01) that defines every notification as a record, a per-tenant routing configuration layer that overrides catalogue defaults, a channel dispatch layer that uses F.16 adapters for live execution, and a UI surface in M20 Tenant Settings where Admin Heads configure routing per role per channel. Each notification has: a stable catalogue ID (e.g. `NOT.M06.ATT_LATE_3X`), a human-readable name, a category (Academic / Finance / Operations / HR / Platform / Compliance), a trigger source (which module fires it and on what F.13 trigger type), a default audience (role list or dynamic audience rule), a default channel set (in-app, email, WhatsApp), a severity (Info / Warning / Critical), a configurability flag (Tenant-Configurable or System-Locked), and a default template reference. Templates themselves are stored in the Band 2 M13 template library — REF-01 references templates by ID, does not duplicate content.

## Data captured

**Notification record schema:** catalogue_id, name, category, module_source, trigger_type, default_audience, default_channels, severity, configurability, default_template_ids (one per channel), description, introduced_in_band.

**Per-tenant routing override schema:** tenant_id, catalogue_id, enabled (bool), audience_override, channel_override, template_override_ids, suppress_below_severity, rate_limit_override, created_at, created_by, reason.

**The catalogue — full enumeration.** The table below lists every notification in v1 across all three bands. Columns: ID, Name, Category, Source, Audience, Channels, Severity, Config (T = Tenant-configurable, S = System-locked).

| ID | Name | Cat | Source | Audience | Channels | Sev | Cfg |
|---|---|---|---|---|---|---|---|
| NOT.M01.LEAD_NEW | New lead captured | Ops | M01 | Admin, assigned owner | In-app, Email | Info | T |
| NOT.M01.LEAD_STALE_14D | Lead no activity 14 days | Ops | M01 | Lead owner | In-app | Warning | T |
| NOT.M01.LEAD_INACTIVE_53D | Lead inactive warning day 53 | Ops | M01 | Lead owner, Admin | In-app, Email | Warning | T |
| NOT.M01.LEAD_AUTO_INACTIVE | Lead auto-moved to inactive | Ops | M01 | Lead owner, Admin | In-app | Info | T |
| NOT.M01.LEAD_DNC_ATTEMPT | DNC contact attempted | Compliance | M01 | Admin Head | In-app, Email | Warning | S |
| NOT.M03.ASSESS_BOOKED | Assessment booked | Academic | M03 | Student guardian, Assigned teacher | In-app, WhatsApp, Email | Info | T |
| NOT.M03.ASSESS_REMINDER_24H | Assessment reminder 24h | Academic | M03 | Student guardian | WhatsApp, Email | Info | T |
| NOT.M03.ASSESS_NO_SHOW | Assessment no-show | Academic | M03 | Admin, Lead owner | In-app | Warning | T |
| NOT.M03.ASSESS_COMPLETED | Assessment result entered | Academic | M03 | Admin, Lead owner, Academic Head | In-app | Info | T |
| NOT.M04.ENROL_CONFIRMED | Enrolment confirmed | Ops | M04 | Student guardian, Admin, HOD | In-app, Email, WhatsApp | Info | T |
| NOT.M04.ENROL_GRAD_30D | Graduation 30 days out | Ops | M04 | Admin Head, HOD | In-app | Info | T |
| NOT.M04.ENROL_GRADUATED | Student graduated to alumni | Ops | M04 | Admin Head, HOD | In-app | Info | T |
| NOT.M05.SCHED_CONFLICT | Scheduling conflict detected | Academic | M05 | Scheduler, HOD | In-app | Warning | T |
| NOT.M05.SCHED_TEACHER_DBL | Teacher double-booked (soft) | Academic | M05 | Scheduler | In-app | Warning | T |
| NOT.M05.SCHED_ROOM_CLASH | Room clash (hard) | Academic | M05 | Scheduler | In-app, Email | Critical | S |
| NOT.M05.SCHED_CLOSURE_DAY | Session scheduled on closure day | Ops | M05 | Scheduler | In-app | Warning | T |
| NOT.M06.ATT_UNMARKED_24H | Attendance unmarked 24h post-session | Academic | M06 | Teacher, HOD | In-app | Warning | T |
| NOT.M06.ATT_LATE_3X | Student late 3× in term | Academic | M06 | Guardian, HOD | In-app, WhatsApp | Warning | T |
| NOT.M06.ATT_ABSENT_3X | Student absent 3× consecutive | Academic | M06 | Guardian, HOD, Admin Head | In-app, WhatsApp, Email | Critical | T |
| NOT.M06.ATT_UNMARKED_48H | Attendance unmarked 48h post-session (amber) | Academic | M06 | Teacher, HOD, Admin | In-app | Warning | T |
| NOT.M06.ATT_UNMARKED_72H | Attendance unmarked 72h post-session (red) | Academic | M06 | Teacher, HOD, Admin | In-app | Critical | T |
| NOT.M06.MAKEUP_BOOKED | Makeup session booked | Academic | M06 | Guardian, Teacher | In-app, WhatsApp | Info | T |
| NOT.M06.MAKEUP_OVERRIDE | Makeup override used | Academic | M06 | Admin Head | In-app | Info | T |
| NOT.M07.FEEDBACK_DUE | Teacher feedback due | Academic | M07 | Teacher | In-app | Warning | T |
| NOT.M07.FEEDBACK_APPROVED | Feedback approved — share with parent | Ops | M07 | Admin | In-app | Info | T |
| NOT.M07.NPS_SENT | NPS survey dispatched | Ops | M07 | Guardian (recipient), Admin | WhatsApp, Email / In-app | Info | T |
| NOT.M07.NPS_REMINDER_D4 | NPS reminder day 4 | Ops | M07 | Guardian | WhatsApp, Email | Info | T |
| NOT.M07.NPS_DETRACTOR | NPS detractor submitted | Ops | M07 | Admin Head, Academic Head | In-app, Email | Critical | T |
| NOT.M07.COMPLAINT_NEW | New complaint filed | Compliance | M07 | Admin Head, HOD | In-app, Email | Critical | S |
| NOT.M07.COMPLAINT_DUAL_SIGNOFF | Complaint dual sign-off pending | Compliance | M07 | Admin Head, Academic Head | In-app | Warning | S |
| NOT.M08.INV_GENERATED | Invoice generated | Finance | M08 | Guardian, HR/Finance | Email, WhatsApp / In-app | Info | T |
| NOT.M08.INV_PAID | Invoice paid | Finance | M08 | Guardian, HR/Finance | Email / In-app | Info | T |
| NOT.M08.INV_OVERDUE_7D | Invoice overdue 7 days | Finance | M08 | Guardian, HR/Finance | Email, WhatsApp / In-app | Warning | T |
| NOT.M08.INV_OVERDUE_14D | Invoice overdue 14 days | Finance | M08 | Guardian, Admin Head | Email, WhatsApp / In-app | Critical | T |
| NOT.M08.PAYMENT_FAILED | Gateway payment failed | Finance | M08 | Guardian, HR/Finance | Email / In-app | Warning | T |
| NOT.M08.CREDIT_ISSUED | Credit note issued | Finance | M08 | Guardian, HR/Finance | Email / In-app | Info | T |
| NOT.M08.REFUND_PROCESSED | Refund processed | Finance | M08 | Guardian, HR/Finance | Email / In-app | Info | T |
| NOT.M09.STAFF_ONBOARD_PEND | Staff onboarding pending | HR | M09 | HR/Finance, Admin Head | In-app | Warning | T |
| NOT.M09.STAFF_OFFBOARD_BLOCK | Off-boarding blocked (open task) | HR | M09 | HR/Finance, Admin Head | In-app, Email | Critical | S |
| NOT.M09.STAFF_CPD_DUE | CPD verification due | HR | M09 | HR/Finance | In-app | Warning | T |
| NOT.M09.STAFF_LEAVE_REQ | Leave request submitted | HR | M09 | Line manager, HR/Finance | In-app | Info | T |
| NOT.M09.STAFF_EMERGENCY_LEAVE | Emergency leave filed | HR | M09 | HR/Finance, Admin Head | In-app, Email | Critical | S |
| NOT.M09.STAFF_ACCESS_REVOKED | Immediate access revocation | HR | M09 | HR/Finance, Admin Head, Developer | In-app, Email | Critical | S |
| NOT.M10.DIGEST_DAILY | Today's digest ready | Ops | M10 | Admin, Admin Head, HOD | In-app | Info | T |
| NOT.M10.CHURN_RISK_HIGH | High churn risk score | Ops | M10 | Admin Head, HOD | In-app | Warning | T |
| NOT.M11.RATE_CHANGED | Catalogue rate changed | Finance | M11 | HR/Finance, Admin Head | In-app | Warning | T |
| NOT.M12.FORM_SUBMITTED | Form submission received | Ops | M12 | Form owner | In-app, Email | Info | T |
| NOT.M12.MERGE_ROLLBACK_WINDOW | 24h merge rollback expiring | Ops | M12 | Admin Head | In-app | Warning | S |
| NOT.M13.AUTO_RULE_FIRED | Automation rule fired | Ops | M13 | Rule owner | In-app | Info | T |
| NOT.M13.AUTO_RULE_FAILED | Automation rule failed | Ops | M13 | Rule owner, Admin Head | In-app, Email | Warning | T |
| NOT.M13.DISPATCH_QUEUE_READY | Copy-paste dispatch ready | Ops | M13 | Queue assignee | In-app | Info | T |
| NOT.M13.CIRCUIT_OPEN | Adapter circuit breaker opened | Platform | M13 | Admin Head, Developer | In-app, Email | Critical | S |
| NOT.M14.ASSIGN_GRADED | Assignment graded | Academic | M14 | Guardian, Student | In-app, WhatsApp | Info | T |
| NOT.M14.QUICK_SCORE_ENTERED | Quick score entered | Academic | M14 | HOD | In-app | Info | T |
| NOT.M16.TASK_ASSIGNED | Task assigned | Ops | M16 | Task assignee | In-app, Email | Info | T |
| NOT.M16.TASK_DUE_24H | Task due in 24h | Ops | M16 | Task assignee | In-app | Warning | T |
| NOT.M16.TASK_OVERDUE | Task overdue | Ops | M16 | Assignee, Admin | In-app, Email | Warning | T |
| NOT.M16.TASK_CONCERN_AUTO | Concern auto-created task | Ops | M16/F.11 | HOD, Assignee | In-app | Warning | T |
| NOT.M17.STUDENT_PROFILE_NOTE | Note added to student | Academic | M17 | HOD, Teacher | In-app | Info | T |
| NOT.M18.GUARDIAN_UPDATED | Guardian profile updated | Ops | M18 | Admin | In-app | Info | T |
| NOT.M18.GUARDIAN_ERASURE_REQ | Guardian erasure requested | Compliance | M18 | Admin Head, Developer | In-app, Email | Critical | S |
| NOT.M19.PROGRESS_REPORT_READY | Progress report generated | Academic | M19 | Guardian, HOD | In-app, Email | Info | T |
| NOT.M19.ACADEMIC_ALERT | Academic alert triggered | Academic | M19 | HOD, Admin Head | In-app | Warning | T |
| NOT.M19.PREDICTED_GRADE_DROP | Predicted grade dropped | Academic | M19 | HOD, Teacher | In-app | Warning | T |
| NOT.M19.TRACKER_LOCKED | Two-year tracker locked | Academic | M19 | Academic Head | In-app | Info | S |
| NOT.M19.REMARK_48H | Remark 48h clock started | Academic | M19 | Teacher | In-app | Warning | S |
| NOT.M20.SETTINGS_CHANGED | Tenant settings changed | Platform | M20 | Admin Head, Super Admin | In-app, Email | Warning | S |
| NOT.FM.IMPORT_DRYRUN_READY | Import dry-run ready | Ops | FM02 | Import initiator | In-app | Info | T |
| NOT.FM.IMPORT_COMMITTED | Import committed | Ops | FM02 | Import initiator, Admin Head | In-app, Email | Info | T |
| NOT.FM.IMPORT_ROLLBACK | Import rollback executed | Ops | FM02 | Import initiator, Admin Head | In-app, Email | Warning | S |
| NOT.PL.DPA_NEW_VERSION | New DPA version available | Compliance | PL-05/F.18 | Tenant Super Admin | In-app, Email | Critical | S |
| NOT.PL.DPA_REACCEPT_PENDING | DPA re-acceptance pending | Compliance | PL-05/F.18 | Tenant Super Admin | In-app, Email | Critical | S |
| NOT.PL.SUBSCRIPTION_PAST_DUE | Subscription past due | Finance | PL-05/F.18 | Tenant Super Admin | In-app, Email | Critical | S |
| NOT.PL.SUBSCRIPTION_SUSPENDED | Tenant suspended | Platform | PL-05/F.18 | Tenant Super Admin, Super Admin | In-app, Email | Critical | S |
| NOT.PL.FEATURE_FLAG_CHANGED | Feature flag changed on tenant | Platform | PL-05 | Admin Head | In-app | Info | S |
| NOT.PL.IMPERSONATION_STARTED | Support impersonation session | Platform | PL-05 | Tenant Super Admin | In-app, Email | Warning | S |
| NOT.PL.AI_BUDGET_80PCT | AI budget 80% reached | Platform | F.12 | Admin Head, Super Admin | In-app, Email | Warning | S |
| NOT.PL.AI_BUDGET_EXCEEDED | AI budget exceeded | Platform | F.12 | Admin Head, Super Admin | In-app, Email | Critical | S |
| NOT.PL.SECURITY_LOGIN_ANOMALY | Staff login anomaly | Platform | F.4 | User, Admin Head | In-app, Email | Warning | S |
| NOT.PP.PORTAL_OTP | Parent portal OTP code | Auth | F.17 | Guardian | SMS / WhatsApp | Info | S |
| NOT.PP.PORTAL_MAGIC_LINK | Parent portal magic link | Auth | F.17 | Guardian | Email | Info | S |
| NOT.PP.PORTAL_NEW_DEVICE | New device login | Auth | F.17 | Guardian | In-app, Email | Warning | S |

**Total: 79 notifications.** Categories: Academic (19), Ops (22), Finance (9), HR (6), Compliance (6), Platform (11), Auth (3), Academic (cont.) — the split reflects platform surface area, not arbitrary binning.

## Rules

**Configurability split is load-bearing.** System-locked notifications (S) cannot be disabled, re-audienced, or re-channelled by tenants. They cover: compliance (DNC, complaints, erasure), security (access revocation, login anomaly, circuit breaker), platform integrity (DPA acceptance, subscription state, tenant settings changes, AI budget), and auth (portal OTP/magic link/new device). Rationale: a tenant who disables their own DPA re-acceptance notification creates a compliance incident Enrolla is liable for. Tenant-configurable notifications (T) cover everything else — tenants can disable, change audience within their RBAC roles, change channel set, override template, or set rate limits.

**Audience resolution.** Audiences are resolved at dispatch time, not at rule creation time. If a notification targets "HOD," the dispatch layer resolves the HODs relevant to the entity in context — the HOD of the student's department, not every HOD in the tenant. Dynamic audience rules (e.g., "assigned owner") resolve against the live record. Empty audiences after resolution are logged and dropped with no error — a notification with no valid recipients is a config issue, not an exception.

**Channel fallback ladder.** Every notification has an ordered channel set. Dispatch attempts each channel in order; on F.16 circuit-open for a channel, it falls to the next. In-app is always the terminal fallback (it cannot fail — in-app notifications write to a queue read by the tenant UI, no external dependency). A notification configured for WhatsApp + Email + In-app that fails on both WhatsApp and Email still delivers in-app.

**Rate limiting.** Per recipient per notification ID: default 1 dispatch per 10 minutes (prevents spam loops from misconfigured automations). Tenant-configurable per notification in M20, with Super Admin approval required to disable rate limiting on System-locked notifications.

**Localisation.** V1 is English-only (locked decision — no Arabic/UTF-8 in v1). Notification templates are stored in the M13 template library with a `locale` field set to `en-GB` for every v1 template. The locale field exists so Phase 2 localisation is a data addition, not a schema change.

**Severity gates digest inclusion.** Info-level notifications aggregate into the M10 Today's Digest and may not fire individual alerts. Warning-level notifications fire individual alerts and also appear in digest. Critical-level notifications fire individual alerts, appear in digest, and bypass tenant-configured "quiet hours" if the tenant has them enabled.

**Suppression during migration.** Notifications do not fire during FM02 data import commit batches — this is the Band 2 platform safety rule extended to the notification layer (F.13 triggers are already suppressed; REF-01 inherits the suppression).

## Connects

REF-01 is consumed by every module that fires notifications — essentially all 20 modules across Bands 1–3. Templates are stored in M13 template library (Band 2) and referenced by ID. Dispatch uses F.16 adapters for live-execution channels (WhatsApp via Item 25's BSP, email via SMTP adapter, SMS for OTPs via Item 25). Tenant routing overrides live in M20 Tenant Settings. Audience resolution uses PL-02 RBAC (Band 1). Rate limiting and suppression inherit from F.13 Automation Engine. The M10 Today's Digest aggregates Info-level notifications into the daily panel. Auth notifications (NOT.PP.*) fire from F.17 External Auth Surface. Platform notifications (NOT.PL.*) fire from F.18 Commercial Tenant Model and PL-05.

## Out of scope

Per-recipient user-level preferences (v1 is tenant-configured only; recipient-level opt-out is Phase 2). Push notifications to mobile devices (no native apps in v1). Voice call notifications (never). Notification analytics dashboard beyond dispatch success/failure counts — advanced analytics (open rates, click rates, engagement scoring) is Phase 2. Notification A/B testing. Dynamic template generation via AI at dispatch time (F.12 AI is for content creation upstream, not per-dispatch rewriting). Multi-language notification variants (v1 English only). Notification history retention beyond 90 days for Info/Warning and 2 years for Critical (longer retention is Phase 2).

## UI specifics

**Notification catalogue page (M20 Tenant Settings → Notifications tab).** Full catalogue displayed as a filterable table with columns: ID, Name, Category, Audience, Channels, Severity, Status (Default / Overridden / Disabled). Filter chips for category, severity, configurability, source module. Search by ID or name. Click row opens edit drawer.

**Edit drawer.** Shows current config vs. default side-by-side. Fields: enabled toggle (disabled for System-locked with explanatory tooltip), audience multi-select (scoped to RBAC roles the Admin Head can route to), channel multi-select (In-app / Email / WhatsApp / SMS), template picker per channel (pulls from M13 library filtered to matching channel and notification type), rate limit override (minutes between dispatches per recipient), reason field (required on save, logged). System-locked rows show a padlock icon with tooltip explaining why.

**Bulk actions.** Multi-select rows to apply channel changes across multiple notifications (e.g., disable WhatsApp for all Info-level notifications during BSP template re-approval). Bulk actions require reason field and are logged as a single audit event with affected IDs.

**Test dispatch.** Each catalogue row has a "Test dispatch" button that sends the notification to the currently-logged-in user using the current configuration, bypassing audience resolution. Marks the dispatch as `test=true` in logs so it never counts against rate limits or billing.

**Dispatch history drawer.** Per notification, a history view showing last 100 dispatches with recipient, channel used, outcome (delivered / failed / fallback), timestamp, and (for failures) F.16 error code. Filterable by recipient and outcome. Export to CSV.

**Default vs override indicator.** Rows with any tenant override from default display a small "Modified" badge. Bulk "Reset to defaults" action available with confirmation.


---

# Item 21 — M13 Automation Engine & Template Library (Live Execution) — Part 1

## Purpose

Band 2 Item 18 built the M13 automation engine with a deliberate architectural constraint: every outbound action terminated in the **dispatch queue**, a copy-paste fallback surface where Admin users manually forwarded rendered content to external channels. The engine was fully functional — rules evaluated, templates rendered, audiences resolved, F.13 triggers fired — but the last mile was human. Band 3 Item 21 upgrades that last mile to live execution: the dispatch queue becomes optional rather than mandatory, rules with live-capable channels execute end-to-end through F.16 adapters without human handoff, scheduled actions fire autonomously on their time anchors, and marketing campaign dispatch (Item 21 Part 2) ships as a first-class feature rather than a "compose-and-paste" workaround. Critically, the copy-paste queue does not disappear — it remains the permanent fallback path when F.16 circuit breakers open, when tenants choose not to configure a live channel, and when specific notifications are flagged copy-paste-only for legal or operational reasons. Part 1 of Item 21 (this turn) covers the live dispatch architecture, scheduled action engine, and template execution wiring. Part 2 (next turn) covers campaign dispatch, rule engine upgrades, and rate/quota governance.

## What to build

A **live execution layer** that sits between the F.13 rule engine and F.16 adapters, replacing the terminal "write to dispatch queue" step with a branching router: for each rule firing, the router inspects the rule's channel configuration, checks per-channel adapter health, and either routes to the live adapter or falls back to the dispatch queue. A **scheduled action engine** that evaluates time-anchored rules (F.13 trigger types 2 and 3 — time-based absolute and time-based relative) against a persistent schedule table, firing dispatches at their anchor time ±60 seconds. A **template execution wiring** upgrade that renders templates against the recipient's resolved context (student, guardian, invoice, session, or whatever entity the rule is bound to), handles missing-variable fallback, applies per-channel character limits (WhatsApp 1024 chars for session-window messages, email no limit, SMS 160 chars), and logs the rendered output to dispatch history for audit. A **live/fallback toggle** per rule per channel in the M13 rule builder UI, defaulting to "live if adapter healthy, queue otherwise." An **execution audit log** that records every rule firing with inputs, routing decision, channel, outcome, and latency.

## Data captured

**Rule execution record:** execution_id, rule_id, tenant_id, trigger_event_id, trigger_type, fired_at, recipient_count, routing_decisions (array of {recipient_id, channel, route: live|queue|dropped, reason}), rendered_payload_refs, total_latency_ms, outcome (success|partial|failed), error_codes.

**Scheduled action record:** schedule_id, rule_id, tenant_id, anchor_entity_type, anchor_entity_id, anchor_field, scheduled_for, fires_at, status (pending|fired|skipped|cancelled), cancellation_reason, created_at, updated_at.

**Template execution record:** render_id, template_id, rule_execution_id, recipient_id, channel, variables_resolved, missing_variables, rendered_body, rendered_subject, rendered_char_count, truncated (bool), rendered_at.

**Live/fallback configuration:** rule_id, channel, mode (`live_preferred`, `live_only`, `queue_only`, `queue_preferred`), fallback_behaviour (`on_circuit_open`, `on_any_failure`, `never`), override_reason.

**Channel health snapshot** (read from F.16, cached 60s): tenant_id, channel, circuit_state (closed|open|degraded|probing), last_success_at, last_failure_at, failure_count_5min, probe_status.

## Rules

**Routing decision order.** For every rule firing that produces dispatches, the router applies this decision ladder per recipient per channel: (1) is the channel enabled for this rule? If no → drop with `channel_disabled` reason. (2) Is the rule mode `queue_only`? If yes → dispatch queue, stop. (3) Is the F.16 circuit closed for this channel? If no and fallback_behaviour allows → dispatch queue with `circuit_open` reason. (4) Is the rate limit budget available for this recipient? If no → queue with `rate_limited` reason (queue bypasses per-recipient rate limits so humans can decide). (5) Live dispatch via F.16 adapter. (6) On dispatch failure within the live path → retry per F.16 policy, then queue with `live_exhausted` reason. The decision and reason are logged on every recipient, always.

**Scheduled action anchoring.** Time-based triggers resolve their anchor at rule-creation time and re-resolve on anchor-field update. A rule "3 days before session start" schedules 3 days before `session.start_at` and rewrites its scheduled_for if the session is rescheduled. Rescheduling invalidates pending dispatches and re-schedules from the new anchor; scheduled actions carry a foreign key to their anchor entity and subscribe to change events. Anchor entity deletion cancels pending scheduled actions with reason `anchor_deleted`.

**Scheduled action firing window.** The scheduler wakes every 30 seconds and picks up scheduled actions with `fires_at <= now + 60s`. This gives a ±60 second delivery window against the scheduled time, which is acceptable for every v1 use case (nobody cares whether a "24h session reminder" lands at 13:00:05 or 13:00:45). Actions that miss their firing window by more than 5 minutes due to system outage fire on recovery with a `late_dispatch=true` flag and a tenant-configurable skip threshold (default: skip if >24h late).

**Template rendering fallback.** Templates use a `{{variable}}` syntax with dot-path access (`{{student.first_name}}`, `{{invoice.amount_due}}`, `{{session.start_time|time:HH:mm}}`). Missing variables render as the literal placeholder text (configurable per template) or the string `[unknown]` by default. Missing *required* variables (marked in the template definition) fail the render, drop the dispatch, and log the failure to M16 as a task for the rule owner. Truncation for channels with character limits applies AFTER render — the system never truncates a template mid-variable. If the rendered output exceeds the channel limit, the dispatch logs `truncated=true` and either trims to the limit (for SMS) or fails and falls back to email (for WhatsApp session messages where truncation would break the message).

**Live execution suppression.** Five cases suppress live execution regardless of rule mode: (1) tenant is in `Suspended` or `Past Due` state (F.18) — live dispatch halted, queue only; (2) rule was created or modified in the last 5 minutes (cooldown window prevents accidental mass-fire from buggy new rules); (3) recipient count exceeds the rule's per-firing cap (default 1,000 — forces manual review for mass dispatches); (4) the dispatch is a migration-imported trigger (Band 2 platform safety rule); (5) F.12 AI budget is in the "paused" state and the template references AI-generated content.

**Execution idempotency.** Every rule execution carries an idempotency key derived from (rule_id, trigger_event_id, recipient_id). Replaying the same trigger event — which can happen on system recovery or webhook retries — is a no-op for recipients already dispatched. The idempotency window is 7 days; after that, the key is garbage collected and replays would re-fire (but 7 days is long enough that no recovery scenario crosses it).

**Dispatch queue retains write access.** Even with live execution enabled, tenants can manually push a rule firing to the queue via the rule detail page ("Send to queue instead"). This is the escape hatch for cases where an Admin wants to review the rendered output before sending — useful for new rules, sensitive communications, or during rule debugging.

**Live execution metering.** Every live dispatch counts against the tenant's subscription plan limits (defined in F.18 plan schema). Limits apply per-channel per-month: WhatsApp message count, email send count, SMS count. At 80% of limit, NOT.PL.AI_BUDGET_80PCT-equivalent platform notification fires (NOT.PL.DISPATCH_QUOTA_80PCT, to be added to REF-01 in Part 2). At 100%, live dispatch falls back to queue with `quota_exceeded` reason; tenant can upgrade plan or wait for the monthly reset.

## Connects

Item 21 Part 1 consumes F.13 (rule schema and 7 trigger types from Band 2), F.16 (adapter contract and circuit breaker state), F.18 (tenant lifecycle gating and subscription quotas), and REF-01 (notification catalogue and template references). It writes to the M13 template library (Band 2), the dispatch queue (Band 2, now as fallback path rather than terminal), and M16 Task Management (failed renders create tasks for rule owners). Execution audit logs feed the M10 Management Dashboard (digest) and PL-05 (platform-level observability, Item 28). The scheduled action engine reads from any anchor entity in the platform — M04 enrolments, M05 sessions, M08 invoices, M09 staff records — and subscribes to their update events. F.11 Concern Engine uses Item 21's execution layer when concerns trigger notifications rather than tasks.

## Out of scope for Part 1

Marketing campaign dispatch (Part 2 — next turn). Rule builder UI upgrades for live/fallback toggle configuration (Part 2). Per-tenant rate limit and quota dashboards (Part 2). The 7 trigger type upgrades for live-path compatibility (Part 2 — some of the 7 need adjustments to carry idempotency keys cleanly). Advanced template features like conditional blocks (`{{#if}}...{{/if}}`) and loops — v1 templates are linear variable substitution only. Webhook-delivered notifications to tenant-defined endpoints (Phase 2). Rich media attachments beyond what BSP templates natively support (Part 2 clarifies this for WhatsApp). Real-time streaming dispatches (the 30-second scheduler tick is the tightest firing window v1 supports). Human approval workflows inside live execution (tenants who want approval use queue mode explicitly).

## UI specifics

**Rule detail page — Execution tab.** New tab on every rule showing last 100 executions with filterable columns: fired_at, trigger type, recipient count, live count, queue count, dropped count, average latency, outcome. Click a row opens the execution drawer with per-recipient routing decisions and reasons, rendered payload preview (truncated with "show full" expand), and re-dispatch action (Super Admin only — requires reason, bypasses idempotency).

**Scheduled actions calendar (M13 → Scheduled tab).** A calendar view showing all pending scheduled actions for the next 30 days, filterable by rule, recipient entity type, and anchor field. Each cell shows aggregate count; click drills into the list. Bulk cancel action available with reason; cancelled actions log to audit with the cancelling user and reason.

**Template execution preview.** In the rule builder, a "Preview" button renders the template against a user-selected sample recipient, showing: rendered body per configured channel, character counts with limit indicators, missing variables list, and which variables came from which entity. Preview never actually dispatches.

**Live/fallback status indicator.** Every rule in the M13 rule list shows a small badge indicating its current effective dispatch mode: green "Live" (live path healthy), amber "Queue" (falling back to queue), red "Paused" (rule suppressed per the five suppression cases), grey "Mixed" (multi-channel rule where some channels are live and others queue). Hover tooltip explains the current state.

**Execution failure banner.** If a rule has >10% execution failure rate over its last 100 firings, a banner appears on the rule detail page prompting the rule owner to review. Banner dismissible, reappears if failure rate stays above threshold for another 24 hours.


---

# Item 21 — M13 Automation Engine (Live Execution) — Part 2

## Purpose

Part 1 built the live execution layer under existing F.13 rules — single-event triggers firing to resolved audiences through F.16 adapters. Part 2 adds the three things Part 1 deliberately deferred: marketing campaign dispatch as a first-class feature distinct from rule firings, rule engine upgrades for live-path compatibility across all 7 F.13 trigger types, and the per-tenant governance surface (quota dashboards, rate limit visibility, campaign history) that makes tenants confident enough in live execution to enable it. Two retroactive REF-01 additions close the catalogue gap introduced in Part 1.

## What to build

A **campaign dispatch engine** that takes a segment (from Band 2 F.14 Segment Cache), a template (from the M13 template library), a channel, a schedule (immediate or scheduled-for), and a dispatch policy (single-shot, drip with intervals, or recurring), and executes against the segment using the same routing ladder as rule firings. **Rule engine upgrades** that adapt each of the 7 F.13 trigger types to carry idempotency keys cleanly — some triggers (attendance event, status change) needed no changes; others (threshold breach, time-based relative) required the trigger event ID to be scoped differently so replays deduplicate correctly. A **quota and rate limit dashboard** in M20 showing per-channel monthly quotas, current usage, rate limit states, and upcoming scheduled dispatches. A **campaign analytics panel** showing per-campaign delivery, failure, and engagement metrics. Two retroactive notification catalogue additions: `NOT.PL.DISPATCH_QUOTA_80PCT` and `NOT.PL.DISPATCH_QUOTA_EXCEEDED`, both System-locked, Platform category, firing from F.18 against the per-channel quotas defined in the subscription plan.

## Data captured

**Campaign record:** campaign_id, tenant_id, name, owner_id, segment_id (F.14), template_id, channel, dispatch_policy (`single_shot`|`drip`|`recurring`), schedule_spec, dispatch_window, status (draft|scheduled|dispatching|completed|cancelled|failed), recipient_count_at_dispatch, recipient_count_delivered, recipient_count_failed, unsubscribe_count, created_at, dispatched_at, completed_at.

**Campaign dispatch record:** dispatch_id, campaign_id, recipient_id, route (live|queue|dropped), channel, outcome, error_code, dispatched_at, delivered_at.

**Unsubscribe record:** unsubscribe_id, tenant_id, recipient_id, channel, scope (`campaign`|`all_marketing`|`all`), source (`link_click`|`keyword`|`manual`|`system`), reason, timestamp. Unsubscribe scope `all` is always honoured regardless of the rule/campaign config; scope `all_marketing` suppresses campaigns but not transactional notifications (invoices, attendance, safeguarding); scope `campaign` suppresses only the specific campaign.

**Quota state:** tenant_id, channel, period_start, period_end, quota_limit, current_usage, projected_usage (based on pending scheduled dispatches), state (`ok`|`warning_80pct`|`exceeded`).

**Rate limit bucket state (cached 60s from F.16):** tenant_id, channel, bucket_capacity, tokens_available, refill_rate, last_refill_at, queue_depth.

## Rules

**Campaigns route through the same ladder as rule firings.** A campaign is not a privileged path — every recipient in a campaign dispatch goes through the Part 1 routing ladder (channel enabled → mode check → circuit check → rate limit → live dispatch → fallback). The only difference is campaigns carry a `campaign_id` in the execution record and count toward marketing-scope unsubscribes.

**Unsubscribe honouring is load-bearing for compliance.** Before any campaign dispatch to a recipient, the engine checks the unsubscribe table for (recipient_id, channel) with scope `campaign` (matching this campaign), `all_marketing`, or `all`. Any match drops the recipient from the dispatch with reason `unsubscribed` and logs the drop. This check is non-optional and not tenant-configurable — unsubscribe honouring is a compliance rule, not a feature. **DNC status (from M01 lead management) is also checked at dispatch time** and behaves per the Band 1 decision: DNC produces a warning interstitial for transactional but hard-blocks for marketing campaigns. Campaign dispatches silently drop DNC recipients with reason `dnc_blocked`. DNC always wins over any campaign configuration.

**Campaign dispatch policies.** Three policies in v1. **Single-shot:** one dispatch to the full segment at the scheduled time, dispatch completes when all recipients are routed. **Drip:** dispatches to the segment in batches at configured intervals (e.g., 100 recipients every 10 minutes) to smooth load and stay under rate limits; cancellable mid-drip with already-dispatched recipients preserved. **Recurring:** re-evaluates the segment on each run and dispatches to new members only (using a `last_dispatched_at` per recipient on the segment record) — used for "new lead welcome" style campaigns that should not re-fire for recipients already in the segment at previous runs. Recurring campaigns have a maximum of 1 run per 24 hours (hard limit, prevents config errors from producing daily spam).

**Segment size caps.** Campaigns to segments above 5,000 recipients require Admin Head approval (logged, audit-trailed). Segments above 20,000 require Super Admin approval. These are defaults, tenant-overridable in M20 with reason. The caps exist because a misfired 20,000-recipient WhatsApp campaign is the kind of incident that terminates BSP relationships and gets tenants suspended.

**Idempotency key scoping per trigger type (rule engine upgrades).** Of the 7 F.13 trigger types, three needed adjustment for clean live-path replay behaviour. **Status change** triggers use (entity_id, from_status, to_status, transition_timestamp) — replays of the same transition are no-ops, re-entries into the same status fire again (because transition_timestamp differs). **Threshold breach** triggers use (entity_id, threshold_rule_id, breach_window_start) — repeated breaches of the same threshold within the same window do not re-fire, but a new window (e.g., a new term for term-scoped thresholds) fires again. **Time-based relative** triggers use (anchor_entity_id, anchor_field, offset_spec, anchor_value_at_schedule) — if the anchor value changes, the scheduled dispatch is invalidated and re-scheduled with a new key. The other four trigger types (time-based absolute, manual, form submission, attendance event) needed no adjustment.

**Quota warning cascade.** At 80% of a channel's monthly quota, `NOT.PL.DISPATCH_QUOTA_80PCT` fires to Admin Head and Super Admin, in-app + email, Warning severity, System-locked. At 100%, `NOT.PL.DISPATCH_QUOTA_EXCEEDED` fires to the same audience, Critical severity, and all live dispatches for that channel route to queue with reason `quota_exceeded` until the period resets or the tenant upgrades plan. Quota state is evaluated at each dispatch attempt, not on a schedule — the moment a dispatch crosses the threshold, the next dispatch sees the updated state.

**Projected usage warnings.** The quota dashboard computes projected monthly usage by adding current_usage to the sum of pending scheduled dispatches that will fire in the current period. If projected_usage exceeds the quota, the dashboard flags the projection with an amber indicator and the Admin Head receives an early-warning in-app notification (distinct from the 80% actual usage notification — this one is forward-looking and fires once per period per channel maximum).

**Campaign cancellation.** Campaigns in `scheduled` status can be cancelled by the owner or any Admin with reason logged. Campaigns in `dispatching` status can be cancelled by Admin Head or Super Admin only, with reason, and cancellation stops future dispatches but does not recall already-dispatched messages. Cancelled campaigns are retained for audit; the data is not deleted.

## Connects

Campaigns consume F.14 Segment Cache (Band 2) for recipient lists, M13 template library for content, Part 1's routing ladder for dispatch execution, and F.16 adapters for live channels. Unsubscribe records are written by the parent portal (Item 27, when parents click unsubscribe links), by inbound WhatsApp keyword handlers (Item 25, keywords STOP/UNSUBSCRIBE), and by manual entry in M20. DNC is sourced from M01 Lead Management (Band 2). Quota state reads from F.18 subscription plan definitions. Rate limit state reads from F.16. The two new notifications (`NOT.PL.DISPATCH_QUOTA_80PCT` and `NOT.PL.DISPATCH_QUOTA_EXCEEDED`) are added to the REF-01 catalogue bringing the total from 80 to 82; both are System-locked Platform-category notifications routing to Admin Head and Super Admin via in-app and email.

## Out of scope

Campaign A/B testing — Phase 2. Per-recipient open/click tracking beyond what channels natively report (WhatsApp read receipts, email opens via tracking pixel) — the tracking pixel is the only tracker in v1, opt-outable per tenant. Dynamic segment campaigns where the segment recomputes during dispatch — recurring policy handles this at run-boundary granularity; intra-dispatch recomputation is explicitly out. Multi-channel campaigns (same campaign dispatching via email AND WhatsApp simultaneously) — v1 requires two separate campaigns with the same template rendered for each channel. Campaign templates with AI-generated per-recipient personalisation at dispatch time (F.12 AI budget cost model does not support this volume). Landing pages or click-through destinations beyond static URLs — campaigns link to tenant-provided URLs, Enrolla does not host campaign landing pages. Campaign performance forecasting or send-time optimisation. Re-engagement triggers based on campaign engagement (Phase 2 once engagement data shape is stable).

## UI specifics

**Campaign list page (M13 → Campaigns tab).** Table with columns: name, segment, channel, status, scheduled_for, recipient count, delivered, failed, unsubscribed, owner. Filter chips for status and channel. Sort by any column. Click row opens campaign detail.

**Campaign builder (M13 → New Campaign).** Five-step wizard: (1) Name and owner; (2) Segment picker (pulls from F.14 segments, shows member count and last refresh); (3) Template picker (filtered to channel-compatible templates, with inline preview); (4) Schedule (immediate, scheduled-for, drip with batch size and interval, or recurring with frequency); (5) Review — shows full dispatch plan including resolved recipient count, quota impact, unsubscribe estimate, and approval requirement if segment >5,000. Save as draft at any step.

**Campaign detail page.** Header with status, schedule, owner, and cancel button (role-gated). Tabs: Overview (recipient count, dispatch progress bar, delivery rate), Recipients (full list with per-recipient route decision and outcome), Unsubscribes (who unsubscribed and when), Template preview. Audit log sub-section showing all state transitions with actor and timestamp.

**Quota dashboard (M20 → Dispatch Quotas tab).** Per-channel cards showing: current period's quota usage as a progress bar with 80% and 100% markers, current absolute count vs limit, projected usage indicator (amber if projection exceeds quota), circuit breaker state (pill: closed/open/degraded), rate limit bucket depth, and a small sparkline of last 30 days of daily dispatch volume. Click card opens channel detail with full history and the list of upcoming scheduled dispatches contributing to projected usage.

**Rule builder live/fallback toggle (from Part 1 deferred spec).** In the M13 rule builder, a new section per configured channel with radio options: `Live preferred` (default), `Live only` (fail rather than queue), `Queue preferred` (always queue, live as fallback — unusual), `Queue only` (never live). Selecting `Live only` or `Queue only` requires a reason logged on save. The section also shows the current F.16 circuit state for the channel at the tenant level as a read-only indicator.

**Unsubscribe management page (M20 → Unsubscribes tab).** Table of all unsubscribed recipients with scope, channel, source, timestamp, and reason. Filter by scope and source. Manual unsubscribe action available (requires reason). Manual re-subscribe action available for scope `campaign` and `all_marketing` only — scope `all` unsubscribes cannot be reversed by the tenant and require Super Admin intervention with documented consent from the recipient.


---

# Item 24 — M08 Payment Gateway Integrations — Part 1

## Purpose

Band 1/2 M08 records payments manually: a guardian pays by bank transfer, cash, cheque, or card-on-file elsewhere, and the tenant's HR/Finance user enters the payment against the invoice in Enrolla. This works, has worked at IMI for years, and is how the v1 reference customer operates today. Item 24 adds live payment gateway integration as an additional path, not a replacement: tenants who enable a gateway can issue payment links on invoices, accept online payments, receive webhook confirmations, and auto-reconcile payments to invoices without manual entry. Manual entry remains available for cash, cheque, bank transfer, and any tenant who never enables a gateway — the gateway path is additive. Item 24 Part 1 (this turn) covers gateway adapter configuration through F.16, payment link generation, inbound webhook handling, and the payment-to-invoice matching logic. Part 2 (next turn) covers auto-reconciliation beyond webhooks, failed-payment retry, refund flow, and the gateway migration flow when a tenant switches providers.

## What to build

Three gateway adapters implementing the F.16 contract: **Telr** (UAE-focused, supports AED primarily), **Network International** (UAE and regional, supports AED and USD), and **Stripe** (international, supports 135+ currencies — v1 uses AED and USD only). Each adapter exposes a uniform internal interface: create a payment session, generate a payment link, verify a webhook signature, query payment status, and trigger a refund. **A tenant chooses exactly one gateway at provisioning**, configurable in M20 Settings → Payment Gateway tab, switchable later via Super Admin with the migration flow specified in Part 2. A **payment session entity** that tracks the lifecycle from link generation through terminal state. A **payment link generator** that produces a tenant-branded checkout URL valid for a configurable window (default 7 days). A **webhook handler pipeline** that receives gateway callbacks via F.16's inbound gateway, verifies signatures per adapter rules, deduplicates by gateway event ID, and matches events to payment sessions. A **payment-to-invoice matcher** that links confirmed payments back to M08 invoices using the payment session's `invoice_id` foreign key, updating invoice status and triggering downstream F.13 automation.

## Data captured

**Gateway configuration (per tenant):** tenant_id, gateway_provider (`telr`|`network_international`|`stripe`), merchant_id, api_key_secret_ref (F.16 vault), webhook_secret_ref, currency (`AED`|`USD`), enabled_at, enabled_by, status (`active`|`migrating`|`suspended`). Exactly one active row per tenant.

**Payment session:** session_id, tenant_id, gateway_provider, invoice_id, amount, currency, gateway_session_id (provider's own ID), payment_link_url, link_expires_at, status (`created`|`pending`|`succeeded`|`failed`|`cancelled`|`expired`|`refunded`), created_by, created_at, paid_at, failure_reason, gateway_raw_response_ref.

**Gateway webhook event:** event_id (internal), gateway_event_id (provider's ID, unique per provider), gateway_provider, tenant_id, event_type (`payment.succeeded`|`payment.failed`|`payment.refunded`|`payment.disputed`|other), signature_verified (bool), processed_at, payment_session_id (resolved), raw_payload_ref, processing_outcome (`matched`|`unmatched`|`duplicate`|`rejected`).

**Payment record (upgraded from Band 2 M08 schema):** payment_id, invoice_id, amount, method (`cash`|`bank_transfer`|`cheque`|`card_manual`|`gateway`), gateway_session_id (nullable — set if method=gateway), gateway_provider (nullable), received_at, recorded_by (for manual) or `system` (for gateway), reconciliation_state (`unreconciled`|`auto_reconciled`|`manual_reconciled`|`disputed`), notes.

## Rules

**One active gateway per tenant.** Tenants configure exactly one gateway at any time. Switching gateways is a deliberate migration flow (Part 2) that transitions open invoices between providers under controlled rules. The provider choice is stored in tenant settings and is not a per-invoice or per-session decision. Rationale from your Q6 answer: simpler data model, cleaner reconciliation, matches how tenants actually operate commercially.

**Currency is locked at provisioning.** A tenant picks AED or USD when enabling the gateway and cannot change currency without a full gateway re-enablement flow requiring Super Admin. This prevents mid-term currency drift on recurring invoices and matches the F.18 tenant-level currency lock.

**Payment links are single-use and tenant-scoped.** Every payment session generates one link. The link routes the payer through the gateway's hosted checkout, not an Enrolla-hosted form — Enrolla never touches card data, never stores PAN, never enters PCI scope. On payment completion, the gateway redirects to a tenant-branded confirmation page hosted by Enrolla showing the invoice status update. Links expire 7 days after generation by default (tenant-configurable in M20, min 1 hour, max 30 days). Expired links can be regenerated from the invoice page — regeneration cancels the prior session.

**Webhook signature verification is mandatory.** Every inbound webhook is signature-verified using the adapter-specific method: Telr uses its signature field + shared secret, Network International uses HMAC-SHA256 with a rotating secret, Stripe uses its standard `Stripe-Signature` header with timestamp tolerance. Unsigned or signature-failed webhooks are logged, dropped, and flagged to the Admin Head if >3 failures occur in 5 minutes (possible misconfiguration or attack). **No webhook-driven state change happens before signature verification succeeds** — this is a hard invariant.

**Webhook deduplication uses a 24-hour window** keyed on (gateway_provider, gateway_event_id). Providers retry webhooks on 5xx responses, and the same logical event often arrives 2–3 times; duplicate events are acknowledged (HTTP 200) but produce no state changes. After 24 hours the dedup key garbage collects.

**Payment-to-invoice matching rules.** A confirmed payment matches its invoice through the payment session's `invoice_id` foreign key — this is the primary path and is unambiguous because the session was created against a specific invoice. Fallback matching (for payments arriving without a session, which should never happen but is possible if a tenant customer uses an old payment link from an offline context) uses gateway metadata fields: reference, description, and amount matched against open invoices. Unmatched payments enter an `unmatched_payments` queue surfaced to HR/Finance as M16 tasks for manual reconciliation, never auto-applied to guesses.

**Partial payments are not supported through gateways in v1.** If an invoice is AED 1,500 and a gateway payment for AED 800 arrives, the session is flagged as `partial_mismatch` and surfaced to HR/Finance for manual decision. Rationale: partial payments on the manual path are already handled via Band 2 M08, but conflating manual partial logic with gateway partial logic creates reconciliation edge cases that v1 doesn't need. Tenants who need partial-by-gateway use the split-billing workaround (explicit multiple invoices, one link per partial).

**Overpayment handling.** If a gateway payment exceeds the invoice amount (possible with certain gateway flows where the payer enters the amount), the overage is credited to the guardian's account per the Band 2 credit rules (post-VAT, logged reason = `gateway_overpayment`). This is the only case where a gateway can produce a credit automatically; all other credits require Admin action with logged reason.

**VAT treatment is unchanged.** Gateway payments apply to invoices that already have VAT computed (Band 2 locked: VAT 5% post-discount, 5-year retention). The gateway handles the gross amount; Enrolla does not recalculate VAT on receipt. Gateway fees are tracked separately as a cost to the tenant, not deducted from the invoice amount shown to the guardian — a guardian paying AED 1,500 sees AED 1,500 as paid regardless of gateway fees.

**Tenant is in PCI scope zero.** Because all card entry happens on the gateway's hosted pages, Enrolla and every tenant using Enrolla is in PCI DSS "merchant that outsources card processing" category with no PAN storage obligations. This is a commercial requirement of the architecture and is non-negotiable — no custom card forms, no PAN logging, no card-on-file storage outside the gateway's own tokenisation systems.

**Gateway suspension during tenant Past Due / Suspended states.** When a tenant enters F.18 Past Due state, outbound payment link generation halts — tenants in Past Due cannot issue new payment links to their own customers because Enrolla is collecting payment via that same gateway account (in the case of Stripe Billing for the tenant's own subscription). When the tenant moves to Suspended, inbound webhooks are still accepted and logged but state changes are deferred until reactivation, so historical payments post-suspension don't get lost.

## Connects

Item 24 implements the F.16 Integration Framework contract — adapters, secrets vault, retry policy, circuit breaker, webhook inbound handling, and nightly reconciliation (Part 2). Part 1 reads from M08 Finance & Billing (Band 2) for invoice data and writes payment records back to M08. Payment link generation is surfaced in the M08 invoice detail page as a "Generate payment link" action. Successful payment events fire NOT.M08.INV_PAID (from REF-01) and trigger F.13 automations bound to the `payment.received` trigger type (status change). Failed payments fire NOT.M08.PAYMENT_FAILED. Gateway configuration lives in M20 Settings. The F.18 tenant lifecycle gates gateway operation on the tenant's commercial state. PL-05 (Item 28) exposes cross-tenant gateway health and transaction volume for platform observability. The same adapter infrastructure is used by F.18's billing path for collecting Enrolla's own subscription payments from tenants — the gateway code is shared but the merchant account configuration is separate (tenant-facing gateway vs. Enrolla-facing gateway are distinct adapter instances per tenant).

## Out of scope for Part 1

Auto-reconciliation beyond webhook-driven matching (Part 2 — covers the nightly reconciliation job against gateway state). Failed-payment retry logic and dunning (Part 2). Refund flow including partial refunds and dispute handling (Part 2). Gateway migration when a tenant switches providers (Part 2). Saved payment methods / card-on-file (Phase 2 — requires tenant consent flows and gateway-specific tokenisation schemes). Recurring subscription billing through gateways for tenant customers (Phase 2 — v1 uses recurring invoice generation in M08 + gateway payment link per invoice). Apple Pay / Google Pay (Phase 2, gateway-dependent). Split payments between two gateways (never — one gateway per tenant is an architectural lock). Multi-currency invoices where an invoice contains line items in different currencies (never — one currency per invoice, matching tenant-level lock). Fraud scoring beyond what gateways natively provide. Chargebacks/disputes (Part 2 surfaces the webhook event; full dispute management workflow is Phase 2). 3DS challenge handling UI (handled entirely inside gateway hosted pages, zero Enrolla involvement).

## UI specifics

**Gateway configuration page (M20 → Payment Gateway tab).** Card showing current gateway with provider name, currency, merchant ID (masked), enabled date, and health indicator (circuit state from F.16). If not configured, shows a setup wizard: pick provider → enter credentials → verify connection → select currency → confirm and activate. The verification step uses the adapter's `connect` capability from F.16 and displays success or the specific error from the provider. Credential entry fields route through a secure input component that writes directly to the F.16 vault and never logs the value.

**Invoice detail page — Payment Link section (M08 upgrade).** On any unpaid invoice, HR/Finance sees a "Generate payment link" button. Click generates a payment session, shows the link with copy button, shows expiry countdown, and displays a QR code rendering of the same link for in-person payment flows. A small "Regenerate" action cancels the current session and issues a new one, with reason prompt. Below the link, a timeline shows the session lifecycle: created → link sent → opened by customer (if gateway reports this) → succeeded/failed, with timestamps.

**Payment history tab (M08 upgrade).** Existing Band 2 payment history adds columns for gateway provider and reconciliation state. Click any gateway-sourced payment opens a drawer showing the full gateway event chain, signature verification result, raw payload (collapsed, expandable for HR/Finance and above), and the matching decision trace.

**Unmatched payments queue (M08 → Unmatched tab).** New surface listing gateway payments that could not be auto-matched to an invoice. Columns: received_at, amount, currency, gateway reference, gateway description. Row action: "Match to invoice" opens a picker filtered to the same currency and open invoices, requires reason on submit. Also: "Mark as non-invoice" for payments that are deposits or other non-invoice receipts, which moves the payment to a holding account for manual allocation later.

**Webhook event log (M20 → Integrations → Payment Gateway → Events).** Per-gateway event log with filters for event type, signature status, and processing outcome. Each row expandable to show raw payload. Bulk replay action for events with `unmatched` outcome (re-runs matching in case an invoice has since been created). Admin Head and above only; log entries retained 90 days then archived to cold storage.


---

# Item 24 — M08 Payment Gateway Integrations — Part 2

## Purpose

Part 1 built the happy path: configure a gateway, generate payment links, receive webhooks, match payments to invoices. Part 2 covers the four operational realities that turn a working integration into a trustworthy one — nightly reconciliation against gateway state (catches payments that succeeded externally but whose webhook never arrived), failed-payment retry and dunning (keeps failed payments from becoming silent revenue loss), refund flow (including partial refunds and the dispute/chargeback webhook path), and gateway migration (when a tenant switches providers, the architectural lock that "one gateway at a time" means for open invoices mid-flight).

## What to build

A **nightly reconciliation job** per tenant per gateway that queries the provider's transaction list for the previous 48 hours, compares each transaction to Enrolla's payment session records, and surfaces discrepancies. A **failed-payment retry system** that detects failed gateway payments, re-offers payment via a new session (same invoice, new link), and drives dunning notifications per configurable schedule. A **refund flow** supporting full and partial refunds initiated from the invoice or payment detail page, routed through the gateway adapter's refund capability, with dual sign-off for refunds above a threshold. A **dispute webhook handler** that captures chargeback events, freezes the associated invoice state, and creates a priority task for HR/Finance. A **gateway migration flow** invoked from M20 or PL-05 that transitions a tenant from one gateway to another without breaking in-flight payments.

## Data captured

**Reconciliation run record:** run_id, tenant_id, gateway_provider, run_started_at, run_completed_at, window_start, window_end, transactions_queried, matched_count, missing_in_enrolla_count, missing_in_gateway_count, discrepancy_count, outcome (`clean`|`discrepancies_found`|`failed`).

**Reconciliation finding:** finding_id, run_id, finding_type (`missing_webhook`|`amount_mismatch`|`status_mismatch`|`orphan_in_gateway`|`orphan_in_enrolla`), gateway_transaction_id, enrolla_session_id (nullable), expected_state, actual_state, task_id (M16 reference), resolution_state (`open`|`resolved`|`ignored`), resolved_by, resolved_at, resolution_notes.

**Dunning schedule (per failed payment):** schedule_id, invoice_id, failure_count, first_failed_at, last_attempt_at, next_attempt_at, status (`active`|`paused`|`exhausted`|`resolved`), max_attempts (default 3), notification_events_fired.

**Refund record:** refund_id, payment_id, invoice_id, amount, currency, refund_type (`full`|`partial`), gateway_refund_id, reason, initiated_by, initiated_at, approved_by (nullable, required if above threshold), gateway_status (`pending`|`succeeded`|`failed`), processed_at, notes.

**Dispute record:** dispute_id, payment_id, invoice_id, gateway_dispute_id, amount, currency, status (`warning_needs_response`|`needs_response`|`under_review`|`won`|`lost`|`accepted`), dispute_reason_code, evidence_due_by, created_at, resolved_at, notes.

**Gateway migration record:** migration_id, tenant_id, from_gateway, to_gateway, initiated_by, initiated_at, transition_start, transition_end, open_invoices_at_start (count), invoices_transitioned (count), status (`planned`|`in_progress`|`completed`|`cancelled`), notes.

## Rules

**Reconciliation cadence and window.** Runs once per tenant per gateway per night, default 02:00 local tenant time, configurable in M20. Query window is the previous 48 hours to catch webhooks that were delayed or dropped, with a 24-hour overlap against yesterday's run (intentional — idempotent processing means re-checking is free, missing a transaction is not). Tenants on high volume can request hourly reconciliation via Super Admin, but this is rare and not part of the default model.

**Reconciliation finding types and handling.** `missing_webhook` (gateway reports succeeded, Enrolla session is pending): the reconciliation job treats this as an authoritative confirmation, advances the session to succeeded, matches to invoice, fires the normal post-payment F.13 automations with a `late_reconciliation=true` flag so downstream code can distinguish fresh payments from reconciled ones. `amount_mismatch` (gateway and Enrolla disagree on amount): never auto-resolved — creates an M16 task assigned to HR/Finance with both values and the raw gateway payload. `orphan_in_gateway` (transaction in provider, no corresponding Enrolla session): creates an unmatched payment record per Part 1 rules. `orphan_in_enrolla` (Enrolla session shows pending for >48h with no gateway transaction): expires the session and releases the invoice for a new payment link. `status_mismatch` (e.g., refunded in gateway, succeeded in Enrolla): always an M16 task, never auto-changed.

**Dunning schedule.** On a failed gateway payment, the dunning schedule activates: attempt 1 at T+0 (the failure itself), attempt 2 at T+72h (new payment link generated, sent via REF-01 NOT.M08.PAYMENT_FAILED to guardian with retry link), attempt 3 at T+168h (day 7, final attempt, escalates to in-app notification to HR/Finance as well). After attempt 3 fails, the schedule moves to `exhausted`, the invoice remains unpaid, and normal overdue notifications take over (NOT.M08.INV_OVERDUE_7D, NOT.M08.INV_OVERDUE_14D). Dunning can be paused by HR/Finance (e.g., guardian requested alternative payment arrangement) with reason logged. Manual payment entry on the invoice resolves the dunning schedule with status `resolved`.

**Refund authorisation thresholds.** Refunds up to AED 500 (or USD 150) can be initiated and completed by HR/Finance solo with logged reason. Refunds above that threshold require dual sign-off: HR/Finance initiates, Admin Head or Super Admin approves. Partial refunds follow the same thresholds against the refund amount, not the original payment amount. Refund reasons are required on every refund with a controlled vocabulary (`service_cancelled`|`duplicate_payment`|`overpayment`|`dispute_settlement`|`goodwill`|`other_with_note`). The controlled vocabulary matters because it feeds reconciliation reporting and Zoho Books sync (Item 26).

**Refunds are post-VAT.** A refund of AED 500 on an invoice originally AED 500 gross (VAT-inclusive) returns the full gross amount. Partial refunds proportionally reduce both the net amount and the VAT component, and the Zoho Books sync (Item 26) pushes the adjustment as a credit note with proper VAT treatment. **Credits on the guardian account (from overpayment) and refunds to the gateway are two different flows** — credits stay inside Enrolla and apply to future invoices; refunds send money back through the gateway to the original payment method.

**Disputes freeze invoice state.** When a dispute webhook arrives from any of the three gateways, the associated invoice moves to a `disputed` sub-state (not a full status change — the underlying state remains "paid" until dispute resolution) and receives a visual marker. HR/Finance receives an immediate priority M16 task with the dispute deadline and the gateway's evidence submission URL. Enrolla does NOT build dispute evidence submission UI in v1 — disputes are handled inside the gateway's own dashboard, Enrolla just tracks them. On dispute resolution webhook (`won` or `lost`), the invoice state updates accordingly: `won` restores normal paid state, `lost` moves the invoice to a `chargeback_lost` state, reverses the payment, and triggers a task for HR/Finance to decide next action (re-invoice, write-off, collections).

**Gateway migration rules.** A tenant switching gateways goes through a controlled transition. At migration start: the old gateway is marked `migrating` in its config, no new payment sessions can be created against it, existing open payment links remain valid until their natural expiry (default 7 days), existing pending payment sessions can still receive webhooks. The new gateway is activated in parallel; from this point all new invoices generate payment links against the new gateway. The transition window is 14 days by default, configurable 7–30 days. At transition end: the old gateway's config is archived (not deleted — still needed for historical reconciliation and refunds), all in-flight sessions on the old gateway are expected to have reached terminal state, and any remaining open sessions generate a warning. **Refunds on historical payments always route through the original gateway**, regardless of which gateway is currently active — refund routing uses the payment record's `gateway_provider` field, not the tenant's current config.

**Circuit breaker interaction with reconciliation.** If the F.16 circuit breaker is open for a gateway, the reconciliation job waits until the circuit is closed or degraded-probing and retries. If the circuit remains open for >48 hours, the reconciliation run is marked `failed` with outcome `adapter_unavailable` and a platform notification fires to Super Admin. Missed reconciliation runs are retried on the next cycle with an extended window to cover the gap.

## Connects

Part 2 extends Part 1's F.16 adapter usage with the `reconcile` and refund capabilities. The reconciliation job uses F.16's retry and rate-limit infrastructure. Dunning uses Item 21 Part 1's scheduled action engine and REF-01's NOT.M08.PAYMENT_FAILED notification. Refunds integrate with M08 credit note flows from Band 2 (refund = gateway reversal + Band 2 credit note entry). Dispute handling creates tasks in M16. Gateway migration is surfaced as a Super Admin action in PL-05 (Item 28) and in M20 for tenants with Admin Head approval. Zoho Books sync (Item 26) consumes refund records and pushes credit notes back to Zoho with VAT adjustments. Reconciliation findings surface in M10 Management Dashboard as a count widget for HR/Finance.

## Out of scope

Automated dispute evidence submission (disputes are handled in the gateway's own dashboard; Enrolla only tracks them). Dispute evidence file upload or storage. Collections automation after chargeback_lost state (manual decision by HR/Finance in v1). Retroactive reconciliation of payments older than 90 days (runs only cover recent windows; deep reconciliation would need Super Admin tooling). Credit card surcharge handling (flat absorption by tenant per Part 1 rules — no pass-through surcharge in v1). Reconciliation across gateway migrations for the transition window beyond the standard 48-hour query window (edge cases here require manual investigation). Tokenised subscription migration between gateways (Phase 2 with saved payment methods).

## UI specifics

**Reconciliation dashboard (M08 → Reconciliation tab).** Latest run summary at the top: last run timestamp, outcome, finding counts by type. Table of recent runs with drill-down into findings. Each open finding has actions: Resolve (with resolution notes), Ignore (with reason, restricted to Admin Head), Create Task (creates M16 task if one wasn't auto-created). Filters by finding type and resolution state.

**Dunning view on invoice page.** On any invoice with an active dunning schedule, a panel shows: current attempt number, last failure reason, next retry time, pause action, and manual-resolve action (used when payment arrives through another channel).

**Refund action on payment detail.** Payment detail page adds a "Refund" button for gateway payments. Click opens a drawer: amount (full or partial with validation), reason (controlled vocabulary dropdown), notes field, submit. If amount is above the threshold, submit creates a pending refund requiring a second approver; the approver sees pending refunds in their M16 queue and the refund detail page. Refund state transitions (pending → processing → succeeded/failed) are visible on the payment timeline.

**Dispute view.** Invoices with disputes show a red banner with the dispute status, evidence deadline (if applicable), gateway dispute dashboard link, and a link to the priority task. Dispute history is preserved on the invoice even after resolution.

**Gateway migration wizard (M20 → Payment Gateway → Migrate).** Wizard: choose new provider → enter credentials → verify connection → set transition window → review impact (count of open invoices, pending sessions, active payment links) → confirm. The review step shows a clear warning: "Refunds on historical payments will continue to route through [old gateway]." After confirmation, a migration banner appears on the Payment Gateway page until the transition window ends, showing progress (days remaining, in-flight sessions count, invoices migrated count).


---

# Item 25 — M13 WhatsApp BSP Integration

## Purpose

Band 1/2 M13 uses copy-paste fallback for all WhatsApp outbound: the automation engine renders the message, drops it in the dispatch queue, an Admin user copies it into WhatsApp manually, sends it, and marks the queue entry as sent. This works and has been the deliberate architecture since Band 1 — zero BSP dependency, zero template approval blockers, zero session window complexity. Item 25 upgrades that to live BSP execution while keeping copy-paste as the permanent fallback. The upgrade requires: a BSP adapter contract that accommodates the four candidate providers (360dialog, Meta Cloud API, Twilio, MessageBird) without locking to one, a template approval workflow that respects the pre-approved template constraint every BSP enforces, 24-hour session window rules that distinguish template messages from session messages, inbound message capture for guardian replies, and keyword handling (STOP/UNSUBSCRIBE) that writes to the unsubscribe table from Item 21. **Jason has not selected a BSP** (per your Q7 answer) — Item 25 specifies the generic BSP contract, and the first concrete adapter is a tenant-onboarding decision, not a PRD decision.

## What to build

A **BSP adapter interface** (F.16-compliant) with four capabilities that map to BSP provider APIs: send template message, send session message, register template for approval, handle inbound webhook. Four **concrete adapter implementations** — one stub each for 360dialog, Meta Cloud API, Twilio, MessageBird — that share the interface, each with its own auth config, endpoint set, signature verification method, and template registration flow. A **template approval workflow** that tracks a template through states (draft → submitted → pending → approved → rejected → archived) matching how every BSP enforces approval before bulk sends. A **session window tracker** per (tenant, phone number) that records the last inbound message timestamp and gates session message sending to the 24-hour window after the latest inbound. A **keyword handler** for inbound messages that matches configured keywords (default: STOP, UNSUBSCRIBE, START, RESUBSCRIBE, HELP) and writes to the unsubscribe table from Item 21 or produces an automated help reply. An **inbound message view** surfacing guardian replies in a read-only inbox with reply-via-session-window capability.

## Data captured

**BSP configuration (per tenant):** tenant_id, provider (`360dialog`|`meta_cloud`|`twilio`|`messagebird`), provider_phone_number_id, api_key_secret_ref, webhook_secret_ref, display_phone_number (E.164), business_profile_name, enabled_at, status (`active`|`suspended`|`template_review_pending`).

**WhatsApp template:** template_id, tenant_id, name, category (`marketing`|`utility`|`authentication`), language, body, header_type (`none`|`text`|`image`|`document`), header_content, footer, buttons (array of `quick_reply`|`url`|`phone`), variables_list, approval_state (`draft`|`submitted`|`pending`|`approved`|`rejected`|`paused_by_bsp`), bsp_template_id, rejection_reason, submitted_at, approved_at, last_used_at.

**Session window state:** tenant_id, recipient_phone, last_inbound_at, session_expires_at (last_inbound + 24h), inbound_message_count_7d.

**Inbound WhatsApp message:** message_id, tenant_id, from_phone, guardian_id (resolved via M18), body, media_type (nullable), media_ref, received_at, matched_keyword (nullable), keyword_action_taken, processed (bool).

**Outbound WhatsApp dispatch (upgrade to Item 21 execution record):** adds whatsapp_message_type (`template`|`session`), bsp_message_id, delivery_state (`queued`|`sent`|`delivered`|`read`|`failed`), delivery_state_timestamps.

## Rules

**Provider is tenant-configured, not platform-locked.** Each tenant chooses one BSP provider at enablement time. Switching providers is possible but requires template re-approval on the new provider — every BSP maintains its own approval queue, and approvals do not transfer. The migration pattern is deliberate: pause outbound on the old provider → register and approve templates on the new provider → switch the config → old templates archived. Enrolla does not attempt cross-BSP template portability.

**Template-vs-session message distinction is load-bearing.** WhatsApp Business API enforces that any message sent outside a 24-hour window from the recipient's last inbound must use a pre-approved template. Inside the 24-hour window, free-form session messages are allowed. The Item 25 dispatch layer enforces this: every outbound message carries an explicit type, the dispatcher checks the session window state for the recipient, and a session message attempted outside the window automatically converts to the matching template if one exists, or fails with reason `session_window_closed` if no template is available. This conversion is non-optional and non-configurable — BSPs will suspend accounts that attempt session messages outside the window.

**Template approval is a user-visible process.** Templates submitted for BSP approval enter `pending` state and are visually distinct in the template library. Approval typically takes 1–24 hours at each BSP; Enrolla polls the BSP's template status endpoint every 15 minutes during the pending window and updates state on response. Rejection includes the BSP's rejection reason, and the tenant can edit and resubmit. **Templates cannot be used for dispatch until approval state is `approved`.** Rules referencing an unapproved template fall back to queue or fail with reason `template_not_approved` depending on rule mode.

**BSP category selection determines pricing and rules.** WhatsApp templates fall into three categories: `marketing` (promotional, highest cost, requires explicit opt-in, subject to stricter approval), `utility` (transactional, lower cost, more lenient approval), `authentication` (OTP codes, lowest cost but restricted content). Enrolla's catalogue classifies notifications by category at creation — appointment reminders are `utility`, promotional offers are `marketing`, OTP is `authentication`. The category affects how the BSP bills the tenant and is surfaced in the template library with a category badge. Misclassification is a BSP compliance issue: marking a marketing message as utility triggers BSP-level account action. Category is editable only in draft state, locked after first submission.

**Inbound message routing.** Every inbound message arrives via webhook to the F.16 gateway, gets signature-verified per the BSP's rules (each BSP has a different signature method — the adapter abstracts this), and is matched to a guardian via M18 phone lookup. Unmatched inbound phones (messages from numbers not linked to any guardian) are captured to a separate `unmatched_inbound` queue visible to Admin, which can link the message to an existing guardian or mark it as spam. Matched messages update the session window state and fire the keyword handler.

**Keyword handling.** Default keywords and actions: **STOP** / **UNSUBSCRIBE** writes an unsubscribe record (scope `all_marketing`, channel `whatsapp`, source `keyword`) and sends the auto-reply "You've been unsubscribed from marketing messages. Reply START to resubscribe." via a pre-approved utility template. **START** / **RESUBSCRIBE** reverses the most recent `all_marketing` whatsapp unsubscribe and sends a confirmation template. **HELP** sends an auto-reply template with contact info from tenant settings. Keywords are tenant-configurable in M20 (can add custom keywords, cannot remove STOP/UNSUBSCRIBE — regulatory requirement). Keyword matching is case-insensitive, whole-word, language-agnostic in v1 (English only per locked decision — Phase 2 adds localised keywords).

**Session reply interface.** Admin, HR/Finance, and Teacher roles can open an inbound message and reply within the 24-hour session window using free-form text. Replies outside the window fail with a prompt to use a template instead. Reply content is dispatched through the same F.16 adapter and recorded in the outbound execution log with type `session`. This is the only human-in-the-loop WhatsApp writing surface in v1 — all other outbound is automation-driven.

**BSP quota and rate limits.** Each BSP enforces its own rate limits (Meta Cloud: 80 messages/second after tier upgrades; others vary). The F.16 rate limiter per-tenant defaults are conservative (10/sec from F.16 base rules) and tenants can raise via M20 up to their BSP's documented limit, with the understanding that exceeding BSP limits suspends sending across the account. The per-channel monthly quota from Item 21 Part 2 layers on top: a tenant may be under BSP rate limit but over their Enrolla plan's monthly WhatsApp quota, which routes to queue per standard rules.

**Inbound message retention.** Inbound WhatsApp messages are retained for 90 days by default, then automatically archived with body text redacted and only metadata (from_phone, received_at, guardian_id, matched_keyword) preserved. This matches email retention patterns and limits storage liability for conversational content. Tenants can extend retention to 365 days via Super Admin with documented justification (some tenants may have regulatory reasons to retain conversational records longer).

**Template paused by BSP.** BSPs can pause a previously-approved template if it starts generating high block rates or complaint rates (Meta Cloud does this aggressively). Paused templates move to `paused_by_bsp` state, cannot be used for dispatch, and fire a platform notification to Admin Head. The tenant can edit and resubmit, or archive the template. Enrolla surfaces the pause reason from the BSP when available.

## Connects

Item 25 implements F.16 adapter contract for the WhatsApp channel, consumes Item 21 execution layer for outbound dispatch, writes to the unsubscribe table from Item 21 Part 2 on keyword handling, reads from M18 for phone-to-guardian resolution, and uses the F.17 OTP delivery path for parent portal OTPs (Item 27) via authentication-category templates. REF-01 notifications routed to the WhatsApp channel depend on this adapter for their live path — the full list of REF-01 rows showing WhatsApp in their channel column are the consumers. M13 template library (Band 2) is extended with the WhatsApp-specific template fields (category, approval state, BSP template ID). The inbound message view surfaces into M10 Management Dashboard as an unread-inbound count widget for Admin/HR-Finance.

## Out of scope

Broadcast list management as a separate entity (v1 uses F.14 segments + Item 21 campaign engine — there is no separate "broadcast list" concept). Outbound media messages beyond what templates natively support (template headers can be images/documents; free-form session media is Phase 2). WhatsApp group messaging (not supported by Business API for automation). Status/story posting. Voice and video calls. WhatsApp Payments integration (separate product, gateway-style handling would belong in Item 24 not Item 25). Chatbot flows beyond keyword responses (Phase 2 would add menu-driven flows). AI-generated template content at scale (F.12 AI budget model does not support per-dispatch generation — templates are authored manually in v1). Template localisation and multi-language variant management (v1 English only, structure exists for Phase 2). Reading disappeared messages, edited messages, or reaction events beyond storing the reaction. Cross-tenant template sharing.

## UI specifics

**BSP configuration wizard (M20 → WhatsApp tab).** Provider dropdown with four options, each showing a brief description and link to the provider's onboarding docs. Entering credentials routes to F.16 vault. Verify connection step shows the business profile name returned by the BSP as confirmation. If not configured, the tab shows a setup prompt and lists the copy-paste fallback mode as the current active path for WhatsApp dispatches.

**Template library upgrade (M13 → Templates → WhatsApp filter).** WhatsApp templates show approval state as a coloured pill (draft grey, submitted blue, pending amber, approved green, rejected red, paused_by_bsp red-outlined). Each template has a detail page showing the full body, variables, category, BSP template ID, approval history, last-used timestamp, and actions: edit (draft/rejected only), submit for approval (draft), archive, duplicate. Rejected templates show the BSP rejection reason prominently.

**Template submission drawer.** New template creation includes a category selector with clear guidance on when to use each category, a live preview showing how the message renders (BSP-style bubble preview with variables highlighted), variable list with sample values for preview, and a validation step that checks common rejection causes (missing variable context, forbidden words per category, excessive promotional language) before submission.

**Inbound message inbox (M13 → Inbound tab).** List view of recent inbound messages grouped by guardian, with unread indicators, keyword match badges, and message preview. Click a guardian to open a conversation view showing the message history and a reply composer. The reply composer displays a session window countdown (e.g., "16h 23m remaining"). If the window is closed, the composer is disabled with a prompt to send a template instead. Unmatched inbound messages appear in a separate section with a "Link to guardian" action.

**Session window indicator on guardian profile (M18).** M18 Guardian Profile shows a small WhatsApp status indicator: green dot with remaining time if inside the 24-hour window, grey if outside. Click opens the conversation view.

**Keyword management page (M20 → WhatsApp → Keywords).** Table of configured keywords with action, auto-reply template reference, and last-triggered timestamp. Add custom keyword action with controlled vocabulary (unsubscribe_all_marketing, unsubscribe_all, resubscribe, auto_reply_template). STOP and UNSUBSCRIBE are locked and shown with a padlock.


---

# Item 26 — M08 + M09 Zoho Books & Zoho People API Sync

## Purpose

IMI currently runs Zoho Books for accounting and Zoho People for HR. Band 1/2 M08 and M09 were built to operate independently — the platform handles invoicing, payments, staff records, leave, and performance without calling any Zoho API. Tenants move data to/from Zoho via manual CSV export and import. Item 26 adds bidirectional API sync as an additive path: tenants who bring their own Zoho Books and Zoho People organisations can OAuth into Enrolla, configure a sync mapping once, and run automated data flow in both directions. Critical constraint from your Q8 answer: **tenants bring their own Zoho orgs (BYO)** — Enrolla never hosts a central Zoho instance, never holds Zoho credentials, never becomes liable for Zoho data residency or billing. Each tenant OAuths into Enrolla, and Enrolla stores only the OAuth tokens through the F.16 secrets vault.

## What to build

A **Zoho Books adapter** implementing the F.16 contract with capabilities: push invoices, pull payments, push credit notes, push refunds, sync VAT report data, and run nightly reconciliation. A **Zoho People adapter** implementing the F.16 contract with capabilities: pull staff profiles, pull approved leave records, push leave approval decisions (when Enrolla is the system of record for leave), and run nightly reconciliation. A **Zoho OAuth flow** per adapter — two separate OAuth grants, because Zoho Books and Zoho People are different products with separate OAuth scopes and refresh token lifecycles. A **sync configuration UI** in M20 where Admin Head maps Enrolla entities to Zoho entities (chart of accounts, tax rates, departments, custom fields). A **sync schedule** with configurable frequency per direction per entity type. A **conflict resolution model** for cases where the same record has been updated on both sides between sync runs. An **error surfacing mechanism** that turns Zoho API errors into actionable tasks for HR/Finance.

## Data captured

**Zoho integration config:** tenant_id, product (`zoho_books`|`zoho_people`), zoho_org_id, oauth_token_ref (F.16 vault), oauth_refresh_token_ref, oauth_expires_at, oauth_scopes, enabled_at, status (`active`|`token_expired`|`suspended`), last_successful_sync_at.

**Zoho entity mapping:** mapping_id, tenant_id, product, enrolla_entity_type, enrolla_field, zoho_entity_type, zoho_field, zoho_field_id, transform (nullable, e.g. currency conversion rule), direction (`push`|`pull`|`both`), active.

**Sync run record:** run_id, tenant_id, product, run_type (`scheduled`|`manual`|`reconciliation`), direction (`push`|`pull`|`both`), started_at, completed_at, records_processed, records_pushed, records_pulled, records_conflicted, records_failed, outcome.

**Sync operation:** operation_id, run_id, enrolla_entity_id, zoho_entity_id (nullable if new), operation_type (`create`|`update`|`delete`|`noop`), direction, pre_state, post_state, outcome (`success`|`conflict`|`error`|`skipped`), error_code, zoho_response_ref.

**Sync conflict:** conflict_id, tenant_id, enrolla_entity_type, enrolla_entity_id, zoho_entity_id, enrolla_updated_at, zoho_updated_at, enrolla_values, zoho_values, resolution_state (`pending`|`resolved_enrolla_wins`|`resolved_zoho_wins`|`resolved_manual`|`ignored`), resolved_by, resolved_at, task_id (M16 reference).

## Rules

**Separate OAuth per product.** Zoho Books and Zoho People are configured independently, with separate OAuth flows, separate tokens, and separate enable/disable toggles. A tenant can run one without the other. OAuth scopes are minimum-necessary: `ZohoBooks.invoices.CREATE + READ`, `ZohoBooks.customerpayments.READ`, `ZohoBooks.creditnotes.CREATE` for Books; `ZohoPeople.employee.READ`, `ZohoPeople.leave.READ` for People. Broader scopes are refused at OAuth time even if Zoho offers them. Refresh token expiry triggers NOT.M13.CIRCUIT_OPEN-equivalent platform notification and marks the integration `token_expired` until re-OAuth.

**Zoho Books direction rules (per entity type):**
- **Invoices: Enrolla → Zoho (push only).** Enrolla is the system of record for invoicing. Invoices generated in M08 push to Zoho Books on creation (immediate for webhook-enabled tenants, nightly batch otherwise). Updates to invoices in Enrolla push corresponding updates. Invoices created in Zoho directly (outside Enrolla) are **not** pulled back — Enrolla ignores them, and this is surfaced as a mapping rule in the sync config.
- **Payments: Zoho → Enrolla (pull, with gateway webhook precedence).** Gateway payments (Item 24) are the primary path in Enrolla; they arrive via webhook and are authoritative. Manual payments recorded in Zoho Books (bank transfers reconciled by the accountant) are pulled into Enrolla on the sync schedule. Manual payments recorded in Enrolla push to Zoho as the secondary path. **Conflict rule: if the same payment exists in both sides with different amounts, Zoho wins for reconciled bank transactions, Enrolla wins for gateway-sourced payments.**
- **Credit notes: bidirectional.** Credit notes generated in Enrolla (from Item 24 refunds or Band 2 M08 credit actions) push to Zoho. Credit notes created in Zoho Books pull into Enrolla. Duplicate detection uses reference IDs stored on both sides.
- **VAT report data: Zoho → Enrolla (pull, read-only).** Enrolla pulls VAT summary data on request from Zoho for display in M10 management dashboard — tenants who run VAT in Zoho don't need to re-compute in Enrolla. Not a live sync; on-demand fetch triggered by dashboard view.

**Zoho People direction rules:**
- **Staff profiles: Zoho → Enrolla (pull primary).** For tenants using Zoho People as their HR system of record, staff profile updates flow from Zoho to Enrolla. Enrolla's M09 staff profile is treated as a downstream projection. Fields pulled: name, employee ID, department, role, employment status, employment type, start date, end date, manager (resolved to Enrolla user by email match). Fields NOT pulled: salary, bank details, emergency contacts (staying in Zoho for privacy), performance records (Enrolla M09 is system of record for performance).
- **Leave records: Zoho → Enrolla (pull primary).** Approved leave records pull from Zoho and block the corresponding timetable slots in M05. This is a critical operational flow — a teacher whose leave is approved in Zoho must have their M05 sessions flagged or reassigned. Leave status changes (approved → cancelled) reverse the block. Leave records created in Enrolla (if the tenant uses Enrolla leave flow instead of Zoho) push back to Zoho. Not both — tenant picks one source of truth for leave at integration enable.
- **Performance records: Enrolla → Zoho (push optional).** M09 performance data can optionally push to Zoho People as custom field updates. This is off by default and tenant-enabled in the sync config.

**Sync schedule defaults.** Zoho Books: invoices push immediately on creation (tenant-configurable to batched nightly), payments pull every 15 minutes, credit notes bidirectional every 30 minutes, nightly reconciliation at 03:00 tenant-local time. Zoho People: staff profile pull nightly at 01:00, leave records pull every 30 minutes, nightly reconciliation at 03:30 tenant-local time. All schedules tenant-configurable in M20 within bounds (min 5 minutes, max 24 hours).

**Conflict resolution model.** Sync operations detect conflict when both sides have been updated since the last successful sync of that record. Default resolution per entity type: invoices → Enrolla wins (Enrolla is SOR), payments → gateway-sourced wins, Zoho-reconciled wins otherwise, staff profiles → Zoho wins, leave → Zoho wins, credit notes → latest update wins with tie-break to Enrolla. Conflicts that don't fit default rules create an M16 task for HR/Finance with a resolution drawer showing both sides' values and an override picker. Conflict auto-resolutions are logged and surfaced in the sync run record for audit.

**Field mapping and transforms.** Default field mappings ship pre-configured for IMI-style tenants (standard Zoho Books chart of accounts, UAE tax rates, typical department structure). Tenants with custom Zoho configurations override mappings in M20. Transforms support: currency rounding rules, date format conversion, text truncation for fields with tighter limits on one side, enumeration value mapping (e.g., Enrolla's `full_time` → Zoho's `FullTime`). Custom transforms beyond the built-in set require Super Admin to add (v1 does not support tenant-written JavaScript transforms).

**Error handling.** Zoho API errors are categorised: `transient` (5xx, timeout, rate limit) retries per F.16 policy; `auth` (401, token expired) triggers re-OAuth flow and pauses sync; `validation` (400 with field errors) marks the operation failed and creates an M16 task with the Zoho error message and the affected record; `permission` (403) pauses the integration and alerts Admin Head. Error counts per category are tracked per sync run and displayed in the sync history.

**Privacy and data minimisation.** The Zoho People sync deliberately excludes sensitive fields (salary, bank, emergency contacts). This is a permanent constraint, not a configuration toggle — tenants cannot opt into pulling these fields into Enrolla because Enrolla is not designed as an HR system of record and should not hold this data. The exclusion is surfaced in the sync config UI with a lock icon on the excluded fields.

**Reconciliation finds what webhooks miss.** Nightly reconciliation runs for both products compare Enrolla state against Zoho state for the previous 48 hours, flag discrepancies, and create findings with the same model as Item 24 Part 2's reconciliation findings. This catches webhook drops, missed updates, and side-channel Zoho edits that the regular sync might have skipped.

## Connects

Item 26 implements the F.16 adapter contract for two new adapters. Reads/writes M08 Finance & Billing (Band 2) for invoice, payment, and credit note data. Reads/writes M09 Staff & Performance (Band 2) for staff profiles and leave. Updates M05 Timetabling when pulled leave records block slots. Surfaces sync errors as M16 tasks. Uses F.16 secrets vault for OAuth tokens. Pushes audit events to PL-05 (Item 28) for platform-level integration health visibility. Reconciliation findings feed M10 Management Dashboard. Refund records from Item 24 Part 2 are the source for credit notes pushed to Zoho Books.

## Out of scope

Zoho CRM integration (Enrolla M01 is the lead system — Zoho CRM sync is out of scope, and would conflict with the lead management flow). Zoho Projects, Zoho Desk, Zoho Analytics (not in scope — only Books and People). Zoho Books multi-branch sync for tenants with multiple Zoho branches (single branch per tenant in v1). Salary/payroll sync (explicit privacy exclusion). Bank transaction import from Zoho Books (manual reconciliation path only). Zoho Sign for DPA signing (Enrolla uses its own signing flow in PL-05). Bi-directional leave workflow where leave is requested in Enrolla and approved in Zoho and synced back (too many state-transition edge cases; v1 picks one SOR per tenant). Custom Zoho field sync beyond the pre-configured mapping set (Phase 2). Real-time push via Zoho webhooks beyond what the 15-minute schedule provides (Phase 2 where Zoho supports it).

## UI specifics

**Zoho integration page (M20 → Integrations → Zoho).** Two cards side by side: Zoho Books and Zoho People. Each card shows status, last sync, next scheduled sync, OAuth expiry date, and actions (configure, sync now, disable, re-authorise). Not-configured state shows an OAuth initiate button that opens the Zoho consent flow in a new window.

**Sync configuration detail (per product).** Tabs for: Entity Mappings (list of mapped entity types with direction and schedule), Field Mappings (per entity type, showing Enrolla field → Zoho field with transform), Conflict Rules (current defaults with override capability), Schedule (frequency per entity type). Changes to schedule or direction require reason and are logged.

**Sync history (per product).** Table of recent sync runs with outcome, counts, and duration. Click row opens drawer with per-operation breakdown, error list grouped by category, and conflict list with resolution actions.

**Conflict resolution drawer.** Shows both sides' values side-by-side with a visual diff highlighting differences. Options: accept Enrolla, accept Zoho, merge manually (for multi-field conflicts), ignore once, or create rule for similar conflicts. Resolution reason required.

**Sync error task in M16.** Errors from Zoho sync surface as tasks with a specialised view: the Zoho error message in plain text, the affected record with a link, suggested action based on error category, and a "Retry now" action for transient errors and "Mark resolved" action for validation errors the user has fixed in Zoho.


---

# Item 27 — Parent Portal (+ Student Portal sub-item)

## Purpose

Every locked decision in Bands 1–2 treats parents as data subjects Enrolla acts *on behalf of*, not users who log in. Communications flow outward (WhatsApp, email, now via Item 25's BSP), invoices flow outward (email with Item 24 payment links), progress reports flow outward (PDFs attached to messages). This architecture makes Bands 1–2 operable without any auth surface for parents — a deliberate simplification that keeps v1 focused on the centre-facing platform. Item 27 adds the guardian-facing login surface as a separate auth plane (F.17) and a parallel UI built around the data views guardians actually need: their linked students, current invoices, upcoming sessions, feedback, progress reports, and the conversation thread with the centre. The student portal sub-item reuses the same auth and data access plumbing with age-gated delegation and shorter sessions. Item 27 also **re-enables the "app inactive 14 days" churn signal** that was paused in v1 because there was no parent surface to measure activity against — once the portal exists, inactivity becomes a real signal that feeds the Band 2 M10 churn risk score.

## What to build

A **parent-facing web application** at `parent.<tenant-slug>.enrolla.app` (tenant-scoped subdomain), authenticating via F.17 phone-OTP primary with email magic link secondary, displaying a focused set of views for a guardian's linked students. A **student portal sub-application** at `student.<tenant-slug>.enrolla.app` that reuses auth surface and data model with age-gated rules: students under 13 inherit access via a guardian-delegated token, students 13+ can auth directly if their phone is captured on M17. A **guardian data access layer** that enforces strict row-level filtering — a guardian sees only their linked students, only their own invoices, only messages addressed to them, and nothing else in the tenant. A **session management view** so guardians can see and revoke active sessions on their own account. A **re-enabled churn signal feed** that tracks guardian portal activity (logins, page views, invoice opens, report downloads) and surfaces to M10 Management Dashboard's churn risk score.

## Data captured

**Parent session:** session_id, guardian_id, tenant_id, auth_method (`phone_otp`|`magic_link`), device_fingerprint, user_agent, ip_range, created_at, expires_at, last_activity_at, revoked_at (nullable), revoked_reason.

**Student session:** session_id, student_id, tenant_id, auth_mode (`delegated`|`direct`), delegating_guardian_id (nullable), device_fingerprint, created_at, expires_at (14 days default), last_activity_at.

**Portal activity event:** event_id, session_id, subject_type (`guardian`|`student`), subject_id, tenant_id, event_type (`login`|`view_dashboard`|`view_invoice`|`download_report`|`view_feedback`|`view_sessions`|`send_message`), event_target_id, timestamp.

**Guardian-student link view (read model):** guardian_id, linked_students (array of {student_id, student_name, department, year_group, relationship}), computed on login and cached per session.

**Portal inactivity state (re-enabled churn signal):** guardian_id, last_login_at, days_since_login, churn_signal_state (`active`|`dormant_7d`|`dormant_14d`|`dormant_30d`).

## Rules

**Auth surface is F.17, not F.4.** Parents and students never authenticate through the staff auth surface. Tokens are not interchangeable — a parent session cannot access staff endpoints and vice versa. This is enforced at the API gateway level as a hard separation, not a role check. Per F.17 rules: phone-OTP primary, magic link secondary, no passwords, no social OAuth, 30-day parent sessions, 14-day student sessions, session invalidation on M18 phone number change or guardian deletion.

**Row-level data access is the foundation.** Every query a guardian makes is filtered by `guardian_id = session.guardian_id` at the database access layer, not at the application layer. A guardian can physically only read rows tied to their guardian record. This is enforced through tenant-scoped row-level security policies (postgres RLS or equivalent), not through application code that might forget a WHERE clause. The student portal uses the same mechanism with `student_id = session.student_id` and additional rules for delegated sessions (delegated tokens carry the guardian_id and inherit guardian visibility).

**What a guardian sees:** their linked students' profiles (name, year group, department, photo — M17 data), upcoming sessions for linked students (M05, next 7 days), attendance records (M06, last 30 days), current term's feedback for linked students (M07 — published feedback only, drafts hidden), progress reports when published (M19 — published only, not in-progress), their own invoice list and history (M08), credit balance and transaction history on their guardian account, messages addressed to them (email/WhatsApp history with the centre — read-only archive from Item 25), active payment links (from Item 24 with QR/copy action).

**What a guardian never sees:** other guardians' data, other students' data even if in the same class, staff performance data (M09), tenant finance data beyond their own invoices (M08 tenant-level views), automation rules (M13), any admin-only surface, unpublished feedback or reports (draft state hidden), teacher personal info beyond name and subject, complaint records involving them unless the complaint is visible to the public side per Band 2 dual sign-off rules, raw notification logs.

**Student portal delegation rules.** Under 13: the student cannot have their own login. A guardian enables the student portal from their own portal view and receives a delegated access token that the student uses — the session is owned by the guardian, the student's identity determines the data scope, and all activity logs show the delegating guardian alongside the student. 13–17: either delegation (guardian-enabled) or direct auth (via student's own phone) is allowed; tenant configures the default in M20. 18+: direct auth only; guardians can no longer delegate (this matches the graduation lifecycle from PL-01 — post-18 students are data subjects in their own right).

**Student data access is narrower than guardian.** A student sees their own schedule, their own attendance, their own feedback (published), their own progress reports (published), their own assignments and grades from M14. They do NOT see: their invoices (that's the guardian's domain), other students' data, their guardian's notes, feedback drafts, the guardian-centre message thread. Students cannot submit payments or view financial data under any circumstance — v1 financial data is guardian-scoped only.

**Session activity counts as churn signal.** Every portal login, dashboard view, invoice open, or report download writes a portal activity event. The M10 churn risk score (Band 2) incorporates portal inactivity as a factor: a guardian who hasn't logged in for 14 days adds weight to the churn score (per the weights already defined in M10). The 14-day threshold matches the "app inactive 14 days" signal that was specified in Band 2 but paused until a parent surface existed. **Item 27 re-enables this signal without changing the M10 weights** — the signal simply starts producing non-zero values where it previously produced zero.

**Sessions are device-bound via soft heuristics.** Login creates a device fingerprint (user-agent + IP subnet). Significant deviation (different country, substantially different user-agent class like mobile → desktop) triggers re-auth on next request. Moderate deviation (same country, same device class, different IP in same ISP range) does not trigger re-auth but logs the event for the guardian's session view. Device binding is soft because parents share devices with spouses and use multiple devices legitimately.

**Account recovery has no password reset flow.** Parents with a working phone request a fresh OTP; parents with a working email request a magic link; parents with both lost contact the tenant who verifies identity against enrolment records and updates M18, which then accepts the new number/email. Enrolla platform staff cannot recover parent accounts — only the tenant can. This rule is locked in F.17 and mentioned here to reinforce that the parent portal does not introduce any exception path.

**Unsubscribe link honouring.** Parent portal shows an unsubscribe management view where guardians can view and change their own unsubscribe state per channel (from Item 21 Part 2's unsubscribe table). A guardian unsubscribing from "all marketing" here writes directly to the same table that keyword handling writes to from WhatsApp. **This is the only place in v1 where parents themselves can manage their communication preferences** — everywhere else, unsubscribes flow in from keywords or manual tenant action.

**Tenant suspension halts portal access.** When a tenant enters F.18 Suspended state, all parent and student portal sessions for that tenant are invalidated, and the portal shows a maintenance message directing parents to contact the centre. When the tenant returns to Active, sessions must be re-established — no session restoration across suspension. This is a deliberate safety measure: tenants in Suspended state should not be able to collect new payments or exchange messages with parents through Enrolla until the commercial state is resolved.

**Real-time updates are not a v1 promise.** The portal is not a live-update surface. Data changes on the centre side may take up to 60 seconds to reflect in the portal (matching the eventual consistency rules from F.16 webhook handling). A guardian refreshing the page sees the latest state; the portal does not push updates via websocket or SSE in v1. Phase 2 may add a limited set of push updates for payment confirmations and message receipts.

**Language: English only, phase 2 localisation structure exists.** The portal ships English-only per the locked platform decision. All strings are externalised into a locale file so Phase 2 localisation (likely Arabic first) is a data addition. This structure exists but produces no user-visible option in v1.

## Connects

Item 27 implements F.17 External Auth Surface, consumes M17 Student Profile and M18 Guardian Profile for the core data views, reads M05 sessions, M06 attendance, M07 feedback, M19 progress, M14 assignments, and M08 invoices with guardian scoping. Payment links surfaced in the portal are generated by Item 24. Message history shown is from Item 25's inbound store and the outbound execution log filtered to the guardian. Portal activity events feed M10 Management Dashboard churn risk score. Unsubscribe actions write to Item 21 Part 2's unsubscribe table. OTP delivery uses Item 25 BSP adapter (authentication category template) or email via F.16 email adapter. Session state and device fingerprinting interact with F.4 only in the sense of sharing no surface with it. Suspension behaviour enforced via F.18 tenant lifecycle.

## Out of scope

Native mobile apps (web portal only in v1 — F.9 constraint). Push notifications to mobile devices. In-portal video chat with staff or teachers. Assignment submission from the portal (M14 assignments are read-only for students in v1 — submission upload is Phase 2). Parent-to-parent messaging. Parent-configurable notification preferences beyond unsubscribe management (granular per-event preferences are Phase 2). Multiple concurrent guardians editing the same M18 profile (read-only for guardians; profile edits go through tenant admin). Payment method management / saved cards (aligned with Item 24 — no card-on-file in v1). Bulk invoice download as a zip. Exporting student data as a parent-initiated DSAR flow (DSAR requests go through M18's erasure/export path via tenant admin — parents don't self-serve DSARs in v1). Live chat widget. In-portal document upload (enrolment forms, ID verification, medical forms — Phase 2). Parent community features (forums, events, discussions). White-label branding beyond tenant logo and colour (full CSS branding is Phase 2). SSO into parent portal from tenant's own website (Phase 2).

## UI specifics

**Login screen.** Single phone number input with country code picker defaulting to the tenant's country, "Send code" button, and a secondary "Use email instead" link. After phone submission, OTP entry screen with 6-digit input, resend timer, and "Code not arriving? Use email" fallback. Tenant logo and branding colours from M20. Minimal UI — no marketing content, no footers with external links.

**Dashboard (landing view after login).** Top card shows today's activity: upcoming sessions in the next 48 hours for all linked students with teacher name and subject, current outstanding invoices with payment link buttons, unread messages count. Below, a student switcher (if multiple linked) and per-student preview cards with latest attendance status, last feedback summary, and latest progress snapshot.

**Student detail page.** Tabs: Overview (profile summary), Schedule (calendar view of upcoming and past sessions for the current term), Attendance (last 30 days with filter to full history), Feedback (published feedback entries chronologically, teacher-attributed), Reports (list of published progress reports with download), Assignments (read-only list with scores when graded).

**Invoices page.** List of invoices with status pill (unpaid / paid / overdue / partial) and amount. Click an invoice opens detail: line items, VAT, amount due, payment link with QR code (Item 24), payment history, download PDF action. Credit balance panel at top showing current credit and transaction history.

**Messages page.** Read-only archive of communications with the centre, combining outbound execution log (rendered messages sent to the guardian) and Item 25 inbound WhatsApp messages. Grouped chronologically. Not a composer — this is a history view. Phase 2 may add a reply composer.

**Account settings.** Edit email and phone (routes to M18 via tenant approval, not direct edit), communication preferences (unsubscribe management per channel), active sessions with revoke action, privacy info, and a "Contact the centre" action with the tenant's configured contact method.

**Student portal (separate UI).** Simpler layout focused on the student's own data. No invoice view, no guardian communication view. Schedule, attendance, feedback, reports, assignments. Visual design uses a slightly different colour palette to make it obvious which mode is active.


---

# Item 23 — M15 Inventory Management

## Purpose

IMI operates ~113 inventory items across 16 categories — stationery (folders, pens, erasers, stickers), branded materials (lanyards, tote bags), cleaning and hygiene, print and lamination, electronics, and more. Today this is tracked in spreadsheets and replenished reactively when someone notices a cupboard is empty. M15 moves inventory into Enrolla as a first-class module with three design principles established at spec time: **catalogue CRUD** (tenants manage their own item list, seeded from IMI's reference catalogue but fully editable), **per-item auto-deduct rules** (each item configurably deducts on specific enrolment events with department and year group scope), and **notification-driven operation** (the primary UX is the reorder alert stream fired when stock drops below reorder points, not a dashboard users proactively visit). IMI's reference data — 113 items, 12+ suppliers with contact info, per-item reorder thresholds, department scopes, and enrol triggers — seeds the tenant catalogue on first activation. Every field in the seed is editable afterwards. M15 is the "reactive operations" module: staff respond to alerts when reorder points breach, the reorder notification itself surfaces the supplier contact so whoever sees the alert can order immediately, and the module stays out of the way until it needs attention.

## What to build

An **inventory catalogue** entity (items, categories, suppliers) with full CRUD surfaced in M20 Tenant Settings under a new Inventory tab. A **stock ledger** that records every quantity change (deduction, addition, manual adjustment, stock-take correction) with actor, reason, and timestamp. An **auto-deduct engine** that subscribes to M04 Enrolment Lifecycle events and fires deductions against items whose rules match the enrolment's department, year group, and trigger condition. A **reorder notification system** that evaluates stock levels after every change, compares to the item's reorder point, and fires NOT.M15.REORDER_BREACH (new REF-01 addition) to the item's configured audience with the supplier contact, reorder quantity, and one-click ordering link for items with Amazon URLs. A **stock-take interface** for periodic manual reconciliation where staff count physical stock and the system calculates variance. A **supplier directory** that deduplicates contact info across items so updating a supplier phone number updates every item using that supplier. Seed data loader that imports IMI's 113-item reference catalogue on tenant activation.

## Data captured

**Inventory item:** item_id, tenant_id, name, category, unit (e.g. `pcs`, `box`, `pack`, `ream`), current_stock, min_stock (reorder point), max_stock (cap), reorder_qty, auto_deduct_enabled (bool), auto_deduct_rules (array), supplier_id (FK), amazon_link (nullable URL), notes, active (soft delete), created_at, updated_at.

**Auto-deduct rule:** rule_id, item_id, trigger_event (`enrolment_confirmed`|`enrolment_second_subject`|`assessment_booked`|`manual_only`|custom), department_scope (array of departments or `all`), year_group_scope (array of year groups or `all`), quantity, condition (optional predicate like "first enrolment only"), active.

**Inventory category:** category_id, tenant_id, name, display_order, active. Categories are tenant-owned and fully editable — the seed provides 16 categories matching IMI's structure but tenants add, rename, reorder, and deactivate freely.

**Supplier:** supplier_id, tenant_id, name, contact_name, phone, email, notes, active, created_at. Suppliers are a separate entity to deduplicate contact info — 40+ IMI items share three or four primary suppliers, and updating a contact once should update all items using that supplier.

**Stock ledger entry:** entry_id, item_id, tenant_id, change_type (`auto_deduct`|`manual_deduct`|`manual_add`|`stock_take_correction`|`reorder_received`|`waste`|`transfer`), quantity_change (signed), stock_before, stock_after, actor_id, trigger_reference (nullable — e.g. enrolment_id for auto_deduct), reason (nullable), timestamp.

**Stock-take session:** session_id, tenant_id, initiated_by, started_at, completed_at, status (`in_progress`|`completed`|`abandoned`), items_counted, variance_count, total_variance_value (nullable — if cost data available).

**Stock-take count:** count_id, session_id, item_id, system_quantity, counted_quantity, variance, notes.

**Reorder event:** event_id, item_id, fired_at, stock_at_firing, notification_sent (bool), acknowledged_by (nullable), acknowledged_at (nullable), resolution_state (`pending`|`ordered`|`received`|`ignored`).

## Rules

**Catalogue is fully tenant-owned after seeding.** On first activation of M15, the tenant's Admin Head triggers a seed import that loads the IMI reference catalogue (or declines the seed and starts empty). After seeding, every item, category, supplier, and rule is editable, deactivatable, or deletable. Items with active stock ledger entries cannot be hard-deleted — they soft-delete only, preserving historical ledger integrity. Items with no ledger history can be hard-deleted by Admin Head.

**Per-item auto-deduct rules with department and year-group scope.** Each item carries its own list of deduction rules, each rule pinned to a trigger event with scope filters. Example from IMI's seed: a folder item has rule `{trigger: enrolment_confirmed, department: Primary, year_group: KG1-Y6, quantity: 1, condition: first_enrolment_only}`. When a KG1 student's enrolment moves to confirmed state in M04, the engine evaluates all items with matching rules and fires deductions. Items can have multiple rules covering different scopes — a sticker item might deduct 2 for Primary enrolments and 1 for Secondary. Rules are tenant-editable in the item detail page.

**Auto-deduct fires on M04 state transitions, not on form submission.** The trigger is the enrolment lifecycle state change to `confirmed` (or whatever state the tenant configures), fired through F.13's status_change trigger type. This means duplicate auto-deductions are prevented by F.13's idempotency key — the same enrolment cannot deduct twice from the same item even if M04 fires the state event multiple times on retry. Failed auto-deductions (item out of stock, rule evaluation error) log to the stock ledger with change_type `auto_deduct_failed` and fire a notification to the inventory alert audience — they do not block the enrolment itself. **M15 never blocks M04**, even if the inventory says zero stock. The enrolment proceeds, the deduction is logged as failed, and a human decides whether to override or hold.

**Reorder notification cadence.** Every change to an item's stock triggers a re-evaluation. If `current_stock <= min_stock`, a reorder event is created and NOT.M15.REORDER_BREACH fires to the item's notification audience. **Rate limiting prevents alert fatigue**: once a reorder event is open for an item, no new notification fires for the same item until the event is resolved (resolution states: `ordered` flagged by the recipient, `received` when stock is added back above min, or `ignored` with reason). This prevents the system from spamming "still below reorder point" every time another deduction happens to an already-flagged item.

**Notification content includes the supplier contact inline.** The reorder notification body includes: item name and current stock vs. reorder point, supplier name and contact info (phone, email), reorder quantity suggestion, and if an Amazon link exists, a direct one-click link. The notification audience is role-configurable per item, defaulting to Admin Head + HR/Finance. Tenants can override to route specific categories to specific people (e.g., cleaning supplies → facilities person, electronics → IT person). This is set at the category level with per-item override.

**Stock-take flow.** A stock-take session is a dedicated workflow: the user initiates a session, walks through every item (or a filtered subset by category), enters physical counts, and on completion the system calculates variance per item and generates a correction ledger entry for each. Variance corrections are logged with change_type `stock_take_correction` and the session ID. Stock-takes cannot be partially abandoned with corrections applied — either the session completes and all counted corrections apply, or the session abandons and no corrections apply (the counted values are discarded).

**Unit definition is free-form per tenant.** Units (`pcs`, `box`, `pack`, `ream`, `bottle`, `kg`, etc.) are free-form strings per item, not a controlled enum. This matches how tenants actually think about inventory — IMI's seed uses whatever units IMI uses, and other tenants will use their own conventions. No unit conversion in v1 — if an item is tracked in "boxes" and someone physically receives "50 individual units," they convert manually before recording.

**Supplier deduplication.** Suppliers are a separate entity; items reference suppliers by ID. Editing a supplier's contact info updates every item using that supplier automatically. If a tenant has two items from the same supplier but with slightly different contact names (e.g., "Saeed" and "Saeed / Fortune"), they can merge suppliers via the supplier directory, which re-points every item's supplier_id to the canonical record and soft-deletes the duplicate.

**Cost data is optional.** M15 does not require per-item cost in v1. If tenants add cost, stock-take variance reports compute total variance value. If they don't, reports show only quantity variance. Cost is not pushed to Zoho Books (Item 26) or the finance module — M15 is operational, not financial. Tenants who need financial inventory accounting use Zoho Books directly.

**No multi-location inventory in v1.** All stock for an item is treated as a single pool per tenant. Tenants with multiple branches hold stock in one logical pool regardless of physical location. Multi-location tracking is Phase 2 and would require a location entity and per-location stock ledgers.

**Retroactive rule changes don't re-fire deductions.** If a tenant changes an auto-deduct rule (quantity, scope, trigger), the change applies only to future enrolment events. Historical enrolments that already deducted under the old rule are not re-deducted or refunded. Audit log captures the rule change with the old and new values.

**Waste and transfer entries.** Stock can be manually reduced for reasons other than deduction or stock-take — items broken in handling, items transferred to another location (in the tenant's own operations, not Enrolla-tracked), items expired. These use change_types `waste` and `transfer` with required reason fields. These entries count against stock but are tagged separately in reports so reorder-analysis can distinguish waste rate from actual consumption.

**REF-01 catalogue additions.** Item 23 adds two notifications to REF-01: **NOT.M15.REORDER_BREACH** (Ops category, tenant-configurable audience, in-app + email, Warning severity) and **NOT.M15.AUTO_DEDUCT_FAILED** (Ops category, Admin Head + HR/Finance default, in-app + email, Warning severity). This brings the total catalogue from 82 (after Item 21 Part 2 additions) to 84.

## Connects

M15 subscribes to M04 Enrolment Lifecycle events for auto-deduct triggers via F.13's status_change trigger type. Reorder notifications go through REF-01 and Item 21's dispatch layer. Supplier contact changes surface in the M15 supplier directory with no external dependency. M15 does not push to Zoho Books (Item 26) in v1 — cost data is optional and operational only. Stock-take sessions create M16 tasks on variance above a threshold (default 10% for Admin Head review). Seed data loads via FM02 Data Import Specification (Band 2) using a dedicated inventory schema — the IMI reference catalogue is the reference dataset for this schema. PL-05 (Item 28) shows per-tenant inventory item count and reorder event count as platform health signals.

## Out of scope

Multi-location stock (Phase 2). Per-item cost accounting with GL account mapping (tenants use Zoho Books for financial inventory). Purchase order generation (v1 surfaces supplier contact in notifications; the user places the order externally). Automated supplier ordering via API (Phase 2 — requires supplier-side integrations that don't exist). Inventory valuation methods (FIFO, LIFO, weighted average). Expiry date tracking per batch. Barcode or QR scanning for stock-take (Phase 2). Asset tracking (M15 is consumables; fixed-asset tracking is a separate concept not in scope for v1). Demand forecasting or usage prediction. Automatic reorder placement (requires integration or commerce partnership). Cross-tenant inventory visibility (never). Cost-of-goods calculations for invoices. Stock reservations (holding inventory for pending enrolments that haven't confirmed).

## UI specifics

**Inventory catalogue page (M20 → Inventory tab).** Table of all items with columns: name, category, current stock, reorder point, max stock, supplier, auto-deduct status, state (healthy / approaching reorder / below reorder). Filter chips for category and state. Search by name. Click row opens item detail drawer.

**Item detail drawer.** Shows all fields editable in place: name, category picker, unit, stock thresholds, supplier picker, auto-deduct toggle with rule list, Amazon link, notes. Stock ledger history tab showing last 100 entries with filter by change type. Reorder history tab showing past reorder events with resolution outcomes.

**Auto-deduct rule editor.** Within item detail, a list of rules with add/edit/delete. Each rule editor has: trigger event picker (defaults to enrolment_confirmed, other events from M04), department multi-select, year group multi-select, quantity, optional condition picker (first_enrolment_only, every_enrolment, nth_enrolment, custom). Preview shows "This rule will deduct {qty} when: {condition summary}."

**Reorder alert stream (M10 dashboard widget).** Management dashboard shows an Inventory widget listing current open reorder events grouped by category, with one-click actions to mark as ordered or ignored. Click an event opens the item detail with the supplier contact prominently displayed and the one-click Amazon link if available.

**Supplier directory (M20 → Inventory → Suppliers).** Table of suppliers with contact info. Edit updates all items using that supplier. Merge action consolidates duplicates. Soft-delete prevents deletion if items still reference the supplier.

**Stock-take wizard.** Launched from the catalogue page. Step 1: select scope (all items, by category, or custom list). Step 2: paginated count entry where each page shows 10-20 items with system quantity and an input for physical count. Step 3: review variance summary highlighting items with significant differences. Step 4: confirm and apply corrections. A stock-take session can be paused and resumed (unlike abandon — paused sessions retain their counted values for the initiating user).

**Seed import action (first-time M15 activation).** On first enabling M15, Admin Head sees a prompt: "Load IMI reference catalogue (113 items, 16 categories, 14 suppliers)?" with options Load / Start Empty / Load and Customise. Load and Customise walks through category and supplier review before applying the seed, allowing the tenant to skip items or rename categories before import.


---

# Item 28 — PL-05 Platform Admin Panel — Part 1

## Purpose

Every Band 3 decision has assumed PL-05 exists without specifying what it is. Foundation F.18 defined the commercial tenant model (lifecycle states, plans, feature flags, DPA versions, billing); Items 21–27 each added surface area that needed platform-level administration (quota dashboards, integration health, audit trails, impersonation); the "gated v1 provisioning" answer to Q11 put the entire tenant onboarding workflow inside PL-05. Item 28 is the UI and operational layer that makes Enrolla a multi-tenant commercial SaaS product — the internal Enrolla tool that Super Admins use to run the platform. Without PL-05, Enrolla has one tenant (IMI) and a bash script that creates new ones. With PL-05, Enrolla has a real provisioning flow, a real billing relationship with tenants, real feature flag governance, and a real support path. Item 28 moved to last position in the Band 3 sequence because writing it first would have forced rewrites as Items 21–27 added requirements; now the requirements are stable and PL-05 can be specified as the consolidation layer it actually is. Part 1 (this turn) covers tenant provisioning, subscription management, and feature flag administration. Part 2 (next turn) covers support impersonation, DPA version management, audit trail, and multi-tenant observability.

## What to build

A **platform admin application** at `admin.enrolla.app`, accessible only to Enrolla platform staff (Super Admin and platform roles defined below), with its own auth surface reusing F.4 staff auth patterns but scoped to the platform tier rather than any single tenant. A **tenant directory** listing every tenant on the platform with lifecycle state, plan, key health metrics, and actions. A **tenant provisioning wizard** that walks Super Admin through creating a new tenant from Prospect state through to active (or Trial). A **subscription management surface** showing every tenant's current plan, next billing event, payment state, and recent invoices issued by Enrolla to that tenant. A **plan editor** where Super Admin defines and maintains the platform's plan catalogue (Starter, Growth, Enterprise, and custom). A **feature flag administration surface** implementing F.18's three-scope model (platform, plan, tenant) with audit-logged overrides. A **platform staff role model** for who can do what inside PL-05 — a minimal hierarchy distinct from tenant RBAC.

## Data captured

**Platform staff user:** staff_id, email, name, platform_role (`super_admin`|`platform_admin`|`support`|`finance`|`observer`), status (`active`|`suspended`), created_at, last_login_at, mfa_enabled (bool, required for super_admin and platform_admin).

**Tenant registry (extends F.18):** tenant_id, slug, display_name, commercial_owner, lifecycle_state, plan_id, currency, country, created_at, activated_at, suspended_at, terminated_at, dpa_version_accepted, dpa_version_required, notes, health_summary (computed: circuit breakers open, quota warnings, integration errors, last activity).

**Subscription plan:** plan_id, name, display_order, base_price_monthly, base_price_annual, currency, included_student_count, overage_rate, included_modules (array of module IDs from the 15-module matrix), included_integrations (array), support_tier, dpa_version_required, description, active, created_at, updated_at.

**Tenant subscription:** subscription_id, tenant_id, plan_id, current_period_start, current_period_end, billing_mode (`gateway`|`manual_invoicing`), payment_method_ref (F.16 vault, nullable for manual), next_invoice_at, last_payment_at, past_due_since (nullable), renewal_policy (`auto`|`manual`), notes.

**Tenant invoice (Enrolla → tenant):** invoice_id, tenant_id, period_start, period_end, subtotal, overages, total, currency, status (`draft`|`sent`|`paid`|`past_due`|`voided`), gateway_session_id (nullable), sent_at, paid_at, due_at, line_items (array).

**Feature flag definition:** flag_key, name, description, scope_levels (`platform`|`plan`|`tenant` — one or more), default_state, module, introduced_in_band, deprecation_date (nullable).

**Feature flag state:** state_id, flag_key, scope (`platform`|`plan`|`tenant`), scope_id (nullable for platform), value (`on`|`off`), reason, expires_at (nullable), created_by, created_at.

**Provisioning session:** provisioning_id, prospect_name, contact_email, commercial_owner, target_plan, step (`prospect`|`dpa_sent`|`dpa_accepted`|`configuring`|`activating`|`completed`|`cancelled`), notes, created_by, created_at, completed_at.

## Rules

**Platform staff roles and hard boundaries.** Five roles: **Super Admin** (full access including tenant termination, plan creation, platform staff management — limited to 2–3 people at Anthropic scale equivalent), **Platform Admin** (tenant provisioning, plan assignment, feature flag management, but cannot terminate tenants or create new Super Admins), **Support** (read access to all tenants, impersonation with consent gates, cannot change billing or plans), **Finance** (subscription and invoice management, cannot change feature flags or impersonate), **Observer** (read-only across everything, for board/investor/auditor visibility). MFA is mandatory for Super Admin and Platform Admin. Role assignment is Super Admin only. **Platform staff are entirely separate from tenant staff** — a Super Admin has no tenant role and cannot appear in any tenant's user list; the platform tier is a different auth plane with different session rules (15-minute idle timeout, 8-hour absolute timeout, IP allowlist support).

**Tenant provisioning is Super Admin gated in v1.** Self-serve trial flow is specced here for Phase 2 activation but feature-flagged off at the platform level in v1 shipment. The gated flow: Platform Admin or Super Admin creates a Prospect record with commercial owner, target plan, and contact info → sends DPA via the platform's DPA delivery method (email with signing link, though actual signing integration is out of scope — v1 uses offline signing) → marks DPA accepted with uploaded reference → configures initial module toggles against the selected plan → creates first tenant Super Admin user with their email and issues an activation email → tenant Super Admin activates their account via the activation link → tenant enters Trial or Active state based on commercial terms. The provisioning session tracks progress through these steps and is resumable if the Super Admin closes the panel mid-flow.

**Plan catalogue is Super Admin only.** Plans are platform-level resources, not tenant-level. Creating, editing, or deactivating a plan is Super Admin only. Plan changes do not retroactively affect existing tenant subscriptions — a tenant on the Growth plan stays on their version of Growth until explicitly migrated. Plans track a `version` field so historical subscriptions reference the exact plan snapshot that was active when they subscribed. Custom plans for negotiated deals are created by Super Admin with a `custom=true` flag and are visible only in the tenant they were created for.

**Subscription state drives tenant lifecycle.** A tenant's F.18 lifecycle state is partly derived from subscription state: active subscription in good standing → Active lifecycle; failed payment → Past Due after dunning exhaustion; 14-day past due → auto-suspend unless Platform Admin intervenes; manual unpause requires Super Admin reason. Manual invoicing mode skips the gateway-driven automation and uses a 30-day grace period as established in F.18. **Subscription management happens through the same Item 24 gateway infrastructure pointed at Enrolla's merchant account** (per your Q10 answer) — the gateway adapter is reused, the difference is the merchant_id.

**Feature flags implement F.18's three-scope resolution.** A flag check at runtime evaluates in order: tenant-scope override (if present and not expired) → plan-scope state (from the tenant's current plan) → platform-scope state (global default). The first hit wins. Tenant-scope overrides require a reason field and default to 90-day expiry unless marked permanent. Platform-scope changes affect every tenant and require a "deploy to all tenants" confirmation with MFA step-up. Plan-scope changes affect every tenant on that plan at the next feature flag cache refresh (15-minute TTL).

**Feature flag categories govern approval flow.** Flags are tagged: **experimental** (beta features, default off, tenant-enable for early access), **standard** (stable features, plan-gated), **emergency** (kill switches for safety — disabling a feature in response to an incident, no approval required for Platform Admin to flip). Emergency flag flips are logged with severity and alert Super Admin by email regardless of working hours.

**Plan migration rules.** Moving a tenant from Plan A to Plan B requires explicit Super Admin action with reason, and takes effect at the start of the next billing period by default. Immediate migrations are possible with prorated billing calculated per the gateway's own proration logic. Downgrades that would remove modules currently in use trigger a warning listing the affected modules and data; the downgrade proceeds only on confirmation, and the removed modules enter a 30-day grace period where data is retained read-only for potential re-upgrade.

**Tenant actions require typed confirmation on destructive operations.** Terminating a tenant, changing a tenant's plan, disabling a module, and overriding a feature flag all require the Super Admin or Platform Admin to type the tenant slug to confirm. This pattern prevents accidental cross-tenant actions in a directory of 50+ tenants.

**Provisioning includes sensible module defaults per plan.** Each plan ships with a default module toggle matrix (Starter = core modules only, Growth = adds integrations, Enterprise = all modules + API access). During provisioning the Super Admin can override individual toggles before activation, with the overrides visible on the tenant detail page after activation so support staff can see which modules were custom-enabled at onboarding vs. added later.

## Connects

PL-05 Part 1 implements F.18 Commercial Tenant Model as its primary consumer — tenant lifecycle states, subscription plans, feature flags, and the three-scope flag resolution all live here. Billing flows through Item 24's payment gateway infrastructure pointed at Enrolla's merchant account. F.16 Integration Framework provides the secrets vault for platform staff credentials and Enrolla's own merchant account credentials. Platform staff auth reuses F.4 patterns at a different auth plane. Tenant impersonation (Part 2) uses F.4 session mechanics with audit hooks. Every tenant-level action taken in PL-05 writes to the platform audit trail (Part 2). Provisioning invokes FM02 Data Import (Band 2) for initial data seeding of tenants migrating from other systems. Feature flag evaluation happens at every module entry point across all 20 modules via a flag resolution service cached 15 minutes per tenant.

## Out of scope for Part 1

Support impersonation and consent gates (Part 2). DPA version management UI including signing and re-acceptance tracking (Part 2). Platform-level audit trail viewing and search (Part 2). Multi-tenant observability dashboard showing cross-tenant health, quota usage, error rates (Part 2). Incident response tooling (Part 2). Platform staff management UI (Part 2 — creation and role changes). Billing dispute handling between Enrolla and tenants (manual for v1, not built into PL-05). Commission tracking for sales-led deals (not in scope). Revenue reporting beyond MRR/ARR summaries (Phase 2 — tenants' finance data belongs to tenants). Legal document management beyond DPA (terms of service, SLAs, custom contracts are document references, not managed inside PL-05). Tenant-to-tenant comparison or benchmarking (never). White-label reseller hierarchies (Phase 3). Automated plan recommendation based on usage patterns (Phase 2).

## UI specifics

**Platform admin landing page.** Top cards show platform-level KPIs: total active tenants, MRR, tenants in Trial, tenants Past Due, tenants Suspended, open provisioning sessions, critical alerts count. Below, a filterable tenant directory table with columns: tenant name, slug, lifecycle state, plan, student count, MRR, created_at, health summary icon. Search by name or slug. Click row opens tenant detail.

**Tenant detail page — Overview tab.** Shows tenant header (name, slug, lifecycle state as a coloured pill, plan, commercial owner), key metrics (student count, staff count, active sessions, last activity), health panel (circuit breakers, quota warnings, integration errors), and a timeline of recent lifecycle events. Side panel with quick actions: change plan, suspend, terminate, impersonate (Part 2), view audit (Part 2).

**Tenant detail page — Subscription tab.** Current plan card with next billing date, amount, payment method, and plan change action. Invoice history table with status, amount, due date, paid date, and PDF download. Upcoming invoice preview showing calculated amount for the next period including any overages. Change payment method action (for gateway-billed tenants). Manual invoice creation action (for manual-billed tenants).

**Tenant detail page — Feature Flags tab.** List of all flags applicable to this tenant with their current resolved value and the scope that provided it (platform / plan / tenant). Flags overridden at tenant scope are highlighted. Override action opens a drawer: on/off toggle, reason field, expiry date picker (default 90 days, "Permanent" option). Reset to default action removes the tenant override. History sub-tab shows past overrides with actor, reason, and timestamps.

**Tenant provisioning wizard.** Launch from the platform landing page "New tenant" button. Steps: (1) Prospect info — commercial owner, contact email, display name, intended slug (validates uniqueness); (2) Plan selection — plan picker with module matrix preview; (3) DPA — acknowledge offline signing, upload signed PDF, enter signature date; (4) Module configuration — toggle matrix pre-filled from plan defaults, per-toggle override; (5) Initial user — first Super Admin email and name; (6) Review — full summary; (7) Activate — creates tenant, sends activation email, redirects to tenant detail page. Each step saves state so the session can be resumed.

**Plan catalogue page (Platform → Plans).** Table of all plans with name, status, base price, included students, MRR contribution (computed across subscribed tenants). Click row opens plan detail with full feature matrix, price schedule, and edit action (Super Admin only). Duplicate-as-custom action for creating negotiated variants.

**Plan editor.** Form-based editor: name, description, pricing, included student count, overage rate, module toggle matrix, integration toggle matrix, support tier picker, DPA version required. Save as new version if editing an active plan with subscribers — existing subscribers stay on their version until explicit migration.


---

# Item 28 — PL-05 Platform Admin Panel — Part 2

## Purpose

Part 1 built the commercial and configuration surface of PL-05: tenants, subscriptions, plans, flags. Part 2 builds the operational surface that makes PL-05 usable by a support team rather than a Super Admin poking at a database — impersonation for debugging tenant-reported issues, DPA version management so compliance isn't tracked in a spreadsheet, a searchable audit trail so "who changed what and when" is answerable, a multi-tenant observability dashboard so platform-level incidents are visible before tenants report them, and incident response tooling for the moment something breaks across multiple tenants at once. Part 2 also includes platform staff management, which Part 1 referenced but didn't build. Together Parts 1 and 2 close Item 28 and close Band 3.

## What to build

A **support impersonation flow** that lets authorised platform staff (Support, Platform Admin, Super Admin) temporarily assume a tenant user's session for debugging, with the tenant Super Admin notified and consent-gated when possible. A **DPA version manager** for authoring new DPA versions, tracking tenant acceptance matrix, and driving the re-acceptance workflow defined in F.18. A **platform audit trail** capturing every tenant-affecting action in PL-05 plus every security-sensitive action inside tenants (Super Admin logins, permission changes, exports, impersonation sessions). A **multi-tenant observability dashboard** aggregating F.16 adapter health, Item 21 quota usage, Item 24 payment gateway errors, Item 25 BSP template status, Item 26 sync failures, and F.12 AI budget across all tenants. An **incident response panel** for platform-wide kill switches and mass-notification tooling. A **platform staff management surface** for creating, role-changing, and deactivating Enrolla staff.

## Data captured

**Impersonation session:** impersonation_id, platform_staff_id, tenant_id, impersonated_user_id, impersonated_role, reason, consent_state (`not_required`|`pending`|`granted`|`denied`|`auto_granted_emergency`), started_at, ended_at, duration_seconds, actions_taken (count), session_terminated_by.

**DPA version:** dpa_version_id, version_number, version_hash, effective_date, file_ref, summary_of_changes, severity (`minor`|`major`|`critical`), created_by, created_at, superseded_by (nullable).

**DPA acceptance record:** acceptance_id, tenant_id, dpa_version_id, accepted_by (tenant Super Admin user_id), accepted_at, accepted_ip, signature_method (`in_app_acknowledgement`|`uploaded_signed_pdf`), evidence_ref.

**Platform audit event:** event_id, actor_type (`platform_staff`|`tenant_user`|`system`), actor_id, tenant_id (nullable for platform-scope events), action_type, action_target_type, action_target_id, pre_state (for mutations), post_state (for mutations), reason, ip, user_agent, timestamp, correlation_id (for linking related events).

**Observability metric snapshot:** snapshot_id, tenant_id (nullable for platform aggregate), metric_type, value, state (`ok`|`warning`|`critical`), captured_at.

**Incident record:** incident_id, title, severity (`sev1`|`sev2`|`sev3`), started_at, detected_at, resolved_at, affected_tenants (array or `all`), actions_taken (array of references to flag flips, mass notifications, etc), created_by, postmortem_ref.

**Mass notification:** notification_id, incident_id (nullable), subject, body, audience (`all_tenants`|`tenants_on_plan`|`tenants_with_integration`|`custom_list`), delivery_channel (`email`|`in_app`|`both`), sent_at, sent_by, delivery_count, acknowledgement_count.

## Rules

**Impersonation consent model.** Three consent states: **Not required** for Observer-equivalent read-only sessions where the platform staff is viewing data the tenant would see themselves and taking no actions — read-only impersonation still requires reason but not consent. **Pending → Granted/Denied** for interactive impersonation where the platform staff will take actions within the tenant; the tenant Super Admin receives an in-app and email notification with the platform staff's name, reason, and an Accept/Decline action with a 15-minute decision window. **Auto-granted emergency** for incidents where waiting for consent would harm the tenant (e.g., a locked-out Admin Head who can't consent because they can't log in) — emergency impersonation requires Super Admin approval at the platform level, a logged reason referencing the incident ID, and fires an immediate notification to the tenant Super Admin's backup contact.

**Impersonation sessions are hard-bounded.** Maximum duration 60 minutes, non-renewable within the same session (re-impersonation requires a new session and new consent). All actions taken during impersonation are tagged in the audit log with both the platform staff ID and the impersonated user ID — attribution is dual, never collapsed to one. Impersonating users cannot: change passwords, export data, delete records, issue refunds, or trigger platform-level operations. These are hard restrictions at the API gateway, enforced regardless of the impersonated user's own role. This list is the v1 lock — Phase 2 may narrow or expand it based on operational need.

**DPA version lifecycle.** Super Admin creates a new DPA version by uploading the document, entering a version number, summary of changes, and severity. On publication, the version becomes the "current" version. **Minor** changes (clarifications, typos) do not require tenant re-acceptance — existing acceptance records remain valid, but tenants are notified of the new version via in-app notification. **Major** changes require re-acceptance within 30 days; tenants move to a "DPA Pending" flag state after 30 days (from F.18) which gates sensitive actions until resolved. **Critical** changes (new sub-processors, data location changes) require re-acceptance within 30 days and non-accepting tenants move to read-only mode after the window, matching F.18's rule.

**DPA acceptance evidence is retained permanently.** DPA acceptance records never delete, even after tenant termination (F.18 termination purges tenant data but retains audit records including DPA history). Acceptance evidence includes the accepting user ID, timestamp, IP, signature method, and for uploaded-PDF methods the file reference with the signing user's full name and signature date.

**Audit trail scope.** Every mutation inside PL-05 writes an audit event. Every tenant Super Admin login writes an audit event. Every permission change inside a tenant (role assignment, permission grant) writes an event visible at platform level. Every data export from any tenant writes an event. Every impersonation session — start and end — writes an event. Every feature flag change writes an event. Every subscription or plan change writes an event. The audit log is append-only — there is no delete action even for Super Admin, and no edit action at all. The log is searchable by actor, tenant, action type, time window, and correlation ID.

**Audit retention.** Platform audit events are retained for 7 years to match legal audit requirements and exceed the 5-year UAE financial retention locked in Band 1. Retention is non-configurable at the tenant level — tenants cannot request audit deletion even via DSAR, because audit records are platform-level evidence of platform-level actions and do not fall under tenant data subject rights.

**Observability refresh and thresholds.** Observability metrics refresh every 60 seconds from each source subsystem (F.16 adapter state, F.12 AI usage, Item 21 quota counters, Item 24 gateway health, Item 25 BSP template status, Item 26 Zoho sync errors). Each metric has platform-wide thresholds defined by Super Admin: warning threshold fires a platform notification to Platform Admin, critical threshold fires to Super Admin and activates the incident panel. Metrics are aggregated across tenants for platform-wide views and per-tenant for targeted investigation.

**Incident response flow.** A platform staff member declares an incident from the observability dashboard or directly via the incident panel. Declaration captures title, severity, and affected scope. Active incidents show a banner across PL-05 for all platform staff. Actions during the incident — flag flips, mass notifications, tenant communications — are tagged to the incident ID for post-hoc review. Incident closure requires a resolution note and optional postmortem reference. **Incident declaration does not automatically notify tenants** — mass notification is an explicit separate action, because premature "we have a problem" messages damage trust more than short delays.

**Mass notification rules.** A mass notification targets a tenant audience (all, by plan, by integration, or custom list of tenant slugs). Delivery is in-app to the tenant Super Admin's platform notification queue and optionally email. **Mass notifications bypass tenant notification preferences** because they are platform-level operational communications, not tenant-configurable content — a tenant cannot opt out of "WhatsApp BSP outage" or "scheduled maintenance window." Delivery counts and acknowledgement counts are tracked per notification for post-incident analysis.

**Platform staff management.** Creating a new platform staff member is Super Admin only, requires an email, role, and reason. The new staff member receives an activation email with an MFA setup requirement before first login (for roles that require MFA). Role changes are logged to the audit trail. Deactivating a platform staff member invalidates all their sessions immediately, ends any active impersonation sessions they were running, and prevents re-login. Hard-deletion of platform staff is not supported — deactivated records remain in the audit trail permanently.

**Kill switches for emergency.** Emergency flags — a pre-defined set of platform-level flags that disable risky functionality instantly — include: `disable_all_outbound_whatsapp`, `disable_all_outbound_email`, `disable_all_payment_gateway_outbound`, `disable_ai_features`, `disable_data_exports`, `disable_new_tenant_provisioning`, `freeze_all_automation_rules`. Each flip requires reason and logs to audit, but does not require approval — Platform Admin can flip emergency flags alone, because requiring approval during an incident defeats the purpose of a kill switch. Super Admin is notified of every emergency flag flip by email within 60 seconds.

## Connects

Part 2 consolidates every Band 3 observability signal into a single surface. Impersonation uses F.4 session mechanics at a different auth plane with audit hooks. DPA version management writes to F.18 tenant DPA state. The audit trail receives events from every PL-05 action (both parts), from tenant Super Admin sensitive actions (F.4 login events, M09 role changes, M20 sensitive settings changes), and from every integration event (F.16 adapter state changes, Item 24 gateway events, Item 25 BSP events, Item 26 Zoho sync events). Observability reads from F.16, F.12, Item 21 quotas, Item 24, Item 25, Item 26. Incident response can flip any feature flag from Part 1's three-scope model and dispatch mass notifications through a dedicated channel that does not use tenant BSP configurations (because a BSP outage can't be communicated through the BSP that's down — mass notifications use Enrolla's own email infrastructure via F.16 email adapter). Platform staff management extends the role model from Part 1.

## Out of scope

Automated incident detection and auto-declaration from metric thresholds — Phase 2; v1 requires human declaration. Automated postmortem generation from audit logs. SLA tracking and breach reporting per tenant (Phase 2). Tenant-facing status page hosted by Enrolla (Phase 2 — v1 uses mass notifications instead). Audit log real-time streaming to tenant SIEM systems (Phase 3 enterprise feature). Automated retention policy enforcement beyond the 7-year rule (if rules change, manual migration). Impersonation across tenant boundaries simultaneously (one impersonation session targets one tenant). Shared impersonation sessions where two platform staff collaborate in the same tenant session. Session recording / screen replay of impersonation (Phase 2). AI-assisted incident response suggestions. Automated compliance reports beyond what the audit log natively produces.

## UI specifics

**Impersonation launch.** From any tenant detail page, Support/Platform Admin/Super Admin sees an "Impersonate" button. Click opens a drawer: user picker (searches the tenant's active users), reason field, mode selector (read-only / interactive / emergency). Interactive mode sends the consent request to the tenant Super Admin and shows a countdown until response. On approval, a new browser tab opens into the tenant's UI as the impersonated user with a persistent red banner "IMPERSONATING {user_name} — session ends in {countdown} — End session".

**Impersonation active banner.** Inside the impersonated tenant view, the red banner is locked to the top of every page with the staff member's name, the impersonated user's name, elapsed time, remaining time, and an "End session" button. The banner cannot be dismissed. Clicking "End session" terminates the session immediately and returns to PL-05 with a brief summary.

**DPA version manager.** List of all DPA versions with version number, effective date, severity, acceptance count (tenants currently accepted / total tenants). Click version opens detail: document preview, changes summary, acceptance matrix table (tenant × accepted/pending/overdue). Action: "Publish new version" launches a wizard to upload the new document, enter metadata, and confirm publication.

**Audit trail search.** Search interface with fields: actor (platform staff or tenant user), tenant, action type (multi-select from catalogue), date range, correlation ID, free-text reason search. Results paginated, 50 per page, with per-row expansion showing pre/post state for mutations. Export to CSV for compliance review (exports are themselves audit events).

**Observability dashboard.** Grid of metric cards grouped by system: Integrations (F.16 adapter states per tenant), Payments (gateway health), Messaging (BSP template status, email deliverability), HR Sync (Zoho error rates), AI (F.12 budget usage across tenants), Quotas (Item 21 per-channel). Each card shows current state, trend sparkline, and a "Drill in" action revealing the per-tenant breakdown. Platform-wide incidents are banner-level on this page.

**Incident panel.** Active incidents list with severity pill, elapsed time, affected tenant count. Click incident opens detail with action timeline, current active kill switches, mass notification history, and a "Take action" menu (flip kill switch, send mass notification, update incident). "Declare incident" button in the top nav visible to all platform staff — declaring requires title, severity, scope.

**Mass notification composer.** Standalone composer with audience picker (all / plan / integration / custom slug list showing resolved recipient count), subject, body, channel selector, optional incident ID link, preview, send. Post-send, delivery status dashboard shows per-tenant delivery state.

**Platform staff management.** Table of platform staff with role, status, MFA state, last login, created at. Actions: invite new staff, change role (Super Admin only), deactivate, view audit (filtered to this actor).


---

# Band 3 Closing — Consistency Notes and Catalogue Reconciliation

**Band 3 status: complete.** All 8 items (21–28), 3 Foundations (F.16–F.18), and the initial write of REF-01's 80-row catalogue are specified end-to-end. Document total: ~24,600 words across 11 item parts (Items 21, 24, and 28 split across two parts each as planned).

**Foundation load-bearing verification.** F.16 is referenced by every integration item (24, 25, 26, 27 via OTP delivery, 28 for secrets vault management). F.17 is referenced by Items 25 (OTP template routing) and 27 (parent/student auth surface). F.18 is referenced by Items 21 (quota gating), 24 (tenant subscription billing flow), 27 (session invalidation on suspension), and 28 (tenant lifecycle as the primary consumer). No Foundation is vestigial.

**REF-01 catalogue reconciliation.** The Item 22 table ships with 80 notifications as originally enumerated. Two subsequent items added four notifications as prose additions within their own spec: Item 21 Part 2 added `NOT.PL.DISPATCH_QUOTA_80PCT` and `NOT.PL.DISPATCH_QUOTA_EXCEEDED` (both System-locked Platform-category). Item 23 added `NOT.M15.REORDER_BREACH` and `NOT.M15.AUTO_DEDUCT_FAILED` (both Ops category, tenant-configurable audience). **Final catalogue count for v1 is therefore 84 notifications.** These four additions are tracked in the session state delta rather than retroactively inserted into the Item 22 table to preserve the write order and traceability of how the catalogue grew during specification.

**Cross-reference verification.** Every "covered in Part 2" forward reference from Parts 1 of Items 21, 24, and 28 is actually delivered in the corresponding Part 2 — verified: automation campaign dispatch (21.2), reconciliation/refunds/migration (24.2), impersonation/DPA/audit/observability (28.2). Every item's Connects section references only previously-specified Foundations, Band 1/2 modules, or other Band 3 items — no dangling references.

**What Band 3 intentionally did not resolve.** Three classes of items are flagged explicitly as "Developer Handoff Package" territory, not further PRD writing: (1) ERD diagramming for the roughly 75+ new entities introduced across Bands 1–3; (2) API endpoint contracts with payload/response schemas; (3) UI wireframes beyond the text-only UI specifics sections. A full session state delta for Band 3 is published as `session_state_delta_band3.md` at `/mnt/user-data/outputs/` covering all decisions locked, all open items, and the Developer Handoff Package scope.

*End of Band 3.*
