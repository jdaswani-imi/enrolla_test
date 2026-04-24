---
module: "PL-05"
title: "Platform Administration"
layer: "Foundation"
folder: "01_Foundation"
status: "Draft"
phase: "v1"
dependencies: ["PL-01", "PL-03", "PL-04"]
tags: [enrolla, prd, foundation, admin]
---

# ENROLLA
# [[01_Foundation-PL05_Platform_Admin|PL-05]] — Platform Admin Panel
v1.0 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

This document defines the Enrolla Platform Admin Panel — the internal tooling layer that sits above all tenants. It is operated exclusively by Enrolla staff to provision tenants, manage subscriptions, provide support access, monitor platform health, and manage the underlying infrastructure. No tenant user at any role level has access to the Platform Admin Panel.

| **Property** | **Value** |
|---|---|
| Module code | [[01_Foundation-PL05_Platform_Admin|PL-05]] |
| Version | v1.0 |
| Status | Draft |
| Dependencies | [[01_Foundation-PL01_Platform_Architecture|PL-01]], [[01_Foundation-PL03_Data_Privacy|PL-03]], [[01_Foundation-PL04_Security_Access|PL-04]] |
| Phase | v1 |

---

# 1. Architecture

The Platform Admin Panel is a separate application from the tenant-facing Enrolla platform. It shares the same underlying database but accesses it via a dedicated service layer with its own authentication, rate limiting, and audit trail. All platform admin actions bypass tenant_id scope by design — this is the only context in which cross-tenant data access is permitted.

| **Element** | **Specification** |
|---|---|
| Separation | The Platform Admin Panel is served from a different domain and deployment than the tenant-facing application. The two cannot be accessed via the same session or credential. |
| Authentication | Platform admin accounts are managed separately from tenant accounts. A platform admin account cannot be used to log into any tenant. A tenant Super Admin account cannot be used to access the Platform Admin Panel. |
| MFA requirement | Multi-factor authentication is mandatory for all Platform Admin Panel accounts. No exceptions. TOTP (time-based one-time password) is the supported MFA method. |
| Audit trail | All Platform Admin Panel actions are written to a separate platform-level audit trail, distinct from tenant audit trails. Includes: which tenant was accessed, which records were viewed or modified, by which platform admin, at what time. The platform-level audit trail is immutable and retained permanently. |
| Tenant data access notification | When a platform admin accesses tenant data for support purposes, a support access event is logged on both the platform-level audit trail and the affected tenant's audit trail. The tenant Super Admin is notified. |
| IP restriction | Platform Admin Panel access is restricted to a whitelist of IP addresses. Access attempts from outside the whitelist are rejected regardless of credentials. |

---

# 2. Tenant Management

The Tenant Management section is where new tenants are provisioned, existing tenants are managed, and tenant lifecycle events are handled.

## 2.1 Tenant Provisioning

| **Element** | **Detail** |
|---|---|
| Create new tenant | Platform admin creates a new tenant record: organisation name, legal name, primary contact email, plan tier, billing start date, and org slug (used in the tenant URL). The org slug is unique across the platform and cannot be changed after first use. |
| Trigger onboarding wizard | On tenant creation, the system generates an Org Owner account with a one-time invite link. The invite link is sent to the primary contact email. The Org Owner activates the account and begins the [[09_Settings-M20_Tenant_Settings|[[09_Settings-M20_Tenant_Settings|M20]].A]] onboarding wizard. |
| Test window | A 14-day test window begins from the moment the Org Owner activates their account. During this window, test records do not lock the Student ID format or invoice sequence. |
| DPA attachment | The current version of the Enrolla Data Processing Agreement is attached to the tenant record at provisioning. The DPA version is locked to the version current at provisioning time. |
| Plan tier assignment | Each tenant is assigned a plan tier at provisioning. The plan tier determines feature availability and usage limits. |

## 2.2 Tenant List View

