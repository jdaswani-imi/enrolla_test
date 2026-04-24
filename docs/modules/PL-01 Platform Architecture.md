---
module: "PL-01"
title: "Platform Architecture"
layer: "Foundation"
folder: "01_Foundation"
status: "Draft"
phase: "v1"
dependencies: []
tags: [enrolla, prd, foundation]
---

# ENROLLA
# [[01_Foundation-PL01_Platform_Architecture|PL-01]] — Platform Architecture
v2.1 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

This document defines the structural and architectural foundations of the Enrolla platform, covering the multi-tenant model, module system, data hierarchy, platform-wide rules, and display standards. All other modules operate within the constraints defined here.

| **Property** | **Value** |
|---|---|
| Module code | [[01_Foundation-PL01_Platform_Architecture|PL-01]] |
| Version | v2.0 |
| Status | Draft |
| Dependencies | None |
| Phase | v1 |

---

# 1. Multi-Tenant Architecture

Enrolla is a multi-tenant SaaS platform. Each tenant is an independent Organisation with its own data, configuration, branding, and user base. No data crosses tenant boundaries.

| **Property** | **Value** |
|---|---|
| Tenancy model | One database schema per tenant. All entities scoped to a mandatory tenant identifier at database level. |
| API isolation | API calls from one tenant session cannot retrieve data from another tenant scope. |
| Onboarding | Each tenant is provisioned by the Enrolla platform admin team. A Data Processing Agreement (DPA) must be signed before activation. |
| Subdomain | Each tenant accesses the platform via a dedicated subdomain configured during onboarding. |
| Language | English only in v1. All UI, notifications, templates, and generated documents are in English. |
| Character support | ASCII/Latin characters only in v1. Arabic input and multi-language rendering are deferred to a future phase. |

---

# 2. Organisational Hierarchy

The platform hierarchy has three levels: Organisation, Branch, and User. This hierarchy governs data scoping, branding, and visibility.

## 2.1 Organisation

An Organisation is the top-level billing and administrative unit. It owns the subscription, holds the master configuration, and contains one or more Branches.

| **Property** | **Value** |
|---|---|
| Billing unit | Yes — subscription, invoicing, and payment gateway configuration are at Organisation level |
| Branding | Logo, colours, email sender name, PDF headers, invoice prefix, and domain configured at Org level. All Branches inherit by default. |
| Branch override | A Branch can enable its own independent branding via a toggle in [[09_Settings-M20_Tenant_Settings|M20]]. When enabled, that Branch displays its own logo, colours, and domain. Other branches are unaffected. |
| Org Super Admin | Can view and act across all Branches within the Organisation |

## 2.2 Branch

A Branch is a physical or operational location within an Organisation. It inherits Org-level configuration and can override specific settings where permitted.

| **Property** | **Value** |
|---|---|
| Location | Corresponds to a physical site or distinct operational unit |
| Configuration inheritance | Inherits all Org-level settings by default. Can override where [[09_Settings-M20_Tenant_Settings|M20]] permits. |
| Cross-branch staff visibility | Off by default when a second Branch is created. Super Admin must actively enable. |
| Cross-branch student visibility | Off by default when a second Branch is created. Super Admin must actively enable. |
| Independent toggles | Staff visibility and student visibility are independent — one can be enabled without the other. |

## 2.3 Departments

Departments are operational groupings within a Branch. Year group assignment to department is tenant-configurable in [[09_Settings-M20_Tenant_Settings|M20]].

| **Department** | **Year Groups (IMI default)** |
|---|---|
| Primary | FS1 through Year 6 |
| Lower Secondary | Year 7 through Year 9 |
| Senior | Year 10 through Year 13, AND the Senior student category (adult learners not tied to a school year group) |
| Enrichment | Ages vary by programme. Not tied to a specific year group range. Includes CAT4, 7+/11+ Preparation, Chess Mastery, Financial Literacy, AI Literacy, Educational Counselling, Home Education Support. |
| Graduated / Alumni | Null department |

Department auto-assignment triggers on student creation and on annual year group progression. Admin and above can manually override.

> **Senior (adult) — A permanent student category for adult learners and external professionals. Not assigned a year group position. Assigned to the Senior department. Rate card uses the Senior per-session rate.**

---

# 3. Module System

Enrolla is composed of toggleable modules organised across eight layers. Each module can be enabled or disabled per tenant in [[09_Settings-M20_Tenant_Settings|M20]].

The modules and their layer groupings are:

