import { useState } from "react";

const STATUS = {
  "✅": { label: "Built", color: "#3B6D11", bg: "#EAF3DE" },
  "🟡": { label: "Partial", color: "#854F0B", bg: "#FAEEDA" },
  "❌": { label: "Not built", color: "#A32D2D", bg: "#FCEBEB" },
  "🔵": { label: "Phase 2", color: "#185FA5", bg: "#E6F1FB" },
  "⬜": { label: "Backend only", color: "#5F5E5A", bg: "#F1EFE8" },
};

const modules = [
  { id: "PL-01/04", name: "Platform & Security", features: [
    { name: "Multi-tenant isolation (RLS)", s: "⬜", note: "Backend architecture; no frontend surface", band: "B1" },
    { name: "Audit trail", s: "🟡", note: "Settings shell only", band: "B1" },
    { name: "Approval gateway", s: "🟡", note: "HOD dashboard only; no /approvals screen", band: "B1" },
    { name: "30-day Graduated→Alumni transition", s: "⬜", note: "Background job, no UI", band: "B1" },
    { name: "Login screen", s: "🟡", note: "UI only — accepts any input, no real auth", band: "B1" },
    { name: "MFA enrolment", s: "❌", note: "", band: "B1" },
    { name: "Password reset flow", s: "❌", note: "", band: "B1" },
  ]},
  { id: "PL-02", name: "RBAC", features: [
    { name: "8 primary roles + role switcher", s: "✅", note: "Defined in lib/role-config.ts", band: "B1" },
    { name: "Nav access map per role (23 nav items)", s: "✅", note: "", band: "B1" },
    { name: "reports.viewFinancial gate", s: "✅", note: "Applied on student profile & reports", band: "B1/2" },
    { name: "staff.viewCPDDetail tiered visibility", s: "✅", note: "HR/Finance vs HOD differentiated", band: "B2" },
    { name: "Lead pipeline role tiers (Tier 1–3)", s: "✅", note: "Via permission keys", band: "B2" },
    { name: "Settings → Roles & Permissions editor", s: "✅", note: "Interactive permissions table", band: "B1/2" },
    { name: "Developer role (platform-only)", s: "❌", note: "Explicitly excluded per PRD", band: "B1" },
  ]},
  { id: "M01", name: "Lead Management", features: [
    { name: "11-stage pipeline (Kanban + List views)", s: "✅", note: "", band: "B2" },
    { name: "Inline lead creation", s: "✅", note: "", band: "B2" },
    { name: "Public web form capture", s: "❌", note: "No tenant-website embed", band: "B2" },
    { name: "CSV bulk import", s: "❌", note: "", band: "B2" },
    { name: "DNC flag + warning interstitial", s: "🟡", note: "Badge visible; no interstitial on click", band: "B2" },
    { name: "Duplicate detection modal", s: "❌", note: "No check against existing records on create", band: "B2" },
    { name: "Sibling detection / banner", s: "✅", note: "", band: "B2" },
    { name: "Activity log on lead", s: "✅", note: "", band: "B2" },
    { name: "Stage-gated WhatsApp message templates", s: "✅", note: "whatsapp-block.tsx reused across dialogs", band: "B2" },
    { name: "Book / Log / Skip Assessment dialogs", s: "✅", note: "", band: "B2" },
    { name: "Book / Log Trial + skip prompt", s: "✅", note: "", band: "B2" },
    { name: "Schedule Offer / Confirm dialogs", s: "✅", note: "", band: "B2" },
    { name: "Convert-to-Student flow", s: "✅", note: "", band: "B2" },
    { name: "Create Enrolment / Invoice / Record Payment", s: "✅", note: "Atomic Paid→Won", band: "B2" },
    { name: "Auto-inactive 60-day archive", s: "❌", note: "No warning banner or archive surface", band: "B2" },
    { name: "Referral programme tracking", s: "🟡", note: "UI exists; no milestone engine", band: "B2" },
    { name: "Fallback escalation chain", s: "❌", note: "", band: "B2" },
    { name: "Lead ownership / assignment / reassignment", s: "✅", note: "", band: "B2" },
    { name: "Walk-in quick-add", s: "❌", note: "Only generic 'new lead'", band: "B2" },
  ]},
  { id: "M02/M17/M18", name: "Student & Guardian CRM", features: [
    { name: "Student list page", s: "✅", note: "", band: "B1" },
    { name: "Student profile (11 tabs)", s: "✅", note: "", band: "B1/2" },
    { name: "Guardian list page", s: "✅", note: "", band: "B1" },
    { name: "Guardian profile (7 tabs)", s: "✅", note: "", band: "B1/2" },
    { name: "Family linking (student↔guardian)", s: "✅", note: "", band: "B1" },
    { name: "Co-parent three states", s: "❌", note: "Not modelled in UI", band: "B1" },
    { name: "DNC flag + contact-attempt interstitial", s: "🟡", note: "Editable; no interstitial on contact action", band: "B1" },
    { name: "Unsubscribed flag (distinct from DNC)", s: "✅", note: "", band: "B1" },
    { name: "Merge (student or guardian)", s: "✅", note: "", band: "B1" },
    { name: "24-hour merge rollback", s: "❌", note: "No rollback timer", band: "B1" },
    { name: "School directory", s: "❌", note: "Free-text only; no directory", band: "B2" },
    { name: "Communication log", s: "✅", note: "", band: "B1/2" },
    { name: "Profile update link / token generation", s: "🟡", note: "Named in /people forms list only; no UI on guardian profile", band: "B2" },
    { name: "Right-to-be-forgotten / erasure", s: "❌", note: "", band: "B1" },
  ]},
  { id: "M03", name: "Assessment & Placement", features: [
    { name: "Assessments list page (3 tabs)", s: "✅", note: "", band: "B2" },
    { name: "Booking flow", s: "✅", note: "", band: "B2" },
    { name: "Smart slot ranking", s: "🟡", note: "Tab exists; engine is static", band: "B2" },
    { name: "Outcome entry", s: "✅", note: "", band: "B2" },
    { name: "Skip assessment flow", s: "✅", note: "", band: "B2" },
    { name: "Self-service booking link / public page", s: "❌", note: "No tokenised-URL generator", band: "B2" },
    { name: "Outcome PDF generation", s: "❌", note: "", band: "B2" },
    { name: "CAT4 flat rate configuration", s: "❌", note: "Not surfaced in catalogue UI", band: "B1" },
  ]},
  { id: "M04", name: "Enrolment Lifecycle", features: [
    { name: "Enrolment list page (3 tabs)", s: "✅", note: "", band: "B1" },
    { name: "New enrolment dialog", s: "✅", note: "", band: "B1" },
    { name: "Withdrawal flow", s: "✅", note: "", band: "B1" },
    { name: "Reactivate withdrawal", s: "✅", note: "", band: "B1" },
    { name: "Unbilled sessions tracker", s: "✅", note: "", band: "B2" },
    { name: "Payment plans", s: "🟡", note: "Settings section only; no per-student application", band: "B2" },
    { name: "Fee waiver", s: "🟡", note: "Write-off dialog covers it; no dedicated waiver flow", band: "B2" },
    { name: "Fee-exempt toggle", s: "❌", note: "", band: "B2" },
    { name: "Sibling discount", s: "❌", note: "No system-level rule", band: "B2" },
    { name: "Enrolment fee (AED 300 lifetime)", s: "✅", note: "", band: "B1" },
    { name: "Frequency tier (Standard/Mid/Next/Top)", s: "✅", note: "", band: "B1" },
  ]},
  { id: "M05", name: "Timetabling & Scheduling", features: [
    { name: "Timetable page (Day/Week/Month/List views)", s: "✅", note: "", band: "B1" },
    { name: "Create session", s: "✅", note: "", band: "B1" },
    { name: "Recurrence fields", s: "✅", note: "", band: "B1" },
    { name: "Room booking", s: "✅", note: "", band: "B1" },
    { name: "Cover sessions", s: "🟡", note: "Reason field only; no cover-assignment workflow", band: "B2" },
    { name: "Waitlist", s: "❌", note: "", band: "B2" },
    { name: "Operating-hours soft warnings", s: "❌", note: "Band 1 locked behaviour — not surfaced", band: "B1" },
    { name: "Public holiday soft warnings", s: "❌", note: "Band 1 locked behaviour — not surfaced", band: "B1" },
    { name: "Calendar heatmap / occupancy modal", s: "✅", note: "", band: "B2" },
  ]},
  { id: "M06", name: "Attendance & Makeups", features: [
    { name: "Attendance register", s: "✅", note: "", band: "B1/2" },
    { name: "5 attendance statuses", s: "✅", note: "Present / Late / Absent Notified / Absent Not Notified / No Show", band: "B1/2" },
    { name: "Correct attendance", s: "✅", note: "", band: "B2" },
    { name: "Tiered reminder banners (24h/48h/72h)", s: "✅", note: "Colour-coded yellow/amber/red", band: "B2" },
    { name: "Makeup log tab", s: "✅", note: "", band: "B2" },
    { name: "Makeup booking flow", s: "❌", note: "Log visible; no booking dialog from absence row", band: "B2" },
    { name: "Makeup carry-over", s: "🟡", note: "Count visible; no term-end carry-over logic", band: "B2" },
    { name: "No-show 48h reason logging", s: "❌", note: "No countdown UI", band: "B2" },
    { name: "Concern Engine (M06.A)", s: "🟡", note: "Concerns surfaced as data; no trigger engine", band: "B2" },
    { name: "Early-mark with reason", s: "❌", note: "", band: "B2" },
  ]},
  { id: "M07", name: "Feedback & Communications", features: [
    { name: "Feedback queue (approve/reject/send)", s: "✅", note: "", band: "B2" },
    { name: "Per-class feedback submission (teacher)", s: "🟡", note: "Review slideover exists; no per-class submit", band: "B2" },
    { name: "AI expansion / summary", s: "🟡", note: "Static text; no regenerate button", band: "B2" },
    { name: "Class discussion", s: "✅", note: "", band: "B2" },
    { name: "Announcements", s: "✅", note: "", band: "B2" },
    { name: "Complaints / tickets", s: "✅", note: "", band: "B2" },
    { name: "Dual sign-off on complaints", s: "❌", note: "No sign-off workflow", band: "B2" },
    { name: "NPS surveys", s: "✅", note: "", band: "B2" },
    { name: "Detractor auto-concern trigger", s: "❌", note: "No trigger engine", band: "B2" },
    { name: "Progress report generation", s: "✅", note: "", band: "B2" },
    { name: "DNC handling in outbound messages", s: "❌", note: "No DNC interstitial on send", band: "B2" },
  ]},
  { id: "M08", name: "Finance & Billing", features: [
    { name: "Finance page (Invoices/Payments/Credits/Unbilled/Reports)", s: "✅", note: "", band: "B1/2" },
    { name: "Invoice builder", s: "✅", note: "Multi-line, VAT calc, live preview", band: "B1" },
    { name: "Bulk invoicing flow", s: "🟡", note: "Permission-gated button; actual flow static", band: "B2" },
    { name: "Payment recording", s: "✅", note: "", band: "B1" },
    { name: "Discount request / approval", s: "✅", note: "", band: "B1" },
    { name: "Credit issuance", s: "✅", note: "", band: "B1" },
    { name: "Refund 3-stage approval", s: "🟡", note: "Permissions defined; no pending-queue UI", band: "B1" },
    { name: "Bad debt write-off", s: "🟡", note: "Write-off dialog; no explicit Bad Debt reason code", band: "B2" },
    { name: "Payment plans (scheduled billing)", s: "🟡", note: "Settings only; no per-student plan application", band: "B2" },
    { name: "Unbilled sessions tracker", s: "✅", note: "", band: "B2" },
    { name: "Bank accounts & revenue routing", s: "✅", note: "Department→bank map in Settings", band: "B1/2" },
    { name: "VAT 5% post-discount calculation", s: "✅", note: "", band: "B1" },
    { name: "Payment gateway integration (Telr/NI/Stripe)", s: "🔵", note: "Phase 2", band: "B3" },
  ]},
  { id: "M09", name: "Staff Performance", features: [
    { name: "Staff directory", s: "✅", note: "", band: "B1/2" },
    { name: "Staff profile flyout", s: "✅", note: "", band: "B1" },
    { name: "CPD tracking", s: "✅", note: "", band: "B2" },
    { name: "CPD visibility tiers (HR vs HOD summary)", s: "✅", note: "Permission-gated", band: "B2" },
    { name: "Performance reviews", s: "❌", note: "No review workflow surfaced", band: "B2" },
    { name: "HR dashboard", s: "✅", note: "Alternate tab for HR/Finance role", band: "B2" },
    { name: "Off-boarding hard-block checklist", s: "🟡", note: "Permission exists; workflow not surfaced", band: "B2" },
    { name: "Immediate access revocation", s: "🟡", note: "Permission exists; no dedicated action button", band: "B2" },
    { name: "Emergency leave", s: "✅", note: "", band: "B2" },
  ]},
  { id: "M10", name: "Management Dashboard", features: [
    { name: "Dashboard KPI cards", s: "✅", note: "", band: "B2" },
    { name: "Churn widget", s: "✅", note: "", band: "B2" },
    { name: "Revenue chart", s: "✅", note: "", band: "B2" },
    { name: "Inventory alerts widget", s: "✅", note: "", band: "B2/3" },
    { name: "Occupancy detail modal", s: "✅", note: "", band: "B2" },
    { name: "Analytics page (Revenue/Occupancy/Churn/Staff)", s: "✅", note: "", band: "B2" },
  ]},
  { id: "M11/M14", name: "Courses & Assignment Library", features: [
    { name: "Subjects catalogue in Settings (interactive)", s: "✅", note: "", band: "B1" },
    { name: "Assignments page / tab", s: "🟡", note: "Tab exists; no folder/topic structure", band: "B2" },
    { name: "Quick Score Entry from session", s: "❌", note: "Not surfaced from timetable", band: "B2" },
    { name: "Submission tracking", s: "🟡", note: "Status shown; no submission flow", band: "B2" },
    { name: "Grading / rubrics", s: "❌", note: "", band: "B2" },
    { name: "Topic linking", s: "❌", note: "", band: "B2" },
    { name: "Absent-zero handling", s: "❌", note: "", band: "B2" },
  ]},
  { id: "M13", name: "Automation & Communications", features: [
    { name: "Automation templates & rules", s: "✅", note: "", band: "B2" },
    { name: "Trigger library", s: "✅", note: "Static content", band: "B2" },
    { name: "Dispatch queue (copy/mark-as-sent)", s: "✅", note: "", band: "B2" },
    { name: "Internal messaging", s: "✅", note: "", band: "B2" },
    { name: "Marketing moments", s: "✅", note: "", band: "B2" },
    { name: "Execution log", s: "✅", note: "", band: "B2" },
    { name: "WhatsApp copy-paste block", s: "✅", note: "Reused across all journey dialogs", band: "B2" },
    { name: "Live dispatch (F.16 adapters)", s: "🔵", note: "Phase 2", band: "B3" },
  ]},
  { id: "M15", name: "Inventory", features: [
    { name: "Inventory page (Catalogue/Reorder Alerts/Ledger/Suppliers)", s: "✅", note: "", band: "B3" },
    { name: "Stock take wizard", s: "✅", note: "", band: "B3" },
    { name: "Reorder alerts", s: "✅", note: "", band: "B3" },
    { name: "Auto-deduct on enrolment (ledger entry type)", s: "✅", note: "", band: "B3" },
    { name: "Dashboard inventory cards", s: "✅", note: "", band: "B2/3" },
  ]},
  { id: "M16", name: "Task Management", features: [
    { name: "Tasks page (List / Kanban / Calendar views)", s: "✅", note: "", band: "B2" },
    { name: "Task creation dialog", s: "✅", note: "", band: "B2" },
    { name: "Sub-tasks (checklist)", s: "✅", note: "", band: "B2" },
    { name: "Linked record context strip", s: "🟡", note: "Partial implementation", band: "B2" },
    { name: "Auto-created tasks (feedback/unbilled/lead follow-up)", s: "🟡", note: "Some hooks wired; not all sources", band: "B2" },
    { name: "Recurring tasks", s: "❌", note: "No recurrence editor in /tasks", band: "B2" },
    { name: "Task templates", s: "❌", note: "", band: "B2" },
    { name: "Snooze", s: "❌", note: "", band: "B2" },
  ]},
  { id: "M19", name: "Progress Tracking", features: [
    { name: "Progress page (Trackers/Reports/Alerts/Assignments)", s: "✅", note: "", band: "B2" },
    { name: "Progress tracker grid", s: "✅", note: "", band: "B2" },
    { name: "Academic alerts", s: "✅", note: "", band: "B2" },
    { name: "Report approval workflow (kanban columns)", s: "✅", note: "", band: "B2" },
    { name: "Generate Report dialog", s: "✅", note: "", band: "B2" },
    { name: "AI narrative generation", s: "🟡", note: "Static text; no regenerate button", band: "B2" },
    { name: "Predicted grade engine", s: "🟡", note: "Static values; no compute", band: "B2" },
    { name: "Assignment tracking", s: "🟡", note: "Simple list only", band: "B2" },
    { name: "Intervention tracking", s: "❌", note: "", band: "B2" },
    { name: "Two-year tracker lock", s: "❌", note: "", band: "B2" },
    { name: "Past-paper section", s: "❌", note: "", band: "B2" },
  ]},
  { id: "M20", name: "Tenant Settings", features: [
    { name: "17-section settings nav", s: "✅", note: "", band: "B1/2" },
    { name: "Organisation (interactive)", s: "✅", note: "", band: "B1" },
    { name: "Branches (add/edit/archive)", s: "✅", note: "", band: "B1" },
    { name: "Departments (interactive, colour picker)", s: "✅", note: "", band: "B1" },
    { name: "Rooms (capacity, soft/hard caps)", s: "✅", note: "", band: "B1" },
    { name: "Academic calendar (terms, holidays, ribbon view)", s: "✅", note: "", band: "B1" },
    { name: "Billing & invoicing + revenue tags", s: "✅", note: "", band: "B1/2" },
    { name: "Payment plans section", s: "🟡", note: "Static; no interactive plan builder", band: "B2" },
    { name: "Subjects & catalogue", s: "✅", note: "Interactive", band: "B1" },
    { name: "Roles & permissions matrix (interactive)", s: "✅", note: "", band: "B1" },
    { name: "Notifications", s: "🟡", note: "Static content", band: "B3" },
    { name: "Templates", s: "🟡", note: "", band: "B2" },
    { name: "Feature toggles", s: "🟡", note: "Static toggles", band: "B3" },
    { name: "Integrations", s: "🟡", note: "Phase 2 placeholder", band: "B3" },
    { name: "Churn & dashboard weights", s: "🟡", note: "", band: "B2" },
    { name: "Audit log", s: "🟡", note: "Shell only", band: "B1" },
    { name: "Data & privacy", s: "🟡", note: "Static content", band: "B1" },
  ]},
];