| **Element** | **Detail** |
|---|---|
| Columns | Tenant name, org slug, plan tier, status (Active / Trial / Suspended / Off-boarded), Org Owner email, go-live date, student count, staff count, last login (any user), last Super Admin login |
| Status filters | Active, Trial, Suspended, Off-boarded. Default view: Active and Trial. |
| Quick actions | Open tenant detail, suspend tenant, send DPA re-confirmation request, reset Org Owner password |
| Search | By org name, org slug, Org Owner email, or student count range |

## 2.3 Tenant Detail View

| **Tab** | **Content** |
|---|---|
| Overview | Org name, legal name, plan tier, status, go-live date, DPA acceptance records (Stage 1 and Stage 10 timestamps), billing contact, primary contact |
| Usage | Current student count, staff count, active enrolments, sessions scheduled this month, invoices issued this month, storage used |
| Billing | Plan tier, billing start date, next billing date, invoice history (platform-level subscription invoices, not tenant invoices), payment method on file |
| Support | All support access events for this tenant: which platform admin accessed, what they accessed, timestamp. Read-only view of tenant configuration for support purposes. |
| Audit | Platform-level audit entries for this tenant: tenant creation, plan changes, suspensions, DPA events, support access |

> **DPA Non-Confirmation:** Auto-suspension for DPA non-confirmation is not active in v1. This is a known operational limitation. Super Admin receives an in-app notification if DPA confirmation is outstanding after 30 days of onboarding. Manual suspension must be applied by the Enrolla platform team if required.

---

# 3. Subscription and Billing

Enrolla charges tenants a subscription fee for platform access. This section covers the platform's own billing of tenants — not the tenant-level billing of students and guardians (which is [[06_Finance-M08_Finance_Billing|M08]]).

| **Element** | **Detail** |
|---|---|
| Plan tiers | Defined and managed in the Platform Admin Panel. Each plan tier specifies: monthly or annual price, student limit, staff limit, branch limit, feature availability, and support level. |
| Billing cycle | Monthly or annual. Configured per tenant at provisioning. Annual plans receive a configurable discount. |
| Invoice generation | The platform generates a subscription invoice for each tenant on their billing date. Subscription invoices are issued to the billing contact email. |
| Payment methods | Bank transfer (primary for v1). Card-on-file is Phase 2. |
| Plan upgrades | Platform admin can upgrade a tenant's plan at any time. Upgrade takes effect immediately. Pro-rata billing is applied for the current billing period. |
| Plan downgrades | Platform admin can downgrade a plan. Downgrade takes effect at the next billing cycle. If the tenant's current usage exceeds the new plan limits, a warning is shown and the downgrade is blocked until the tenant reduces usage. |
| Trial period | A trial period (duration configurable per plan tier) can be granted at provisioning. During trial, the subscription fee is waived. On trial end, billing begins automatically with a notification to the billing contact 7 days before. |

---

# 4. Support Access

Enrolla staff may need to access a tenant's data to investigate and resolve support issues. Support access is controlled, logged, and notified to the tenant. It is never silent.

| **Element** | **Detail** |
|---|---|
| Initiation | Platform admin opens a support session from the Tenant Detail View. A reason for access must be provided before access is granted. The reason is logged permanently. |
| Access level | Support access grants read-only view of all tenant data by default. Write access (to fix data issues) requires a second platform admin to approve the write access request. Both approvals are logged. |
| No impersonation | Platform admin impersonation is not available. Platform admins use direct, authenticated, read-only database access for debugging. Write access to the production database requires a separate elevated approval process outside the Platform Admin Panel. |
| Session duration | Support access sessions automatically expire after 2 hours. The session cannot be extended without re-initiating with a new reason. |
| Tenant notification | In-app notification to tenant Super Admin on access start. Email notification sent within 5 minutes of access start. Notification includes: Enrolla staff name, access reason, data accessed (module list), start timestamp. |
| Tenant opt-out | Tenants cannot opt out of support access — it is a condition of the platform service agreement. Tenants can see every access event in their audit trail and can request a full support access log at any time. |

---

