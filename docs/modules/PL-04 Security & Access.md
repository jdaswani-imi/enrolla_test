---
module: "PL-04"
title: "Security & Access"
layer: "Foundation"
folder: "01_Foundation"
status: "Draft"
phase: "v1"
dependencies: ["PL-01", "PL-02", "PL-03"]
tags: [enrolla, prd, foundation, security]
---

# ENROLLA
# [[01_Foundation-PL04_Security_Access|PL-04]] — Security & Access
v1.0 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

This document defines the security architecture and access control implementation for Enrolla, covering authentication, session management, password policy, rate limiting, data isolation, optimistic locking, audit trail enforcement, and security alerting. All specifications apply platform-wide unless explicitly scoped.

| **Property** | **Value** |
|---|---|
| Module code | [[01_Foundation-PL04_Security_Access|PL-04]] |
| Version | v1.0 |
| Status | Draft |
| Dependencies | [[01_Foundation-PL01_Platform_Architecture|PL-01]], [[01_Foundation-PL02_RBAC|PL-02]], [[01_Foundation-PL03_Data_Privacy|PL-03]] |
| Phase | v1 |

---

# 1. Authentication

All staff access to Enrolla is authenticated via username and password. The username is the work email address assigned in [[05_People-M09_Staff_Performance|M09]]. No third-party OAuth or SSO is supported in v1.

## 1.1 Login

| **Element** | **Specification** |
|---|---|
| Username | Work email address. Assigned by HR in [[05_People-M09_Staff_Performance|M09]]. Cannot be changed by the staff member. |
| Password | Set by the staff member via a one-time invite link on account creation. See Section 1.2 for password rules. |
| Login URL | Tenant-specific subdomain. Default: enrolla.app/[orgslug]. Custom domain available in Phase 2. |
| Failed login handling | After 5 consecutive failed attempts, the account is locked for 15 minutes. After 10 consecutive failures, the account is locked until Admin Head or Super Admin manually unlocks it. All failed attempts are logged in the audit trail. |
| Login notification | When a staff member logs in from a new or unrecognised device or IP address, Super Admin receives an in-app and email security alert including: staff member name, device type, IP address, and timestamp. |
| No guest access | No guest, read-only, or temporary access links are issued in v1. All access requires a registered staff account. |

## 1.2 Password Policy

| **Rule** | **Specification** |
|---|---|
| Minimum length | 10 characters |
| Complexity | Must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*) |
| Password history | Not enforced in v1. Staff can reuse previous passwords. |
| Expiry | Passwords do not expire automatically in v1. Super Admin can force a password reset on any account at any time. |
| Reset flow | Staff member clicks Forgot Password on the login page. A time-limited reset link (valid 15 minutes) is sent to the registered email. The link is single-use. The account holder is notified by their work email when any reset request is made, regardless of whether they initiated it. |
| Admin-triggered reset | Admin and above can trigger a password reset for any staff member from their [[05_People-M09_Staff_Performance|M09]] profile. Admin cannot view or set the password directly — only the reset link flow is available. |
| First-login requirement | New staff must set their password on first login via the invite link. The invite link expires after 48 hours. If expired, HR sends a new invite from [[05_People-M09_Staff_Performance|M09]]. |

---

# 2. Session Management

Sessions are the authenticated connections between a staff member's browser or device and the Enrolla platform. Session management controls how long a session remains active and what happens when it expires or is forcibly terminated.