const top10 = [
  { mod: "M01", title: "Lead duplicate detection modal", desc: "No check against existing guardian phone/email/child+year on 'new lead' create. Every demo hits this flow." },
  { mod: "M02/M18", title: "Guardian DNC contact-attempt interstitial", desc: "DNC badge renders but clicking Contact/Message does not surface the warning-and-acknowledge modal. Locked compliance rule (AMD-01)." },
  { mod: "M06", title: "Makeup booking flow", desc: "Makeup log shows existing entries but there is no 'Book makeup' dialog from an absence row." },
  { mod: "M14", title: "Quick Score Entry from session", desc: "Primary teacher path for classwork scoring. Teachers clicking into a session have no scoring UI." },
  { mod: "M18", title: "Profile update link generation on guardian profile", desc: "Only referenced in /people forms list. No 'Send profile update link' button, token preview, or expiry display on guardian profile." },
  { mod: "M05", title: "Operating-hours and public-holiday soft warnings", desc: "Creating a session on a holiday or outside hours produces no warning. Band 1 locked behaviour — obvious omission in scheduling demo." },
  { mod: "M01", title: "Auto-inactive 60-day lead archive workflow", desc: "No warning banner, no auto-archiving task, no archived-lead surface." },
  { mod: "M08", title: "Bulk invoicing flow", desc: "Permission and button exist but actual flow (pick enrolments → preview → generate in batch) is not implemented." },
  { mod: "M09", title: "Off-boarding hard-block checklist", desc: "Permission exists but the three hard-block checklist (open sessions / open concerns / outstanding marking) is not surfaced." },
  { mod: "M16", title: "Recurring tasks", desc: "No recurrence UI or management tab in /tasks despite list/kanban/calendar all being built." },
];