# 5. Platform Health Monitoring

The Platform Admin Panel includes a health monitoring dashboard providing real-time visibility of platform performance, error rates, and usage across all tenants.

| **Metric** | **Detail** |
|---|---|
| System status | Overall platform status: Operational, Degraded, Partial Outage, Major Outage. Updated in real time. Feeds the public status page. |
| Error rate | API error rate (4xx and 5xx) per minute across all tenants. Threshold alert fires when error rate exceeds 1% of requests. |
| Response time | P50, P95, and P99 API response times across all endpoints. Alert fires when P95 exceeds 2 seconds. |
| Queue depth | Background job queue depth for report generation, email dispatch, and automation execution. Alert fires when queue depth exceeds a configurable threshold. |
| Tenant-level metrics | Per-tenant: active users in last 24 hours, API request volume, error rate, last activity timestamp. |
| Automation health | Count of automation rules in Error state across all tenants. Drill-down to see which tenants and which rules are failing. |
| Storage usage | Total platform storage versus capacity. Per-tenant storage breakdown. Alert fires at 80% capacity. |
| Database health | Connection pool utilisation, slow query count, replication lag. Alert fires on any replication lag above 5 seconds. |

---

# 6. Tenant Suspension and Off-boarding

## 6.1 Suspension

Suspension is a temporary state applied when a tenant has an overdue subscription payment, a compliance issue, or a platform policy violation. A suspended tenant's data is retained in full — no data is deleted on suspension.

| **Element** | **Detail** |
|---|---|
| Effect of suspension | All tenant user logins are blocked. The tenant login page shows a suspension notice with a contact email. No data is deleted. No automations fire. Scheduled reports are paused. |
| Suspension trigger | Platform admin applies suspension manually from the Tenant Detail View. A mandatory reason and category (Payment overdue / Compliance / Policy violation / Other) must be provided. |
| Notification | Tenant Super Admin and Org Owner receive an email notification on suspension: reason, effective date, resolution steps. |
| Reinstatement | Platform admin lifts the suspension from the Tenant Detail View. Reinstatement takes effect immediately. All users regain access on next login. |
| Automatic suspension — payment overdue | If a subscription invoice is 14 days overdue and no payment has been received, the system initiates a 48-hour grace period. Org Owner and Super Admin receive a warning. If no payment or manual extension is received within 48 hours, suspension executes automatically. |
| Manual extension | Platform admin can grant a manual extension of up to 7 days from the suspension warning. One extension permitted per invoice cycle. Extension is logged on the tenant record. |
| Immediate suspension | Platform admin can suspend a tenant immediately for policy violations or at-risk situations, bypassing the grace period. Manual action with logged reason. |

## 6.2 Off-boarding

Off-boarding is the permanent termination of a tenant's Enrolla subscription. It is irreversible. Data is retained for the period required by [[01_Foundation-PL03_Data_Privacy|PL-03]] then eligible for deletion.

| **Element** | **Detail** |
|---|---|
| Initiation | Platform admin initiates off-boarding from the Tenant Detail View. Requires a second platform admin to confirm. Both approvals are logged. |
| Notice period | 30-day notice period from initiation to data access termination. During this period, tenant users retain read-only access to export their data. |
| Data export | During the notice period, Super Admin can export all tenant data as a structured archive (CSV and PDF). The export is available for 30 days after the off-boarding date. |
| Access termination | On the off-boarding date, all tenant user access is permanently revoked. |
| Data retention post off-boarding | Financial records are retained for 5 years from the invoice date (UAE VAT Law). All other data is eligible for deletion after the notice period. Platform admin schedules deletion in accordance with [[01_Foundation-PL03_Data_Privacy|PL-03]]. |
| Tenant notification | 30-day notice email sent to Org Owner and Super Admin on initiation. 7-day reminder. Day-of notification. All sent to the registered billing contact. |

---

# 7. Feature Flag Management

