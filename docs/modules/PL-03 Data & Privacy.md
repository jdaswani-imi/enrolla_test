---
module: "PL-03"
title: "Data & Privacy"
layer: "Foundation"
folder: "01_Foundation"
status: "Draft"
phase: "v1"
dependencies: ["PL-01", "PL-04"]
tags: [enrolla, prd, foundation, privacy]
---

# ENROLLA
# [[01_Foundation-PL03_Data_Privacy|PL-03]] — Data & Privacy
v1.0 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

This document defines Enrolla's data retention, privacy, and compliance framework. It covers retention periods by data category, anonymisation rules, consent management, the right to erasure, and the Data Processing Agreement (DPA) requirements applicable to all tenants.

| **Property** | **Value** |
|---|---|
| Module code | [[01_Foundation-PL03_Data_Privacy|PL-03]] |
| Version | v1.0 |
| Status | Draft |
| Dependencies | [[01_Foundation-PL01_Platform_Architecture|PL-01]], [[01_Foundation-PL04_Security_Access|PL-04]] |
| Phase | v1 |

---

# 1. Data Processing Agreement

A signed Data Processing Agreement (DPA) is mandatory before any tenant is activated on the Enrolla platform. No tenant data is created or stored until the DPA is confirmed.

| **Property** | **Value** |
|---|---|
| Requirement | DPA must be confirmed by the Org Owner before the [[09_Settings-M20_Tenant_Settings|[[09_Settings-M20_Tenant_Settings|M20]].A]] onboarding wizard can proceed |
| Confirmation method | Digital acceptance within the platform. Timestamp, DPA version, and Org Owner identity are permanently recorded. |
| Version locking | The DPA version accepted at activation is locked to the tenant record. |
| Updates | When the DPA is updated, all active tenants must re-confirm within 14 days. See [[01_Foundation-PL05_Platform_Admin|PL-05]] for version management. |
| Non-confirmation banner | After 14 days without re-confirmation of an updated DPA, a persistent banner appears for Super Admin and Org Owner only. Platform functionality is not blocked. |
| Auto-suspension | Auto-suspension for DPA non-confirmation is not active in v1. This is a known operational limitation. Super Admin is notified if DPA confirmation is not received within 30 days of onboarding. Suspension must be actioned manually. |

---

# 2. Data Retention by Category

Enrolla enforces minimum retention periods by data category. Tenant-configurable periods operate within these minimums — a tenant cannot configure a retention period shorter than the stated minimum.

## 2.1 Financial Records

Financial records are subject to UAE VAT Law. The retention period is non-negotiable and cannot be shortened by any tenant configuration.

| **Property** | **Value** |
|---|---|
| Minimum retention | 5 years from the invoice date |
| Scope | All invoices, payments, credits, discounts, fee waivers, refunds, VAT records, and associated audit trail entries |
| Applies to | All tenants regardless of subscription status |
| After off-boarding | Financial records are retained for 5 years post off-boarding even after all other tenant data is deleted |
| Deletion | Financial records cannot be deleted within the 5-year window by any role, including Super Admin or platform admin |

## 2.2 Student Academic Records

Student academic records include assessment scores, progress tracker entries, attendance records, assignment submissions, feedback, and progress reports.

| **Property** | **Value** |
|---|---|
| Default retention | 3 years post-withdrawal |
| Minimum retention | 1 year post-withdrawal |
| Configurable | Yes — tenant-configurable in [[09_Settings-M20_Tenant_Settings|M20]] between 1 year (minimum) and any longer period |
| Active students | Records are retained for the full duration of the student's enrolment and indefinitely thereafter unless a deletion request is received and the minimum period has elapsed |

## 2.3 Consent and Terms & Conditions

| **Property** | **Value** |
|---|---|
| Retention | Permanent — consent records and T&C acceptance logs are never deleted |
| Scope | Guardian consent at enrolment, DPA acceptance records, communication consent logs |
| Rationale | Consent records must be available at any time to demonstrate lawful basis for data processing |

## 2.4 Personal Identity Data

Personal identity data (name, date of birth, national ID, passport number, UAE residency details) is subject to specific handling when a student withdraws and financial records remain active.

| **Property** | **Value** |
|---|---|
| Rule | Personal ID data is anonymised (not deleted) when the student's financial records are still within their retention window |
| Anonymisation | Name is replaced with a pseudonym. ID numbers are removed. Contact details are removed. Academic and financial record structure is preserved with the pseudonym. |
| Trigger | Anonymisation occurs when: (a) a deletion/erasure request is received AND (b) the financial record retention window has not yet elapsed |
| Full deletion | Full deletion of all records occurs only after the financial retention window has elapsed and a deletion request has been received |

---

# 3. Right to Erasure

Enrolla supports the right to erasure (right to be forgotten) for guardians and students, subject to the constraints of UAE VAT Law on financial record retention.