function Pill({ s }) {
  const st = STATUS[s];
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 500, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>
      {st.label}
    </span>
  );
}

function ModuleCard({ mod }) {
  const [open, setOpen] = useState(false);
  const counts = mod.features.reduce((acc, f) => { acc[f.s] = (acc[f.s] || 0) + 1; return acc; }, {});

  return (
    <div style={{ border: "0.5px solid #e2e8f0", borderRadius: 12, marginBottom: 10, overflow: "hidden", background: "#fff" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", cursor: "pointer", background: open ? "#f8fafc" : "#fff" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{mod.id} — {mod.name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {counts["✅"] && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: "#EAF3DE", color: "#3B6D11", fontWeight: 500 }}>{counts["✅"]}</span>}
          {counts["🟡"] && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: "#FAEEDA", color: "#854F0B", fontWeight: 500 }}>{counts["🟡"]}</span>}
          {counts["❌"] && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: "#FCEBEB", color: "#A32D2D", fontWeight: 500 }}>{counts["❌"]}</span>}
          {counts["🔵"] && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: "#E6F1FB", color: "#185FA5", fontWeight: 500 }}>{counts["🔵"]}</span>}
          <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{mod.features.length} features</span>
          <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: "0.5px solid #e2e8f0" }}>
          {mod.features.map((f, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 60px", gap: 8, padding: "8px 16px", borderBottom: i < mod.features.length - 1 ? "0.5px solid #f1f5f9" : "none", alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 12.5, color: "#1e293b", lineHeight: 1.4 }}>{f.name}</div>
                {f.note && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{f.note}</div>}
              </div>
              <div><Pill s={f.s} /></div>
              <div><span style={{ fontSize: 10, color: "#94a3b8", padding: "1px 5px", border: "0.5px solid #e2e8f0", borderRadius: 4 }}>{f.band}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [filter, setFilter] = useState("all");

  const allFeatures = modules.flatMap(m => m.features);
  const built = allFeatures.filter(f => f.s === "✅").length;
  const partial = allFeatures.filter(f => f.s === "🟡").length;
  const notBuilt = allFeatures.filter(f => f.s === "❌").length;
  const p2be = allFeatures.filter(f => f.s === "🔵" || f.s === "⬜").length;
  const total = allFeatures.length;

  const filteredModules = filter === "all" ? modules : modules.map(m => ({
    ...m,
    features: m.features.filter(f => {
      if (filter === "built") return f.s === "✅";
      if (filter === "partial") return f.s === "🟡";
      if (filter === "missing") return f.s === "❌";
      return true;
    })
  })).filter(m => m.features.length > 0);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 780, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>Enrolla — Feature Coverage Audit · 24 April 2026</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { num: total, label: "Total features", color: "#0f172a" },
            { num: built, label: `Built · ${Math.round(built/total*100)}%`, color: "#3B6D11" },
            { num: partial, label: `Partial · ${Math.round(partial/total*100)}%`, color: "#854F0B" },
            { num: notBuilt, label: `Not built · ${Math.round(notBuilt/total*100)}%`, color: "#A32D2D" },
            { num: p2be, label: "Phase 2 / Backend", color: "#185FA5" },
          ].map((m, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 500, color: m.color }}>{m.num}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 6, borderRadius: 3, overflow: "hidden", display: "flex", marginBottom: 20 }}>
          <div style={{ width: `${built/total*100}%`, background: "#639922" }} />
          <div style={{ width: `${partial/total*100}%`, background: "#EF9F27" }} />
          <div style={{ width: `${notBuilt/total*100}%`, background: "#E24B4A" }} />
          <div style={{ width: `${p2be/total*100}%`, background: "#378ADD" }} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All modules" },
            { key: "missing", label: "Not built only" },
            { key: "partial", label: "Partial only" },
            { key: "built", label: "Built only" },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 99, border: "0.5px solid", borderColor: filter === f.key ? "#0f172a" : "#e2e8f0", background: filter === f.key ? "#0f172a" : "#fff", color: filter === f.key ? "#fff" : "#64748b", cursor: "pointer" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>By module — click to expand</div>
      {filteredModules.map((mod, i) => <ModuleCard key={i} mod={mod} />)}

      <div style={{ border: "0.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginTop: 24 }}>
        <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #e2e8f0", fontSize: 13, fontWeight: 500, color: "#0f172a", background: "#f8fafc" }}>
          Top 10 priority gaps for next build sprint
        </div>
        {top10.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "11px 16px", borderBottom: i < 9 ? "0.5px solid #f1f5f9" : "none", alignItems: "flex-start" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#cbd5e1", minWidth: 22, paddingTop: 1 }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1e293b", lineHeight: 1.3 }}>
                <span style={{ fontSize: 11, padding: "1px 6px", background: "#FCEBEB", color: "#A32D2D", borderRadius: 4, marginRight: 6, fontWeight: 500 }}>{item.mod}</span>
                {item.title}
              </div>
              <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