Platform-level feature flags control what is available to tenants. Tenant-facing feature toggles in [[09_Settings-M20_Tenant_Settings|M20]] control what the tenant has turned on within their available features.

| **Element** | **Detail** |
|---|---|
| Platform-level flags | Platform admin can enable or disable any platform feature for any tenant individually, or roll out to all tenants simultaneously. Used for phased feature rollouts, beta access, and emergency feature disabling. |
| Tenant-level toggles | Controlled by the tenant Super Admin in [[09_Settings-M20_Tenant_Settings|M20]]. Only features enabled at the platform level are available for tenant toggling. |
| Phase 2 features | WhatsApp BSP, Zoho Books, payment gateways, and parent portal are gated behind platform-level flags. Not available to tenants until Enrolla enables them at the platform level. |
| Rollout strategy | New features are rolled out: (1) internal testing, (2) pilot tenant (IMI), (3) opt-in beta for selected tenants, (4) general availability for all tenants. |

---

# 8. DPA Version Management

When the Enrolla Data Processing Agreement is updated, all active tenants must re-confirm the new DPA.

| **Element** | **Detail** |
|---|---|
| DPA version registry | The Platform Admin Panel maintains a registry of all DPA versions: version number, effective date, summary of changes, and which tenants have confirmed each version. |
| Notification on update | When a new DPA version is published, all active tenant Super Admins receive an in-app and email notification with a summary of changes and a link to the new DPA. |
| Per-tenant confirmation status | Each tenant record tracks: the DPA version currently confirmed, the confirmation timestamp, and the name of the Super Admin who confirmed it. This is visible in the Tenant Detail View under the Overview tab. |
| Re-confirmation deadline | Tenants must re-confirm within 14 days of publication. Platform admin can extend this deadline per tenant if requested. |
| Non-confirmation banner | After a new DPA version is published, a 14-day countdown banner is shown to the Super Admin only inside the tenant platform. The banner is non-blocking — platform functionality is not restricted. Other roles see nothing. |
| No auto-suspension | Auto-suspension for DPA non-confirmation is not active in v1. This is a known operational limitation. Platform admin must apply suspension manually if a tenant does not confirm. |
| Re-confirmation record | Each DPA re-confirmation is permanently logged: Super Admin name, email, timestamp, DPA version confirmed. |

---

# 9. Platform Admin Accounts

Platform admin accounts are managed separately from all tenant accounts. They are created and managed within the Platform Admin Panel by the platform owner.

| **Element** | **Detail** |
|---|---|
| Account creation | Platform admin accounts are created by the platform owner (Jason Daswani) or by another platform admin with account management permissions. |
| Roles | Three platform admin roles: Platform Owner (full access, one account), Platform Admin (full operational access, cannot manage other platform admin accounts), Platform Support (read-only support access to tenant data, cannot modify platform configuration). |
| MFA | Mandatory for all platform admin accounts. TOTP. Cannot be disabled. |
| IP whitelist | All platform admin accounts are restricted to a configured IP whitelist. Access from outside the whitelist is rejected. |
| Session duration | Platform admin sessions expire after 4 hours of inactivity (stricter than the 8-hour tenant session timeout). |
| Account audit | All platform admin account creations, role changes, and deactivations are logged permanently in the platform-level audit trail. |
| Deactivation | Platform admin accounts are deactivated (not deleted) when the person leaves Enrolla. All audit history is retained. |

---

# 10. IMI Tenant Record

The following is the confirmed configuration for the IMI tenant record in the Platform Admin Panel.

| **Setting** | **IMI Value** |
|---|---|
| Organisation name | Improve ME Institute |
| Org slug | imi-gdp (example — set at provisioning) |
| Plan tier | To be confirmed at provisioning |
| Status | Active |
| Org Owner | Jason Daswani |
| Branch | Gold & Diamond Park, Dubai (GDP) |
| DPA | Confirmed at activation |
| Test window | 14 days from Org Owner account activation |
| Audit trail retention | 5 years minimum |
| Support access notification | In-app and email to Super Admin on any platform admin access |