| **Layer** | **Modules** |
|---|---|
| Student Lifecycle | Lead Management ([[03_Student-M01_Lead_Management|M01]]), Student & Guardian CRM ([[03_Student-M02_Student_Guardian_CRM|M02]]), Assessment & Placement ([[03_Student-M03_Assessment_Placement|M03]]), Enrolment & Lifecycle ([[03_Student-M04_Enrolment_Lifecycle|M04]]) |
| Academic Operations | Timetabling ([[04_Academic-M05_Timetabling_Scheduling|M05]]), Attendance & Makeups ([[04_Academic-M06_Attendance_Makeups|M06]]), Feedback & Communications ([[04_Academic-M07_Feedback_Communications|M07]]), Academic Courses & Catalogue ([[04_Academic-M11_Academic_Courses|M11]]), Assignment Library ([[04_Academic-M14_Assignment_Library|M14]]), Progress Tracking ([[04_Academic-M19_Progress_Tracking|M19]]) |
| People & HR | Staff & Performance ([[05_People-M09_Staff_Performance|M09]]), People, Forms & Documents ([[05_People-M12_People_Forms|M12]]) |
| Finance | Finance & Billing ([[06_Finance-M08_Finance_Billing|M08]]) |
| Operations & Automation | Automation & Communications ([[07_Operations-M13_Automation_Communications|M13]]), Task Management ([[07_Operations-M16_Task_Management|M16]]) |
| Inventory | Inventory ([[M15 — Inventory|M15]]) |
| Management & Reporting | Management Dashboard ([[08_Management-M10_Management_Dashboard|M10]]) |
| Platform Configuration | Tenant Settings ([[09_Settings-M20_Tenant_Settings|M20]]) |

All modules are active for IMI in v1.

---

# 4. Student Identification

Every student receives a permanent, unique Student ID on record creation.

| **Property** | **Value** |
|---|---|
| Format | OrgPrefix-#### (platform-wide sequential number. No branch code. Ever.) |
| IMI format | IMI-0001 |
| Locked | Format cannot be changed after the first student record is created |
| Permanent | Student IDs are never reused, even if the student withdraws or is archived |

> **Note:** The Student ID never includes a branch code, regardless of the number of branches.

---

# 5. Platform-Wide Rules

The following rules apply across all modules, all roles, and all tenants. No configuration, override, or permission can bypass these rules unless a specific exception is noted.