| **Element** | **Specification** |
|---|---|
| Session token | On successful login, a session token is issued. Stored in the browser as an httpOnly, Secure cookie. Never exposed in the URL or accessible via JavaScript. |
| Idle session timeout | Active sessions expire after 30 minutes of user inactivity. Inactivity is defined as no mouse movement, keypress, or API call within the platform. |
| Hard session limit | Regardless of activity, a session is terminated after 8 hours from login. The user must log in again. |
| Inactivity warning | At 25 minutes of inactivity, a warning banner appears: "Your session will expire in 5 minutes. Click anywhere to stay logged in." Clicking any platform element resets the inactivity timer. |
| Session expiry | On expiry (idle or hard limit), the user is redirected to the login page. Form state is preserved where technically possible. The expiry event is logged in the audit trail. |
| Explicit logout | Staff member clicks Log Out. Session token is immediately invalidated server-side. Cannot be reused. Logout event is logged. |
| Immediate Access Revocation | When triggered on a staff account, all active sessions for that account are invalidated server-side within seconds. The staff member is redirected to the login page on their next request. No further login is possible until Super Admin reinstates access. |
| Multiple sessions | A staff member can be logged in on multiple devices simultaneously. Each device holds its own session token. Revoking access invalidates all tokens across all devices. |
| Session ID rotation | Session tokens are rotated on every privileged action (role change, gateway approval, [[09_Settings-M20_Tenant_Settings|M20]] configuration change) to prevent session fixation attacks. |

---

# 3. Multi-Tenancy Data Isolation

Enrolla enforces data isolation between tenants at the database query layer, not just the application layer. No tenant can access another tenant's data under any circumstances.

| **Rule** | **Specification** |
|---|---|
| Tenant ID enforcement | Every entity in the database carries a tenant_id foreign key as a mandatory non-nullable field. Every SELECT, INSERT, UPDATE, and DELETE operation must include a tenant_id filter. Enforced at the ORM/query layer. |
| Cross-tenant queries | No join across tenant boundaries is permitted. The query layer blocks cross-tenant queries entirely. This is not an application-level check — it is enforced at the data access layer. |
| Organisation and Branch records | Exist above tenant scope and are the only entities accessible without a tenant_id filter. These contain only non-sensitive configuration data (org name, branch name, region). |
| Platform admin bypass | The Enrolla Platform Admin Panel ([[01_Foundation-PL05_Platform_Admin|PL-05]]) bypasses tenant scope for support purposes only. All platform admin access uses a separate authentication layer with its own credentials, rate limiting, and audit trail. Platform admin access is never exposed to tenant users. |
| Soft-deleted records | Archived records retain their tenant_id and remain queryable within tenant scope. They cannot be accessed from outside the tenant. |
| Branch-level isolation within a tenant | Cross-branch visibility is controlled by toggles in [[09_Settings-M20_Tenant_Settings|M20]] (both off by default when a second branch is created). Even with cross-branch visibility enabled, guardian contact details are returned as name-only for staff at other branches. |

---

# 4. Rate Limiting

Rate limiting protects the platform against brute-force attacks, automated abuse, and unintentional overload.

| **Limit** | **Threshold** | **Rationale** |
|---|---|---|
| Password reset requests | 5 reset link requests per hour per email address | Prevents reset link flooding |
| Assessment booking page | Maximum 5 booking submissions per unique phone or email per 14-day period. CAPTCHA on booking confirmation step. | Prevents bot-filling of assessment slots |
| API requests (authenticated) | 1,000 requests per minute per tenant. Burst allowance: 2,000 requests per 10-second window. | Prevents runaway automation from degrading service |
| API requests (unauthenticated) | 100 requests per minute per IP address | Applies to public endpoints (assessment booking, form submission) |
| Bulk data exports | 10 exports per hour per user. Exports above 10,000 records are queued as background jobs. | Prevents export flooding and server overload |
| Bulk action threshold | Actions affecting more than 500 records require an additional confirmation step | Prevents accidental mass operations |

---

# 5. Optimistic Locking

Enrolla uses optimistic locking for all record editing. No edit lock is held on any record when a user opens it for editing. This avoids indefinite record freezing and is the correct pattern for a multi-user SaaS application.