| **Property** | **Value** |
|---|---|
| Who can request | Guardian (on behalf of a minor student) or the student directly (if of legal age) |
| Submission | Erasure requests are submitted to the tenant (not directly to Enrolla). The tenant processes the request via Admin or Super Admin. |
| Processing role | Admin or above initiates erasure from the student's profile. Super Admin confirms. |
| Financial records active | If financial records are within the 5-year retention window, full deletion is not possible. Personal ID data is anonymised instead. The requestor is informed of this constraint. |
| Financial records elapsed | If no financial records are within the retention window, full deletion of all personal data proceeds. Academic record structure may be retained in anonymised form for audit purposes. |
| Consent records | Consent records are retained permanently regardless of erasure requests. They are anonymised (linked pseudonym) where personal data cannot be deleted. |
| Audit log | The erasure request, the action taken, and the confirmation are permanently logged in the audit trail. |
| Response time | Under UAE PDPL, data erasure requests must be responded to within 30 days of receipt. The 30-day clock starts from the date the erasure request is formally logged in the platform by Admin. If a guardian submits an erasure request to the centre outside the platform (in writing, by email, or in person), Admin must log it in the platform on the day of receipt. The log date is the legally binding start point. Enrolla logs the date of every erasure request. If the 30-day window is approaching without resolution, an automatic alert is sent to the Super Admin. |

---

# 4. Data Minimisation

Enrolla applies data minimisation principles to all data collection across modules.

| **Property** | **Value** |
|---|---|
| Mandatory fields | Only fields that are operationally necessary are marked mandatory. Optional fields are clearly labelled. |
| Sensitive fields | Fields collecting sensitive data (nationality, medical notes, ID numbers) are restricted to Admin and above by default. |
| Form submissions | [[05_People-M12_People_Forms|M12]] public forms collect only the fields configured by the tenant. Enrolla does not add hidden data collection to public forms. |
| Lead Enquiry Form fields | The Lead Enquiry Form (public-facing) collects: guardian name, phone, email, student name, student preferred name (optional), year group, nationality (optional), home area/district (optional), subject(s) of interest, school, source channel (with 'Who referred you?' conditional field appearing only when Referral Parent is selected from the source dropdown). No sensitive personal data is collected on the public enquiry form. |
| Staff data | Staff personal data (home address, emergency contact, bank details) is restricted to HR/Finance and Super Admin. |

---

# 5. Communication Consent

Enrolla tracks communication consent at the guardian level. Consent state affects outbound messaging behaviour across all modules.

| **Consent Type** | **Behaviour** |
|---|---|
| Subscribed | All platform-generated communications are permitted |
| Unsubscribed | Non-essential communications are suppressed. Financial communications (invoices, payment confirmations) always send regardless of unsubscribe status. |
| Do Not Contact (DNC) | All outbound communications are blocked. DNC always wins over unsubscribe status. The following categories always send regardless of DNC status: (1) invoice and payment communications (financial), (2) safeguarding and welfare notifications, (3) [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern escalation communications. |

DNC is a warning interstitial in the platform UI, not a hard block on action. All contact buttons remain active and visible. The system displays a DNC warning when a staff member attempts to contact a DNC-flagged guardian. See [[03_Student-M01_Lead_Management|M01]] and AMD-01 for full DNC specification.

---

# 6. Data Export and Portability

Tenants and guardians have the right to access their data. Enrolla provides structured export mechanisms.

| **Property** | **Value** |
|---|---|
| Student data export | Admin and above can export a student's full record (academic, attendance, financial history) as a PDF or CSV from the student profile |
| Bulk data export | Super Admin can export all tenant data from [[09_Settings-M20_Tenant_Settings|M20]]. Exports above 10,000 records are queued as background jobs. |
| Off-boarding export | During the 30-day off-boarding notice period, Super Admin can export all tenant data as a structured archive (CSV and PDF). Available for 30 days after the off-boarding date. |
| Export logging | All data exports are logged in the audit trail: who exported, timestamp, filter applied, format, record count. |

---

# 7. Cross-Border Data Considerations

| **Property** | **Value** |
|---|---|
| Primary jurisdiction | UAE. All tenant data for IMI is processed and stored within the platform's hosting infrastructure. |
| Data residency | Data residency configuration is a platform infrastructure decision documented separately. Not configurable by tenants in v1. |
| Third-party processors | All third-party integrations (Zoho Books, Zoho People, WhatsApp BSP, payment gateways) are Phase 2. In v1, no personal data is transmitted to external processors by the platform. |

---

# 8. IMI Data & Privacy Configuration

| **Setting** | **IMI Value** |
|---|---|
| DPA confirmed | Yes — at tenant activation |
| Financial record retention | 5 years (UAE VAT Law — non-negotiable) |
| Student academic record retention | 3 years post-withdrawal (tenant default) |
| Erasure request processing role | Admin initiates, Super Admin confirms |
| Communication consent tracking | Per guardian — Subscribed / Unsubscribed / DNC |
| Communications send regardless of DNC | Yes — three categories always send: (1) invoices and payment communications, (2) safeguarding and welfare notifications, (3) [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern escalation communications |
| Anonymisation on erasure (financial active) | Yes — personal ID data anonymised, records preserved |