| **Rule** | **Detail** |
|---|---|
| Leads are never deleted | Lead records are permanent. Terminal statuses are Won, Lost, and Archived. Archived leads are retained indefinitely. |
| No decimal session counts | All session deductions are whole numbers. Non-integer results are blocked at scheduling with an alert. Admin can override with a logged reason. |
| Deduction at attendance, not scheduling | Session units are deducted from a student's balance when attendance is confirmed, not when the session is scheduled. |
| DNC always wins | A Do Not Contact flag suppresses all non-essential communications regardless of subscription status. The following categories always send regardless of DNC status: invoice and payment communications (financial), safeguarding and welfare notifications, [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern escalation communications. DNC is an internal operational flag, not a legally binding directive. |
| VAT calculated after discount | Discounts are applied to the subtotal first. VAT (5%) is calculated on the post-discount amount. |
| One discount per student per billing period | Only one discount can be applied per student per invoice. A multi-subject discount and a manual discount cannot stack. |
| Student IDs are permanent | A Student ID is assigned once and never reused. |
| Student ID format is locked | The format cannot be changed after the first student record is created. |
| Cumulative records are never deleted | Academic, attendance, financial, and communication history are retained permanently regardless of lifecycle status. |
| Waitlist is fully admin-driven | No automatic promotion from the waitlist. Every offer is manually triggered by Admin. |
| First booking wins on room conflicts | The first confirmed booking holds a room. The system alerts Admin and suggests reallocation for the conflicting session. |
| Holiday pricing is abolished | No separate holiday pricing rates exist. Special pricing for holiday programmes uses predefined special rate packages only. |
| Approval gateway actions are logged | Every approval gateway action is recorded with: action type, requester name and role, approver name and role, timestamp, and reason. |

---

# 6. Platform-Wide Display Standards

These standards apply to every screen, every export, and every document generated by the platform. They are not configurable at module level.

| **Standard** | **Rule** |
|---|---|
| Date format | DD/MM/YYYY throughout. Applied to all displayed dates, input fields, exported files, and generated documents. |
| Currency format | AED 4,000 (currency code, space, amount with comma thousands separator). Applied to all financial figures. |
| Timestamps | Displayed in the logged-in user's device timezone. Stored in UTC at database level. |
| Language | English only in v1 |
| Character support | ASCII/Latin characters only in v1 |
| Session units | Whole numbers only. No decimal session counts anywhere in the platform. |

---

# 7. Academic Year Structure

The Academic Calendar is configured per Organisation in [[09_Settings-M20_Tenant_Settings|M20]] and drives scheduling, billing, attendance, and communications across the platform.

## 7.1 Calendar Periods

| **Period Type** | **Description** |
|---|---|
| Term | A named academic period with a start and end date. Sessions are scheduled and billed within terms. IMI default: 3 terms per year. |
| Half-Term Break | A mid-term pause period. Configurable per student: sessions continue (billed) or pause (not billed) during the break. |
| Holiday Break | A full break between terms. No regular sessions are scheduled during holiday breaks unless they are Holiday Programme events. |
| Closure | A specific date or date range when the facility is closed. Sessions cannot be scheduled on closure dates. |
| Public Holidays | A pre-loaded UAE government public holiday template is provided by default. Super Admin and Admin Head can upload a custom template and edit individual dates. Sessions can technically be scheduled on public holidays — the system warns but does not block. |

## 7.2 Year Groups

Enrolla supports dual naming for year groups to accommodate different curriculum naming conventions used in the UAE.

| **Enrolla Name** | **Also Known As** | **Notes** |
|---|---|---|
| FS1 | Nursery | EYFS. Guardian must be present for all sessions (KHDA requirement at IMI). |
| FS2 | Kindergarten 1 | EYFS. Guardian must be present for all sessions (KHDA requirement at IMI). |
| Year 1 | Kindergarten 2 | Primary |
| Year 2 | Grade 1 | Primary |
| Year 3 | Grade 2 | Primary |
| Year 4 | Grade 3 | Primary |
| Year 5 | Grade 4 | Primary |
| Year 6 | Grade 5 | Primary |
| Year 7 | Grade 6 | Lower Secondary |
| Year 8 | Grade 7 | Lower Secondary |
| Year 9 | Grade 8 | Lower Secondary |
| Year 10 | Grade 9 | Senior. Exam countdown widget active on student profile. |
| Year 11 | Grade 10 | Senior |
| Year 12 | Grade 11 | Senior |
| Year 13 | Grade 12 | Senior. Final year before graduation. |
| Graduated | — | Transitional position applied at the end of the student's final year. Status moves to Alumni after a platform-default period of 30 days, configurable by Super Admin in [[09_Settings-M20_Tenant_Settings|M20]]. |
| Alumni | — | Permanent post-graduation status |

## 7.3 Year Group Progression

Year group progression is automatic. On the configured graduation date (IMI default: approximately end of July), all active students advance to the next year group.

| **Property** | **Value** |
|---|---|
| Trigger | Configured graduation date in [[09_Settings-M20_Tenant_Settings|M20]] |
| Year 13 completion | Student transitions to Graduated status on graduation date |
| Graduated to Alumni | After a platform-default period of 30 days, configurable by Super Admin in [[09_Settings-M20_Tenant_Settings|M20]] |
| Manual override | Super Admin can override year group for any individual student at any time with a logged reason |
| KHDA requirement | Guardian must be present for all FS1 and FS2 sessions. Flagged on student profile. Cannot be disabled for these year groups at IMI. |

---

# 8. Data Isolation

All data entities are scoped to a tenant at the database level via a mandatory tenant identifier.

| **Property** | **Value** |
|---|---|
| Entities scoped | Students, guardians, staff, sessions, invoices, courses, concerns, tasks |
| Cross-tenant access | API calls from one tenant session cannot retrieve data from another tenant scope |
| Platform admin access | The Enrolla Platform Admin Panel ([[01_Foundation-PL05_Platform_Admin|PL-05]]) bypasses tenant scope for support purposes only. See [[01_Foundation-PL05_Platform_Admin|PL-05]] for full specification. |

---

# 9. IMI Reference Configuration

Improve ME Institute (IMI) is the reference tenant for Enrolla v1. The following summarises IMI's structural configuration.

| **Setting** | **IMI Value** |
|---|---|
| Organisation name | Improve ME Institute |
| Branch | Gold & Diamond Park, Dubai (GDP) |
| Departments | Primary (FS1–Y6), Lower Secondary (Y7–Y9), Senior (Y10–Y13) |
| Student ID format | IMI-#### (no branch code ever included) |
| Default session duration — FS1, FS2 | 45 minutes (configurable per subject in [[04_Academic-M11_Academic_Courses|M11]]) |
| Default session duration — Y1 and above | 60 minutes (configurable per subject in [[04_Academic-M11_Academic_Courses|M11]]) |
| Academic year structure | 3 terms per year + Winter Break + Spring Break |
| Graduation date | Approximately end of July annually |
| Graduated → Alumni transition | 30 days (platform default, configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Year groups | FS1/Nursery, FS2/KG1, Y1/KG2, Y2/G1, Y3/G2, Y4/G3, Y5/G4, Y6/G5, Y7/G6, Y8/G7, Y9/G8, Y10/G9, Y11/G10, Y12/G11, Y13/G12, Graduated, Alumni |
| Currency | AED (UAE Dirham) |
| VAT rate | 5% (UAE standard) |
| Active students | 1,800+ |
| Active staff | 40+ |
| KHDA requirement | Guardian present for all FS1 and FS2 sessions |
| Cross-branch visibility | Off by default (single-branch tenant; applies when second branch added) |

Full IMI operational configuration including pricing, billing defaults, communication defaults, attendance defaults, toggle states, and integration settings is documented in [[02_Reference-REF03_Glossary|REF-03]].