| **Element** | **Specification** |
|---|---|
| How it works | When a user opens a record for editing, the current version number is captured. When the user saves, the platform compares the version number in the save request against the current version in the database. |
| No conflict | Version numbers match — save succeeds. Record version is incremented. |
| Conflict detected | Version numbers do not match (another user saved first). Save is rejected. The saving user sees: "This record was updated by [Name] at [HH:MM]. Your changes were not saved. Review the current version before editing again." |
| No data loss on conflict | The rejected user's changes are not silently discarded. The conflict notification shows both versions so the user can manually reconcile them. |
| Scope | Applies to all record types: student profiles, guardian profiles, lead records, invoices (draft only), staff profiles, session records, tasks, tracker entries. |
| No lock timeout | Because no lock is held, a user who opens a record and does not return does not prevent other users from editing that record. |
| Audit trail | Both successful saves and conflict events are logged in the audit trail with the user, timestamp, and record affected. |

---

# 6. Audit Trail

The platform audit trail is a permanent, immutable record of all significant actions. Audit entries are written directly to an append-only audit table that no application-layer operation can modify or delete.

## 6.1 What Is Logged

| **Category** | **Events Logged** |
|---|---|
| Authentication events | Successful login, failed login (with attempt count), logout, session expiry, password reset request, password reset completed, new device login alert |
| Record operations | Create, update, delete (soft delete), archive, restore — for all significant entity types |
| Financial actions | Invoice creation, issue, cancellation, payment recorded, discount applied, fee waiver applied, credit issued, refund approved, bad debt marked, fee-exempt toggle applied |
| Approval gateway actions | All gateway actions: action type, performer, approver (if applicable), timestamp, reason, outcome |
| Access control changes | Role assigned, role changed, role expired, role removed, custom role created, permission changed, secondary label added or removed |
| Data export events | Every export: who exported, timestamp, filter applied, format, record count |
| Configuration changes | All [[09_Settings-M20_Tenant_Settings|M20]] changes: setting name, previous value, new value, Super Admin who made the change, timestamp |
| HR actions | Emergency Leave activation and reinstatement, Immediate Access Revocation, off-boarding initiation and completion |
| Merge actions | Record merge initiated, CONFIRM MERGE typed, merge completed, rollback initiated, rollback completed |
| Erasure actions | Erasure request received, anonymisation applied, confirmation issued |
| Conflict events | Optimistic lock conflict: user who lost the conflict, record affected, timestamp |

## 6.2 Audit Entry Format

| **Element** | **Specification** |
|---|---|
| Fields per entry | Event type, actor user ID, actor name, actor role, tenant ID, branch ID (where applicable), record type, record ID, timestamp (UTC stored, UAE time displayed), previous value (where applicable), new value (where applicable), logged reason (where required), IP address, device fingerprint (hashed) |
| Timestamp format | Stored as UTC. Displayed as DD/MM/YYYY HH:MM UAE time (UTC+4). |
| Immutability | Audit entries are written to an append-only table. No UPDATE or DELETE operation is permitted on the audit table. Enforced at the database layer. |
| Retention | 5 years minimum. Aligned to financial record retention (UAE VAT Law, [[01_Foundation-PL03_Data_Privacy|PL-03]]). |
| Access | Super Admin and Admin Head can query the audit trail from [[09_Settings-M20_Tenant_Settings|M20]]. Filterable by date range, event type, actor, and record. Export available to Super Admin. |

---

# 7. Security Alerts

The following events generate immediate security alerts to Super Admin via in-app notification and email. Security alerts cannot be toggled off in [[09_Settings-M20_Tenant_Settings|M20]] — they are system-mandatory.

| **Alert** | **Detail** |
|---|---|
| New device login | A staff member logs in from a previously unseen device or IP address. Alert includes: staff name, device type, browser, IP address, location (if determinable), timestamp. |
| Account lockout | A staff account is locked after 10 consecutive failed login attempts. Alert includes: staff name, IP address of attempts, timestamp. |
| Immediate Access Revocation | Any Immediate Access Revocation action is logged and Super Admin is notified with: staff member affected, triggering admin name, timestamp, stated reason. |
| Unusual bulk export | An export containing more than 1,000 records is flagged for review. Alert includes: exporting user, export scope, record count, timestamp. |
| Multiple failed logins across accounts | If 20 or more distinct accounts experience failed login attempts within a 5-minute window from the same IP address, a brute-force alert fires and the IP address is automatically rate-limited. |
| DPA not re-confirmed | If a DPA update is issued and the tenant Super Admin has not re-confirmed within 14 days, a reminder alert fires. |
| Automation rule failure | When an automation rule fails to execute, Super Admin receives an in-app and email notification with the rule name, failure reason, and affected record. |

---

# 8. Data in Transit and at Rest

| **Element** | **Specification** |
|---|---|
| Data in transit | All communication between client and platform uses TLS 1.2 or higher. HTTP connections are redirected to HTTPS. HSTS headers are enforced. |
| Data at rest | All data stored in the Enrolla database is encrypted at rest using AES-256. This includes all tenant data, audit logs, and financial records. |
| Session tokens | Stored as httpOnly, Secure cookies. Not accessible via JavaScript. Rotated on privileged actions. |
| Passwords | Stored as bcrypt hashes with a minimum cost factor of 12. Plaintext passwords are never stored or logged. |
| File storage | Documents uploaded to the platform are stored in encrypted object storage. Files are served via time-limited signed URLs to prevent unauthorised access. |
| API keys | Integration API keys (Phase 2) are stored encrypted. Never returned in API responses or displayed in the UI after initial entry. Tenants must re-enter keys to update them. |

---

# 9. Input Validation and Injection Prevention

| **Threat** | **Control** |
|---|---|
| SQL injection | All database queries use parameterised statements or an ORM. Raw string interpolation into SQL queries is not permitted anywhere in the codebase. |
| XSS prevention | All user-generated content is sanitised before rendering in the browser. Rich text fields use a whitelist of permitted HTML tags. Content Security Policy (CSP) headers are enforced. |
| File upload validation | Uploaded files are validated for type (MIME type check, not just extension), size (maximum 10MB per file), and scanned for malicious content before storage. |
| Form input validation | All form inputs are validated both client-side (for UX) and server-side (for security). Client-side validation is not trusted as a security control. |
| CSRF protection | All state-changing requests (POST, PUT, DELETE) require a CSRF token. Requests without a valid CSRF token are rejected with a 403 response. |
| Public form submissions | [[05_People-M12_People_Forms|M12]] public forms validate for: rate limiting (per IP), CAPTCHA (on assessment booking page), field type conformance, and maximum field lengths. |

---

# 10. Access Control Implementation

Role-based access control (defined in [[01_Foundation-PL02_RBAC|PL-02]]) is enforced at three layers: the API layer, the service layer, and the database query layer. Enforcement at only one layer is not sufficient.

| **Layer** | **Implementation** | **Role** |
|---|---|---|
| API layer | Every API endpoint checks the authenticated user's role before processing the request. Endpoints the user's role cannot access return 403 Forbidden — not 404 Not Found. The distinction prevents information leakage about restricted resources. | First line of enforcement |
| Service layer | Business logic within the service layer re-checks permissions before executing sensitive operations (financial actions, role changes, data exports). A request that passes the API layer check is still rejected at the service layer if the operation is not permitted. | Second line of enforcement. Prevents bypass via API manipulation. |
| Database query layer | All queries include tenant_id filters and, where applicable, scoping filters (e.g. subject_id for Teacher queries). A query that bypasses the API and service layers cannot return out-of-scope data. | Third line of enforcement. Data isolation guarantee. |
| Navigation hiding | In the UI, navigation items and action buttons the user's role cannot access are hidden entirely — not greyed out or disabled. Hidden elements are not rendered in the DOM. | UI layer. Not a security control on its own — backend enforcement is the security control. |

## 10.1 Scoped Access Implementation

For roles with scoped access (Teacher, HOD, Head of Subject, TA), scope enforcement is implemented as follows.

| **Role** | **Implementation** |
|---|---|
| Teacher scope | Teacher queries for student records, session records, assignment records, and tracker entries are automatically filtered to students enrolled in sessions where the Teacher is the assigned teacher. A Teacher cannot construct a query that returns records outside this scope. |
| HOD scope | HOD queries are filtered to the department(s) the HOD is assigned to in their [[05_People-M09_Staff_Performance|M09]] profile. Cross-department data is not returned. |
| Head of Subject scope | Head of Subject queries are filtered to the subject(s) explicitly assigned to them in [[05_People-M09_Staff_Performance|M09]]. |
| TA scope | TA queries for student profile data are filtered to sessions the TA is assigned to. TA cannot access student financial or academic data. |
| Scope changes | When a Teacher's subject assignments change in [[05_People-M09_Staff_Performance|M09]], their query scope updates immediately. Cached scope data is invalidated on role or assignment change. |
| Secondary role labels | When a staff member holds secondary role labels ([[01_Foundation-PL02_RBAC|PL-02]], Section 3), their query scope expands to include the scope of all secondary labels. The highest scope across all held roles applies. |

---

# 11. IMI Security Configuration

| **Setting** | **IMI Value** |
|---|---|
| Login username format | Work email address. Assigned by HR in [[05_People-M09_Staff_Performance|M09]]. |
| Password minimum length | 10 characters |
| Password complexity | Uppercase, lowercase, number, special character required |
| Failed login lockout | 5 attempts → 15 minutes. 10 attempts → manual unlock. |
| Idle session timeout | 30 minutes of inactivity |
| Hard session limit | 8 hours from login |
| Session warning | At 25 minutes of inactivity |
| Invite link expiry | 48 hours |
| Password reset link expiry | 15 minutes (single-use) |
| Account holder notified on reset request | Yes — work email notification on every reset request |
| Password reset rate limit | 5 reset link requests per hour per email address |
| Assessment booking CAPTCHA | Checkbox CAPTCHA on booking confirmation step |
| Assessment booking rate limit | 5 bookings per phone or email per 14-day period |
| Bulk action threshold | 500 records (additional confirmation required) |
| API rate limit (authenticated) | 1,000 requests per minute per tenant |
| TLS | 1.2 minimum |
| Password storage | bcrypt, minimum cost factor 12 |
| Data at rest encryption | AES-256 |
| Audit trail retention | 5 years minimum |
| New device login alert | Super Admin in-app and email |
| Optimistic locking | Platform-wide. No edit locks held. |

---

## Section 12 — Profile Update Link Security

The Profile Update Link is a personalised, time-limited, tokenised URL generated by Admin for a specific guardian. It allows the guardian to update their own contact and communication preferences without logging into the platform.

| **Property** | **Specification** |
|---|---|
| Token format | UUID v4. Cryptographically random. One token per link. |
| Expiry | 72 hours from generation. Configurable by Super Admin (range: 24–168 hours). |
| Single-use | The token is invalidated after the guardian submits the update form. A new link must be generated for subsequent updates. |
| Scope | The link grants access only to the guardian's own profile fields: phone number, email, WhatsApp number, preferred communication channel, home area/district. The guardian cannot access any other records. |
| Authentication | No login required. The token is the authentication mechanism. |
| HTTPS required | All Profile Update Link requests must be served over HTTPS. HTTP requests are rejected. |
| Audit | Every link generation, view, and form submission is logged in the system audit trail with timestamp and IP address. |
| Invalidation | Admin can invalidate any outstanding link at any time from the guardian profile. |
| Rate limiting | Maximum 3 outstanding Profile Update Links per guardian at any time. Generating a 4th invalidates the oldest. |
