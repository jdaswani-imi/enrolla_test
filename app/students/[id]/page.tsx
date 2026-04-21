"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  AlertTriangle,
  PenLine,
  Send,
  ListPlus,
  Clock,
  AlertCircle,
  BookOpen,
  CreditCard,
  UserPlus,
  MessageSquare,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Upload,
  Download,
  Trash2,
  Pencil,
  Lock,
  Zap,
  ClipboardCheck,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import {
  studentDetail,
  guardians,
  students,
  staffMembers,
  trials,
  assessments,
  type StudentInvoice,
  type Trial,
  type Assessment,
} from "@/lib/mock-data";
import { subjectsForYearGroup } from "@/components/journey/subjects";
import { useJourney, BILAL_STUDENT_ID } from "@/lib/journey-store";
import { CreateEnrolmentDialog } from "@/components/journey/create-enrolment-dialog";
import {
  NewEnrolmentDialog,
  type StudentDepartment,
} from "@/components/enrolment/new-enrolment-dialog";
import { RecordPaymentDialog } from "@/components/journey/record-payment-dialog";
import { ExportDialog, type ExportFormat } from "@/components/ui/export-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type FireToast = (msg: string, tone?: "default" | "warning") => void;

const STUDENT_NAME = "Aisha Rahman";
const STUDENT_ID = "IMI-0001";

// ─── Student Profile (editable) ───────────────────────────────────────────────

type Gender = "Male" | "Female" | "Prefer not to say";
type Relationship =
  | "Mother" | "Father" | "Grandparent" | "Uncle" | "Aunt" | "Legal Guardian" | "Other";

interface StudentProfile {
  firstName: string;
  lastName: string;
  preferredName: string;
  dob: string; // YYYY-MM-DD
  gender: Gender;
  nationality: string;
  phone: string;
  whatsappSame: boolean;
  whatsapp: string;
  email: string;
  studentId: string;
  dateEnrolled: string;
  yearGroup: string;
  school: string;
  targetGrades: { subject: string; grade: string }[];
  enrolledCoursesCount: number;
  attendanceThisTerm: string;
  sessionsRemaining: string;
  primaryGuardianId: string;
  primaryGuardianRelationship: Relationship;
  secondaryGuardianId: string | null;
  secondaryGuardianRelationship: Relationship;
  siblingIds: string[];
}

const INITIAL_PROFILE: StudentProfile = {
  firstName: "Aisha",
  lastName: "Rahman",
  preferredName: "",
  dob: "2011-03-12",
  gender: "Female",
  nationality: "Emirati",
  phone: "+971 50 123 4567",
  whatsappSame: true,
  whatsapp: "+971 50 123 4567",
  email: "fatima.rahman@gmail.com",
  studentId: STUDENT_ID,
  dateEnrolled: "12 Sep 2022",
  yearGroup: "Y8",
  school: "GEMS Wellington Academy",
  targetGrades: [
    { subject: "Maths",   grade: "A*" },
    { subject: "English", grade: "A"  },
    { subject: "Science", grade: "B+" },
  ],
  enrolledCoursesCount: 3,
  attendanceThisTerm: "87%",
  sessionsRemaining: "34",
  primaryGuardianId: "G-001",
  primaryGuardianRelationship: "Mother",
  secondaryGuardianId: null,
  secondaryGuardianRelationship: "Father",
  siblingIds: [],
};

const YEAR_GROUPS = [
  "KG1", "KG2",
  "Y1", "Y2", "Y3", "Y4", "Y5", "Y6",
  "Y7", "Y8", "Y9",
  "Y10", "Y11", "Y12", "Y13",
] as const;

const RELATIONSHIPS: Relationship[] = [
  "Mother", "Father", "Grandparent", "Uncle", "Aunt", "Legal Guardian", "Other",
];

function yearGroupToDepartment(yg: string): string {
  if (yg.startsWith("KG")) return "Primary";
  const n = Number(yg.replace("Y", ""));
  if (n <= 6) return "Primary";
  if (n <= 9) return "Lower Secondary";
  return "Senior";
}

function computeAge(dob: string): number {
  if (!dob) return 0;
  const parts = dob.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [y, m, d] = parts;
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age--;
  return age;
}

function formatDob(dob: string): string {
  if (!dob) return "—";
  const parts = dob.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dob;
  const [y, m, d] = parts;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d} ${months[m - 1]} ${y} (Age ${computeAge(dob)})`;
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function guardianName(id: string | null): string {
  if (!id) return "—";
  return guardians.find((g) => g.id === id)?.name ?? "Unknown";
}

function studentInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

// ─── Time slots (30-min, 08:00–19:30) ────────────────────────────────────────

const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 8; h <= 19; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
})();

function parseAedAmount(amount: string): number {
  const cleaned = amount.replace(/AED/i, "").replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatAed(n: number): string {
  return `AED ${n.toLocaleString()}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateShort(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = new Date(y, m - 1, d);
  return `${days[date.getDay()]} ${d} ${months[m - 1]}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SUBJECT_COLOR: Record<string, { chip: string; dot: string }> = {
  "Y8 Maths":   { chip: "bg-amber-100 text-amber-800 border border-amber-200",  dot: "bg-amber-500"  },
  "Y8 English": { chip: "bg-teal-100 text-teal-800 border border-teal-200",     dot: "bg-teal-500"   },
  "Y8 Science": { chip: "bg-blue-100 text-blue-800 border border-blue-200",     dot: "bg-blue-500"   },
};

const ENROLMENT_COLOR_CLASSES: Record<"amber" | "teal" | "blue", { header: string; badge: string }> = {
  amber: { header: "bg-amber-50 border-b border-amber-100", badge: "bg-amber-100 text-amber-700" },
  teal:  { header: "bg-teal-50 border-b border-teal-100",   badge: "bg-teal-100 text-teal-700"   },
  blue:  { header: "bg-blue-50 border-b border-blue-100",   badge: "bg-blue-100 text-blue-700"   },
};

// ─── Session Dots ─────────────────────────────────────────────────────────────

function SessionDots({
  attended,
  absent,
  remaining,
}: {
  attended: number;
  absent: number;
  remaining: number;
}) {
  const dots = [
    ...Array(attended).fill("attended"),
    ...Array(absent).fill("absent"),
    ...Array(remaining).fill("remaining"),
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {dots.map((type, i) => (
        <span
          key={i}
          title={type}
          className={cn(
            "w-3 h-3 rounded-full inline-block shrink-0",
            type === "attended"  && "bg-emerald-500",
            type === "absent"    && "bg-red-400",
            type === "remaining" && "border-2 border-slate-300 bg-white",
          )}
        />
      ))}
    </div>
  );
}

// ─── Zone 1 — Profile Header ──────────────────────────────────────────────────

type HeaderAction =
  | "addEnrolment"
  | "bookTrial"
  | "bookAssessment"
  | "recordPayment"
  | "raiseConcern"
  | "logNote"
  | "sendMessage"
  | "newTask";

function ProfileHeader({
  profile,
  fireToast,
  isJourneyStudent,
  onJourneyAddEnrolment,
  journeyStatusBadge,
  invoices,
  onPaymentRecorded,
}: {
  profile: StudentProfile;
  fireToast: FireToast;
  isJourneyStudent?: boolean;
  onJourneyAddEnrolment?: () => void;
  journeyStatusBadge?: { label: string; className: string } | null;
  invoices: StudentInvoice[];
  onPaymentRecorded: (invoiceId: string, paidAmount: number, fullyPaid: boolean) => void;
}) {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState<HeaderAction | null>(null);
  const displayName = `${profile.firstName} ${profile.lastName}`.trim();
  const yearLabel = profile.yearGroup.startsWith("KG") ? profile.yearGroup : `Year ${profile.yearGroup.replace("Y", "")}`;
  const department = yearGroupToDepartment(profile.yearGroup);

  const buttonActions: { label: string; Icon: React.ElementType; onClick: () => void }[] = [
    { label: "Create Invoice", Icon: FileText, onClick: () => router.push(`/finance/invoice/new?student=${profile.studentId}`) },
    {
      label: "Add Enrolment",
      Icon: Plus,
      onClick: () => (isJourneyStudent && onJourneyAddEnrolment ? onJourneyAddEnrolment() : setOpenDialog("addEnrolment")),
    },
    { label: "Book Trial",       Icon: Zap, onClick: () => setOpenDialog("bookTrial") },
    { label: "Book Assessment",  Icon: ClipboardCheck, onClick: () => setOpenDialog("bookAssessment") },
    { label: "Record Payment",   Icon: CreditCard, onClick: () => setOpenDialog("recordPayment") },
    { label: "Raise Concern",    Icon: AlertTriangle, onClick: () => setOpenDialog("raiseConcern") },
    { label: "Log Note",         Icon: PenLine, onClick: () => setOpenDialog("logNote") },
    { label: "Send Message",     Icon: Send, onClick: () => setOpenDialog("sendMessage") },
    { label: "New Task",         Icon: ListPlus, onClick: () => setOpenDialog("newTask") },
  ];

  return (
    <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 z-10">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        {/* Left — Avatar + Name + Badges */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg leading-none">
              {getInitials(profile.firstName, profile.lastName)}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{displayName}</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5 leading-none">{profile.studentId}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-300 text-slate-600">
                {yearLabel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                {department}
              </span>
              <span className="text-xs text-slate-500">{profile.school}</span>
            </div>
          </div>
        </div>

        {/* Right — Status Badges + Quick Actions */}
        <div className="flex flex-col items-end gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            {journeyStatusBadge ? (
              <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", journeyStatusBadge.className)}>
                {journeyStatusBadge.label}
              </span>
            ) : (
              <>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                  Active
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                  84 — Critical
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {buttonActions.map(({ label, Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                aria-label={label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Icon className="w-3 h-3 shrink-0" />
                {label}
              </button>
            ))}
            <Link
              href="/attendance"
              aria-label="Mark Attendance"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3 h-3 shrink-0" />
              Mark Attendance
            </Link>
          </div>
        </div>
      </div>

      <NewEnrolmentDialog
        open={openDialog === "addEnrolment"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        studentId={profile.studentId}
        studentName={displayName}
        yearGroup={profile.yearGroup}
        department={department as StudentDepartment}
      />
      <BookTrialStudentDialog
        open={openDialog === "bookTrial"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        studentName={displayName}
        studentId={profile.studentId}
        yearGroup={profile.yearGroup}
        department={department}
        fireToast={fireToast}
      />
      <BookAssessmentStudentDialog
        open={openDialog === "bookAssessment"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        studentName={displayName}
        yearGroup={profile.yearGroup}
        department={department}
        fireToast={fireToast}
      />
      <RecordPaymentStudentDialog
        open={openDialog === "recordPayment"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        invoices={invoices}
        fireToast={fireToast}
        onPaymentRecorded={onPaymentRecorded}
      />
      <RaiseConcernDialog
        open={openDialog === "raiseConcern"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        fireToast={fireToast}
      />
      <LogNoteDialog
        open={openDialog === "logNote"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        fireToast={fireToast}
      />
      <SendMessageDialog
        open={openDialog === "sendMessage"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        fireToast={fireToast}
      />
      <NewTaskDialog
        open={openDialog === "newTask"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        fireToast={fireToast}
      />
    </div>
  );
}

// ─── Header Action Dialogs ────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-slate-600">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const FIELD_INPUT =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";

function DialogActions({
  onCancel,
  onSubmit,
  submitLabel = "Save",
  submitDisabled,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}) {
  return (
    <DialogFooter className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitDisabled}
        className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </DialogFooter>
  );
}

function RaiseConcernDialog({
  open,
  onOpenChange,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fireToast: FireToast;
}) {
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("L1");
  const [description, setDescription] = useState("");
  const valid = subject && description.trim().length > 0;

  function submit() {
    fireToast(`Concern raised — ${level} ${subject}`);
    setSubject("");
    setLevel("L1");
    setDescription("");
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Raise Concern</DialogTitle>
          <DialogDescription>Flag a concern for {STUDENT_NAME}.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel required>Subject</FieldLabel>
            <select className={FIELD_INPUT} value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">Select subject…</option>
              <option>Y8 Maths</option>
              <option>Y8 English</option>
              <option>Y8 Science</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Level</FieldLabel>
            <select className={FIELD_INPUT} value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="L1">L1 — Teacher + HOD</option>
              <option value="L2">L2 — HOD + Academic Head</option>
              <option value="L3">L3 — Academic Head + Admin Head</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Description</FieldLabel>
            <textarea
              className={cn(FIELD_INPUT, "min-h-[100px] resize-y")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the concern…"
            />
          </div>
        </div>
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Submit"
          submitDisabled={!valid}
        />
      </DialogContent>
    </Dialog>
  );
}

function LogNoteDialog({
  open,
  onOpenChange,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fireToast: FireToast;
}) {
  const [note, setNote] = useState("");
  const [shared, setShared] = useState(false);
  const valid = note.trim().length > 0;

  function submit() {
    fireToast(`Note saved — ${shared ? "shared with parent" : "internal only"}`);
    setNote("");
    setShared(false);
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Log Note</DialogTitle>
          <DialogDescription>Add a note to {STUDENT_NAME}&apos;s record.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel required>Note</FieldLabel>
            <textarea
              className={cn(FIELD_INPUT, "min-h-[120px] resize-y")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write your note…"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Visibility</FieldLabel>
            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <button
                type="button"
                onClick={() => setShared((s) => !s)}
                aria-pressed={shared}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer",
                  shared ? "bg-amber-500" : "bg-slate-300",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    shared ? "translate-x-4" : "translate-x-0.5",
                  )}
                />
              </button>
              <span>{shared ? "Shared with parent" : "Internal only"}</span>
            </label>
          </div>
        </div>
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Save Note"
          submitDisabled={!valid}
        />
      </DialogContent>
    </Dialog>
  );
}

function SendMessageDialog({
  open,
  onOpenChange,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fireToast: FireToast;
}) {
  const [channel, setChannel] = useState<"WhatsApp" | "Email">("WhatsApp");
  const [message, setMessage] = useState("");
  const valid = message.trim().length > 0;

  function submit() {
    fireToast("Message queued — coming soon");
    setMessage("");
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Send Message to Guardian</DialogTitle>
          <DialogDescription>Send a message to the primary guardian.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel>To</FieldLabel>
            <input
              type="text"
              readOnly
              value="Fatima Rahman"
              className={cn(FIELD_INPUT, "bg-slate-50 text-slate-600 cursor-not-allowed")}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Channel</FieldLabel>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {(["WhatsApp", "Email"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    channel === c ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Message</FieldLabel>
            <textarea
              className={cn(FIELD_INPUT, "min-h-[100px] resize-y")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message…"
            />
          </div>
        </div>
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Send"
          submitDisabled={!valid}
        />
      </DialogContent>
    </Dialog>
  );
}

function NewTaskDialog({
  open,
  onOpenChange,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fireToast: FireToast;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const valid = title && priority && dueDate && assignee;

  function submit() {
    fireToast(`Task saved — ${title}`);
    setTitle("");
    setPriority("");
    setDueDate("");
    setAssignee("");
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>Create a task linked to {STUDENT_NAME}.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel required>Title</FieldLabel>
            <input
              type="text"
              className={FIELD_INPUT}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow up on overdue invoice"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Priority</FieldLabel>
            <select className={FIELD_INPUT} value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">Select priority…</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Due Date</FieldLabel>
            <input type="date" className={FIELD_INPUT} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Assignee</FieldLabel>
            <select className={FIELD_INPUT} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Select assignee…</option>
              <option>Jason Daswani</option>
              <option>Sarah Thompson</option>
              <option>Ahmed Khalil</option>
            </select>
          </div>
        </div>
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Save Task"
          submitDisabled={!valid}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Book Trial (Student) ────────────────────────────────────────────────────

function teachersForStudent(department: string, subject: string): string[] {
  const pool = staffMembers.filter(
    (s) =>
      s.status === "Active" &&
      (s.role === "Teacher" || s.role === "HOD") &&
      s.department === department,
  );
  if (!subject) return pool.map((s) => s.name);
  const lower = subject.toLowerCase();
  const matched = pool.filter((s) => s.subjects.some((x) => x.toLowerCase().includes(lower)));
  return (matched.length > 0 ? matched : pool).map((s) => s.name);
}

let _trialSeq = trials.length;
function nextTrialId(): string {
  _trialSeq += 1;
  return `T-${String(_trialSeq).padStart(3, "0")}`;
}

let _assessmentSeq = assessments.length;
function nextAssessmentId(): string {
  _assessmentSeq += 1;
  return `A-${String(_assessmentSeq).padStart(3, "0")}`;
}

function BookTrialStudentDialog({
  open,
  onOpenChange,
  studentName,
  studentId,
  yearGroup,
  department,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  studentId: string;
  yearGroup: string;
  department: string;
  fireToast: FireToast;
}) {
  const subjectOptions = useMemo(() => subjectsForYearGroup(yearGroup), [yearGroup]);
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [teacher, setTeacher] = useState("");
  const [notes, setNotes] = useState("");

  const teacherOptions = useMemo(() => teachersForStudent(department, subject), [department, subject]);

  useEffect(() => {
    if (!open) return;
    setSubject("");
    setDate("");
    setTime("10:00");
    setTeacher("");
    setNotes("");
  }, [open]);

  const valid = Boolean(subject && date);

  function submit() {
    const trialId = nextTrialId();
    const selectedTeacher = teacher || teacherOptions[0] || "Unassigned";
    const trialDateLabel = formatDateShort(date) || date;
    trials.push({
      id: trialId,
      student: studentName,
      yearGroup,
      subject,
      teacher: selectedTeacher,
      trialDate: `${trialDateLabel} · ${time}`,
      invoiceStatus: "Pending",
      outcome: "Pending",
      notes: notes.trim() || undefined,
    } as Trial);
    void studentId;
    fireToast("Trial booked — check timetable to confirm slot");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Book Trial Session</DialogTitle>
          <DialogDescription>Schedule a trial for {studentName} · {department}.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel required>Subject</FieldLabel>
            <select className={FIELD_INPUT} value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">Select subject…</option>
              {subjectOptions.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel required>Preferred date</FieldLabel>
              <input
                type="date"
                className={FIELD_INPUT}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={todayIso()}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel required>Preferred time</FieldLabel>
              <select className={FIELD_INPUT} value={time} onChange={(e) => setTime(e.target.value)}>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Teacher preference</FieldLabel>
            <select className={FIELD_INPUT} value={teacher} onChange={(e) => setTeacher(e.target.value)}>
              <option value="">No preference</option>
              {teacherOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Notes</FieldLabel>
            <textarea
              className={cn(FIELD_INPUT, "min-h-[72px] resize-y")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context for the teacher…"
            />
          </div>
        </div>
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Book Trial"
          submitDisabled={!valid}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Book Assessment (Student) ───────────────────────────────────────────────

function BookAssessmentStudentDialog({
  open,
  onOpenChange,
  studentName,
  yearGroup,
  department,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  yearGroup: string;
  department: string;
  fireToast: FireToast;
}) {
  const subjectOptions = useMemo(() => subjectsForYearGroup(yearGroup), [yearGroup]);
  const [assessmentType, setAssessmentType] = useState<"CAT4" | "Subject Assessment">("Subject Assessment");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");

  useEffect(() => {
    if (!open) return;
    setAssessmentType("Subject Assessment");
    setSubject("");
    setDate("");
    setTime("10:00");
  }, [open]);

  const isCat4 = assessmentType === "CAT4";
  const valid = Boolean(date && (isCat4 || subject));

  function submit() {
    const id = nextAssessmentId();
    const dateLabel = formatDateShort(date) || date;
    const subjectLabel = isCat4 ? "CAT4" : subject;
    assessments.push({
      id,
      name: studentName,
      type: "Student",
      yearGroup,
      subjects: [subjectLabel],
      assessor: null,
      date: dateLabel,
      time,
      room: null,
      status: "Booked",
      outcome: null,
    } as Assessment);
    void department;
    fireToast("Assessment booked");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Book Assessment</DialogTitle>
          <DialogDescription>Schedule an assessment for {studentName}.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel required>Type</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {(["CAT4", "Subject Assessment"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAssessmentType(t)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                    assessmentType === t
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-slate-200 text-slate-600 hover:border-amber-300",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {!isCat4 && (
            <div className="space-y-1.5">
              <FieldLabel required>Subject</FieldLabel>
              <select className={FIELD_INPUT} value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">Select subject…</option>
                {subjectOptions.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel required>Preferred date</FieldLabel>
              <input
                type="date"
                className={FIELD_INPUT}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={todayIso()}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel required>Preferred time</FieldLabel>
              <select className={FIELD_INPUT} value={time} onChange={(e) => setTime(e.target.value)}>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Book Assessment"
          submitDisabled={!valid}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Record Payment (Student) ────────────────────────────────────────────────

type PaymentPillMethod = "Cash" | "Card" | "Bank Transfer";

function RecordPaymentStudentDialog({
  open,
  onOpenChange,
  invoices,
  fireToast,
  onPaymentRecorded,
  initialInvoiceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: StudentInvoice[];
  fireToast: FireToast;
  onPaymentRecorded: (invoiceId: string, paidAmount: number, fullyPaid: boolean) => void;
  initialInvoiceId?: string;
}) {
  const outstanding = useMemo(
    () => invoices.filter((i) => i.status !== "Paid"),
    [invoices],
  );

  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentPillMethod>("Bank Transfer");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(todayIso());

  const selected = invoices.find((i) => i.id === invoiceId) ?? null;
  const selectedAmount = selected ? parseAedAmount(selected.amount) : 0;

  useEffect(() => {
    if (!open) return;
    const preferred =
      (initialInvoiceId && invoices.find((i) => i.id === initialInvoiceId)) ||
      outstanding[0] ||
      null;
    setInvoiceId(preferred?.id ?? "");
    setAmount(preferred ? String(parseAedAmount(preferred.amount)) : "");
    setMethod("Bank Transfer");
    setReference("");
    setDate(todayIso());
  }, [open, initialInvoiceId, invoices, outstanding]);

  useEffect(() => {
    if (!selected) return;
    setAmount(String(parseAedAmount(selected.amount)));
  }, [selected]);

  const amountNum = Number(amount);
  const valid = Boolean(selected) && Number.isFinite(amountNum) && amountNum > 0 && date;

  function submit() {
    if (!selected) return;
    const fullyPaid = amountNum >= selectedAmount;
    onPaymentRecorded(selected.id, amountNum, fullyPaid);
    fireToast(`Payment of AED ${amountNum.toLocaleString()} recorded`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Log a payment against an outstanding invoice.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel required>Invoice</FieldLabel>
            {outstanding.length === 0 ? (
              <p className="text-xs text-slate-500 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                No outstanding invoices.
              </p>
            ) : (
              <select className={FIELD_INPUT} value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
                {outstanding.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} · {inv.amount}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Amount (AED)</FieldLabel>
            <input
              type="number"
              className={FIELD_INPUT}
              value={amount}
              min={0}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
            {selected && (
              <p className="text-[11px] text-slate-500">
                Outstanding {formatAed(selectedAmount)}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Method</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {(["Cash", "Card", "Bank Transfer"] as PaymentPillMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                    method === m
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-slate-200 text-slate-600 hover:border-amber-300",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Reference #</FieldLabel>
            <input
              type="text"
              className={FIELD_INPUT}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={method === "Cash" ? "Optional" : "e.g. TRF-88421"}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Date</FieldLabel>
            <input type="date" className={FIELD_INPUT} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Record Payment"
          submitDisabled={!valid}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Sidebar Section Edit Dialogs ────────────────────────────────────────────

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-sm text-slate-600">{value}</span>
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600">{msg}</p>;
}

function EditPersonalDetailsDialog({
  open,
  onOpenChange,
  profile,
  setProfile,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfile;
  setProfile: (p: StudentProfile) => void;
  fireToast: FireToast;
}) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [preferredName, setPreferredName] = useState(profile.preferredName);
  const [dob, setDob] = useState(profile.dob);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [nationality, setNationality] = useState(profile.nationality);
  const [phone, setPhone] = useState(profile.phone);
  const [whatsappSame, setWhatsappSame] = useState(profile.whatsappSame);
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp);
  const [email, setEmail] = useState(profile.email);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (open) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPreferredName(profile.preferredName);
      setDob(profile.dob);
      setGender(profile.gender);
      setNationality(profile.nationality);
      setPhone(profile.phone);
      setWhatsappSame(profile.whatsappSame);
      setWhatsapp(profile.whatsapp);
      setEmail(profile.email);
      setErrors({});
    }
  }, [open, profile]);

  function submit() {
    const nextErrors: Record<string, string | null> = {};
    if (!firstName.trim()) nextErrors.firstName = "First name is required";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required";
    if (!dob) nextErrors.dob = "Date of birth is required";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setProfile({
      ...profile,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      preferredName: preferredName.trim(),
      dob,
      gender,
      nationality: nationality.trim(),
      phone: phone.trim(),
      whatsappSame,
      whatsapp: whatsappSame ? phone.trim() : whatsapp.trim(),
      email: email.trim(),
    });
    fireToast("Saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)]">
        <DialogHeader>
          <DialogTitle>Edit Personal Details</DialogTitle>
          <DialogDescription>Update {profile.firstName}&apos;s personal information.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel required>First name</FieldLabel>
              <input type="text" className={FIELD_INPUT} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <FieldError msg={errors.firstName ?? null} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel required>Last name</FieldLabel>
              <input type="text" className={FIELD_INPUT} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <FieldError msg={errors.lastName ?? null} />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Preferred name</FieldLabel>
            <input type="text" className={FIELD_INPUT} value={preferredName} onChange={(e) => setPreferredName(e.target.value)} placeholder="Optional" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel required>Date of birth</FieldLabel>
              <input type="date" className={FIELD_INPUT} value={dob} onChange={(e) => setDob(e.target.value)} />
              <FieldError msg={errors.dob ?? null} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Gender</FieldLabel>
              <select className={FIELD_INPUT} value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                <option>Male</option>
                <option>Female</option>
                <option>Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Nationality</FieldLabel>
            <input type="text" className={FIELD_INPUT} value={nationality} onChange={(e) => setNationality(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Phone</FieldLabel>
            <input type="text" className={FIELD_INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                checked={whatsappSame}
                onChange={(e) => setWhatsappSame(e.target.checked)}
              />
              WhatsApp same as phone
            </label>
            <FieldLabel>WhatsApp</FieldLabel>
            <input
              type="text"
              className={cn(FIELD_INPUT, whatsappSame && "bg-slate-50 text-slate-500 cursor-not-allowed")}
              value={whatsappSame ? phone : whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={whatsappSame}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Email</FieldLabel>
            <input type="email" className={FIELD_INPUT} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <LockedField label="Student ID" value={profile.studentId} />
            <LockedField label="Date enrolled" value={profile.dateEnrolled} />
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 border-t border-slate-200 bg-slate-50 p-4 rounded-b-xl">
          <button
            type="button"
            onClick={submit}
            className="w-full rounded-lg bg-amber-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditAcademicDialog({
  open,
  onOpenChange,
  profile,
  setProfile,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfile;
  setProfile: (p: StudentProfile) => void;
  fireToast: FireToast;
}) {
  const [yearGroup, setYearGroup] = useState(profile.yearGroup);
  const [school, setSchool] = useState(profile.school);
  const [targets, setTargets] = useState(profile.targetGrades);

  useEffect(() => {
    if (open) {
      setYearGroup(profile.yearGroup);
      setSchool(profile.school);
      setTargets(profile.targetGrades);
    }
  }, [open, profile]);

  const department = yearGroupToDepartment(yearGroup);

  function updateTarget(subject: string, grade: string) {
    setTargets((prev) => prev.map((t) => (t.subject === subject ? { ...t, grade } : t)));
  }

  function submit() {
    setProfile({
      ...profile,
      yearGroup,
      school: school.trim(),
      targetGrades: targets,
    });
    fireToast("Saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)]">
        <DialogHeader>
          <DialogTitle>Edit Academic Details</DialogTitle>
          <DialogDescription>Update year group, school, and target grades.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Year group</FieldLabel>
              <select className={FIELD_INPUT} value={yearGroup} onChange={(e) => setYearGroup(e.target.value)}>
                {YEAR_GROUPS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Department</FieldLabel>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">{department}</span>
                <span className="text-[10px] text-slate-400 ml-auto">Auto</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>School</FieldLabel>
            <input type="text" className={FIELD_INPUT} value={school} onChange={(e) => setSchool(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Target grades</FieldLabel>
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {targets.map((t) => (
                <div key={t.subject} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-sm font-medium text-slate-700 flex-1">{t.subject}</span>
                  <input
                    type="text"
                    className={cn(FIELD_INPUT, "w-24 py-1.5")}
                    value={t.grade}
                    onChange={(e) => updateTarget(t.subject, e.target.value)}
                    placeholder="e.g. A*"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="space-y-1.5">
              <FieldLabel>Enrolled courses</FieldLabel>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-600">{profile.enrolledCoursesCount}</span>
                <span className="text-[10px] text-slate-400 ml-auto">Managed via Add Enrolment</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <LockedField label="Attendance this term" value={profile.attendanceThisTerm} />
              <LockedField label="Sessions remaining" value={profile.sessionsRemaining} />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 border-t border-slate-200 bg-slate-50 p-4 rounded-b-xl">
          <button
            type="button"
            onClick={submit}
            className="w-full rounded-lg bg-amber-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GuardianSelector({
  label,
  selectedId,
  onChange,
  excludeId,
}: {
  label: string;
  selectedId: string | null;
  onChange: (id: string | null) => void;
  excludeId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const selected = guardians.find((g) => g.id === selectedId);
  const matches = query.trim()
    ? guardians.filter(
        (g) =>
          g.id !== excludeId &&
          g.name.toLowerCase().includes(query.trim().toLowerCase()),
      ).slice(0, 6)
    : [];

  if (selected) {
    return (
      <div className="space-y-1.5">
        <FieldLabel>{label}</FieldLabel>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5">
          <span className="text-sm font-medium text-amber-800">{selected.name}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            aria-label={`Remove ${selected.name}`}
            className="p-0.5 rounded-full hover:bg-amber-100 cursor-pointer"
          >
            <XIcon className="w-3.5 h-3.5 text-amber-700" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        className={FIELD_INPUT}
        placeholder="Search guardians by name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.length > 0 && (
        <ul className="rounded-lg border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 max-h-44 overflow-y-auto">
          {matches.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(g.id);
                  setQuery("");
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium text-slate-700">{g.name}</span>
                <span className="text-xs text-slate-400">{g.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SiblingSelector({
  siblingIds,
  onChange,
  currentStudentId,
}: {
  siblingIds: string[];
  onChange: (ids: string[]) => void;
  currentStudentId: string;
}) {
  const [query, setQuery] = useState("");
  const matches = query.trim()
    ? students
        .filter(
          (s) =>
            s.id !== currentStudentId &&
            !siblingIds.includes(s.id) &&
            s.name.toLowerCase().includes(query.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  return (
    <div className="space-y-2">
      <FieldLabel>Siblings</FieldLabel>
      {siblingIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {siblingIds.map((sid) => {
            const s = students.find((st) => st.id === sid);
            if (!s) return null;
            return (
              <div
                key={sid}
                className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 pl-1 pr-2 py-0.5"
              >
                <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-white leading-none">
                    {studentInitials(s.name)}
                  </span>
                </span>
                <span className="text-xs font-medium text-amber-800">{s.name}</span>
                <span className="text-[10px] text-amber-700/70">{s.yearGroup}</span>
                <button
                  type="button"
                  onClick={() => onChange(siblingIds.filter((id) => id !== sid))}
                  aria-label={`Remove ${s.name}`}
                  className="p-0.5 rounded-full hover:bg-amber-100 cursor-pointer"
                >
                  <XIcon className="w-3 h-3 text-amber-700" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <input
        type="text"
        className={FIELD_INPUT}
        placeholder="Search students by name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.length > 0 && (
        <ul className="rounded-lg border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 max-h-44 overflow-y-auto">
          {matches.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onChange([...siblingIds, s.id]);
                  setQuery("");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-slate-600 leading-none">
                    {studentInitials(s.name)}
                  </span>
                </span>
                <span className="text-sm font-medium text-slate-700 flex-1">{s.name}</span>
                <span className="text-xs text-slate-400">{s.yearGroup}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditFamilyDialog({
  open,
  onOpenChange,
  profile,
  setProfile,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfile;
  setProfile: (p: StudentProfile) => void;
  fireToast: FireToast;
}) {
  const [primaryId, setPrimaryId] = useState<string | null>(profile.primaryGuardianId);
  const [primaryRel, setPrimaryRel] = useState<Relationship>(profile.primaryGuardianRelationship);
  const [secondaryId, setSecondaryId] = useState<string | null>(profile.secondaryGuardianId);
  const [secondaryRel, setSecondaryRel] = useState<Relationship>(profile.secondaryGuardianRelationship);
  const [siblingIds, setSiblingIds] = useState<string[]>(profile.siblingIds);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPrimaryId(profile.primaryGuardianId);
      setPrimaryRel(profile.primaryGuardianRelationship);
      setSecondaryId(profile.secondaryGuardianId);
      setSecondaryRel(profile.secondaryGuardianRelationship);
      setSiblingIds(profile.siblingIds);
      setError(null);
    }
  }, [open, profile]);

  function submit() {
    if (!primaryId && !secondaryId) {
      setError("At least one guardian is required");
      return;
    }
    setProfile({
      ...profile,
      primaryGuardianId: primaryId ?? secondaryId ?? "",
      primaryGuardianRelationship: primaryId ? primaryRel : secondaryRel,
      secondaryGuardianId: primaryId ? secondaryId : null,
      secondaryGuardianRelationship: secondaryRel,
      siblingIds,
    });
    fireToast("Saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)]">
        <DialogHeader>
          <DialogTitle>Edit Family &amp; Guardians</DialogTitle>
          <DialogDescription>Link guardians to this student.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <GuardianSelector
              label="Primary guardian"
              selectedId={primaryId}
              onChange={setPrimaryId}
              excludeId={secondaryId}
            />
            {primaryId && (
              <div className="space-y-1.5">
                <FieldLabel>Relationship</FieldLabel>
                <select className={FIELD_INPUT} value={primaryRel} onChange={(e) => setPrimaryRel(e.target.value as Relationship)}>
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3 pb-4 border-b border-slate-100">
            <GuardianSelector
              label="Secondary guardian (optional)"
              selectedId={secondaryId}
              onChange={setSecondaryId}
              excludeId={primaryId}
            />
            {secondaryId && (
              <div className="space-y-1.5">
                <FieldLabel>Relationship</FieldLabel>
                <select className={FIELD_INPUT} value={secondaryRel} onChange={(e) => setSecondaryRel(e.target.value as Relationship)}>
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <SiblingSelector
            siblingIds={siblingIds}
            onChange={setSiblingIds}
            currentStudentId={profile.studentId}
          />

          <FieldError msg={error} />
        </div>
        <DialogFooter className="flex-shrink-0 border-t border-slate-200 bg-slate-50 p-4 rounded-b-xl">
          <button
            type="button"
            onClick={submit}
            className="w-full rounded-lg bg-amber-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Zone 2 — Left Sidebar ────────────────────────────────────────────────────

type EditSection = "personal" | "academic" | "family";

function EditableSectionHeader({
  label,
  onEdit,
}: {
  label: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 -m-1 rounded hover:bg-slate-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <Pencil className="w-3.5 h-3.5 text-slate-400" />
      </button>
    </div>
  );
}

function LeftSidebar({
  profile,
  onTabChange,
  onEdit,
}: {
  profile: StudentProfile;
  onTabChange: (tab: string) => void;
  onEdit: (section: EditSection) => void;
}) {
  const primaryGuardian = guardians.find((g) => g.id === profile.primaryGuardianId);
  const secondaryGuardian = guardians.find((g) => g.id === profile.secondaryGuardianId);
  const department = yearGroupToDepartment(profile.yearGroup);
  const targetGradeText = profile.targetGrades
    .filter((t) => t.grade.trim())
    .map((t) => `${t.subject} ${t.grade}`)
    .join(", ") || "—";

  return (
    <div className="px-4 py-4 space-y-5">

      {/* Quick Stats 2×2 */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Quick Stats</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Attendance This Term", value: "87%"  },
            { label: "Sessions Remaining",   value: "34"   },
            { label: "Credit Balance",        value: "AED 0" },
            { label: "Open Tasks",            value: "2"    },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <p className="text-[10px] text-slate-500 leading-tight">{label}</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Flags */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Active Flags</p>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onTabChange("invoices")}
            className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
          >
            <AlertCircle className="w-3 h-3 shrink-0" />
            1 Overdue Invoice
          </button>
          <button
            type="button"
            onClick={() => onTabChange("concerns")}
            className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            L1 Concern Active
          </button>
          <button
            type="button"
            onClick={() => onTabChange("attendance")}
            className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <Clock className="w-3 h-3 shrink-0" />
            Makeup Expiring
          </button>
        </div>
      </section>

      <div className="border-t border-slate-100" />

      {/* Personal Details */}
      <section className="group">
        <EditableSectionHeader label="Personal Details" onEdit={() => onEdit("personal")} />
        <dl className="space-y-1.5">
          {[
            { label: "Date of Birth", value: formatDob(profile.dob) },
            { label: "Gender",        value: profile.gender },
            { label: "Nationality",   value: profile.nationality || "—" },
            { label: "Phone",         value: profile.phone || "—" },
            { label: "WhatsApp",      value: profile.whatsappSame ? "✓ Same number" : (profile.whatsapp || "—") },
            { label: "Email",         value: profile.email || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <dt className="text-[10px] text-slate-400 leading-none">{label}</dt>
              <dd className="text-xs text-slate-700 font-medium leading-tight mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="border-t border-slate-100" />

      {/* Academic Context */}
      <section className="group">
        <EditableSectionHeader label="Academic" onEdit={() => onEdit("academic")} />
        <dl className="space-y-1.5">
          <div>
            <dt className="text-[10px] text-slate-400">Year Group</dt>
            <dd className="text-xs text-slate-700 font-medium mt-0.5">{profile.yearGroup}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-400">School</dt>
            <dd className="text-xs text-slate-700 font-medium mt-0.5">{profile.school || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-400">Enrolled Courses</dt>
            <dd className="text-xs text-slate-700 font-medium mt-0.5">{profile.enrolledCoursesCount}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-400">Target Grades</dt>
            <dd className="text-xs text-slate-700 font-medium mt-0.5">{targetGradeText}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-400">Department</dt>
            <dd className="text-xs text-slate-700 font-medium mt-0.5">{department}</dd>
          </div>
        </dl>
      </section>

      <div className="border-t border-slate-100" />

      {/* Family */}
      <section className="group">
        <EditableSectionHeader label="Family" onEdit={() => onEdit("family")} />
        <div className="space-y-2">
          <div>
            <p className="text-[10px] text-slate-400">
              Primary Guardian{primaryGuardian ? ` · ${profile.primaryGuardianRelationship}` : ""}
            </p>
            {primaryGuardian ? (
              <Link
                href="/students"
                className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                {primaryGuardian.name} →
              </Link>
            ) : (
              <p className="text-xs text-slate-500 italic">None linked</p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-slate-400">
              Secondary Guardian{secondaryGuardian ? ` · ${profile.secondaryGuardianRelationship}` : ""}
            </p>
            {secondaryGuardian ? (
              <Link
                href="/students"
                className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                {secondaryGuardian.name} →
              </Link>
            ) : (
              <p className="text-xs text-slate-500 italic">No co-parent linked</p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Siblings</p>
            {profile.siblingIds.length === 0 ? (
              <p className="text-xs text-slate-500 italic">None linked</p>
            ) : (
              <ul className="space-y-0.5">
                {profile.siblingIds.map((sid) => {
                  const s = students.find((st) => st.id === sid);
                  if (!s) return null;
                  return (
                    <li key={sid}>
                      <Link
                        href={`/students/${sid}`}
                        className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                      >
                        {s.name} →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <div className="border-t border-slate-100" />

      {/* Referral */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Referral</p>
        <dl className="space-y-1.5">
          <div>
            <dt className="text-[10px] text-slate-400">Referred by</dt>
            <dd className="text-xs text-slate-700 font-medium mt-0.5">Omar Al-Farsi (Jan 2024)</dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-400">Referrals made</dt>
            <dd className="text-xs text-slate-700 font-medium mt-0.5">1</dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-400">Tier</dt>
            <dd className="mt-0.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                Silver
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <div className="border-t border-slate-100" />

      {/* Batches */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Batches</p>
        <div className="flex flex-wrap gap-1.5">
          {["Y8 Maths Mon/Wed", "Y8 English Tue/Thu", "Y8 Science Fri"].map((batch) => (
            <span
              key={batch}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
            >
              {batch}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Zone 3 — Tab Bar ─────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",    label: "Overview",          badge: "red",   badgeCount: 1 },
  { id: "calendar",   label: "Calendar",           badge: null,    badgeCount: 0 },
  { id: "attendance", label: "Attendance",         badge: "amber", badgeCount: 1 },
  { id: "invoices",   label: "Invoices",           badge: "red",   badgeCount: 1 },
  { id: "grades",     label: "Grades",             badge: null,    badgeCount: 0 },
  { id: "courses",    label: "Courses",            badge: null,    badgeCount: 0 },
  { id: "comms",      label: "Communication Log",  badge: null,    badgeCount: 0 },
  { id: "tasks",      label: "Tasks",              badge: "amber", badgeCount: 2 },
  { id: "concerns",   label: "Concerns",           badge: "amber", badgeCount: 1 },
  { id: "tickets",    label: "Tickets",            badge: null,    badgeCount: 0 },
  { id: "files",      label: "Files",              badge: null,    badgeCount: 0 },
] as const;

type TabId = typeof TABS[number]["id"];

function TabBar({ activeTab, setActiveTab, can }: { activeTab: TabId; setActiveTab: (t: TabId) => void; can: (action: string) => boolean }) {
  return (
    <div className="shrink-0 bg-white border-b border-slate-200 px-6 overflow-x-auto">
      <div className="flex items-end gap-0 whitespace-nowrap">
        {TABS.map((tab) => {
          if (tab.id === "invoices" && !can('students.viewFinancial')) return null;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer shrink-0",
                activeTab === tab.id
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
              )}
            >
              {tab.label}
              {tab.badge && (
                <span
                  className={cn(
                    "w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center",
                    tab.badge === "red"   ? "bg-red-500 text-white"   : "bg-amber-500 text-white",
                  )}
                >
                  {tab.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab 1 — Overview ─────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
  invoice:    { Icon: FileText,    color: "text-amber-600",   bg: "bg-amber-50"   },
  absence:    { Icon: XCircle,     color: "text-red-500",     bg: "bg-red-50"     },
  payment:    { Icon: CreditCard,  color: "text-blue-600",    bg: "bg-blue-50"    },
  concern:    { Icon: AlertTriangle, color: "text-red-500",   bg: "bg-red-50"     },
  assignment: { Icon: BookOpen,    color: "text-violet-600",  bg: "bg-violet-50"  },
  session:    { Icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  enrolment:  { Icon: UserPlus,    color: "text-emerald-600", bg: "bg-emerald-50" },
  message:    { Icon: MessageSquare, color: "text-blue-600",  bg: "bg-blue-50"    },
};

function OverviewTab({ onTabChange }: { onTabChange: (tab: string) => void }) {
  return (
    <div className="space-y-5">
      {/* Flags Strip */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onTabChange("invoices")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          1 Overdue Invoice — AED 3,200
        </button>
        <button
          type="button"
          onClick={() => onTabChange("concerns")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          L1 Concern — Y8 Maths
        </button>
        <button
          type="button"
          onClick={() => onTabChange("attendance")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          1 Makeup Expiring in 5 days
        </button>
      </div>

      {/* Churn + Retention Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Churn Risk</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-red-500">84</span>
            <div className="mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Critical</span>
              <p className="text-xs text-slate-500 mt-1">Missed 3+ sessions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Retention Confidence</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-red-500">32</span>
            <div className="mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Low</span>
              <p className="text-xs text-slate-500 mt-1">No re-enrolment confirmed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolment Cards */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Active Enrolments</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {studentDetail.enrolments.map((enr) => {
            const cls = ENROLMENT_COLOR_CLASSES[enr.color];
            return (
              <div key={enr.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className={cn("px-4 py-3 flex items-center justify-between", cls.header)}>
                  <p className="text-sm font-bold text-slate-800">{enr.subject}</p>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold",
                      enr.packageStatus === "Expiring"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700",
                    )}
                  >
                    {enr.packageStatus}
                  </span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs text-slate-600">{enr.teacher}</p>
                  <p className="text-xs text-slate-500">{enr.schedule}</p>
                  <SessionDots
                    attended={enr.sessionsAttended}
                    absent={enr.sessionsAbsent}
                    remaining={enr.sessionsRemaining}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">{enr.sessionsTotal} sessions total</span>
                    <span className="text-xs font-semibold text-slate-700">{enr.sessionsRemaining} remaining</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Upcoming Sessions</p>
        <div className="space-y-2">
          {studentDetail.upcomingSessions.map((s, i) => {
            const subjectColor = SUBJECT_COLOR[s.subject];
            return (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <div className={cn("w-2 h-2 rounded-full shrink-0", subjectColor?.dot ?? "bg-slate-300")} />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-slate-700 shrink-0">{s.date}</span>
                  <span className="text-sm text-slate-500 shrink-0">{s.time}</span>
                  <span className="text-sm text-slate-800 font-medium shrink-0">{s.subject}</span>
                  <span className="text-xs text-slate-400 truncate">{s.teacher}</span>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{s.room}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Recent Activity</p>
        <div className="space-y-3">
          {studentDetail.activityTimeline.map((event, i) => {
            const meta = ACTIVITY_ICON[event.type] ?? { Icon: AlertCircle, color: "text-slate-500", bg: "bg-slate-50" };
            const { Icon, color, bg } = meta;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", bg)}>
                  <Icon className={cn("w-3.5 h-3.5", color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">{event.description}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">{event.timeAgo}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2 — Calendar ─────────────────────────────────────────────────────────

const CAL_DAYS = [
  { label: "Mon", date: "21" },
  { label: "Tue", date: "22" },
  { label: "Wed", date: "23" },
  { label: "Thu", date: "24" },
  { label: "Fri", date: "25" },
];
const CAL_HOURS = [13, 14, 15, 16, 17, 18, 19, 20];

const CAL_SESSIONS: Record<string, Record<number, { subject: string; teacher: string; color: string }>> = {
  Mon: { 15: { subject: "Y8 Maths",   teacher: "Mr Ahmed Khalil",  color: "bg-amber-100 border-amber-300 text-amber-900" } },
  Tue: { 16: { subject: "Y8 English", teacher: "Ms Sarah Mitchell", color: "bg-teal-100 border-teal-300 text-teal-900"   } },
  Wed: { 15: { subject: "Y8 Maths",   teacher: "Mr Ahmed Khalil",  color: "bg-amber-100 border-amber-300 text-amber-900" } },
  Thu: { 16: { subject: "Y8 English", teacher: "Ms Sarah Mitchell", color: "bg-teal-100 border-teal-300 text-teal-900"   } },
  Fri: { 14: { subject: "Y8 Science", teacher: "Mr Tariq Al-Amin", color: "bg-blue-100 border-blue-300 text-blue-900"    } },
};

function CalendarTab({ canExport, fireToast }: { canExport: boolean; fireToast: FireToast }) {
  return (
    <div className="space-y-3">
      {canExport && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => fireToast(`Downloading schedule for ${STUDENT_NAME}...`)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Schedule
          </button>
        </div>
      )}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs text-slate-400">
            Week of Mon 21 Apr – Fri 25 Apr · Changes are made in Timetable
          </p>
        </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="w-14 border-r border-slate-100" />
              {CAL_DAYS.map((d) => (
                <th
                  key={d.label}
                  className="text-center py-3 border-r border-slate-100 last:border-r-0 font-semibold text-slate-700"
                >
                  <span className="block text-xs text-slate-400 font-normal">{d.label}</span>
                  <span className="text-sm">{d.date}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAL_HOURS.map((hour) => (
              <tr key={hour} className="border-t border-slate-100">
                <td className="border-r border-slate-100 px-2 py-0 w-14 text-right">
                  <span className="text-[10px] text-slate-400">{hour}:00</span>
                </td>
                {CAL_DAYS.map((d) => {
                  const session = CAL_SESSIONS[d.label]?.[hour];
                  return (
                    <td key={d.label} className="border-r border-slate-100 last:border-r-0 p-1 h-12 align-top">
                      {session && (
                        <div
                          className={cn(
                            "h-full rounded border px-2 py-1 text-left overflow-hidden",
                            session.color,
                          )}
                        >
                          <p className="text-[11px] font-bold leading-tight truncate">{session.subject}</p>
                          <p className="text-[10px] leading-tight truncate opacity-70">{session.teacher}</p>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

// ─── Tab 3 — Attendance ───────────────────────────────────────────────────────

const ATTENDANCE_FORMATS: ExportFormat[] = [
  {
    id: "pdf",
    label: "Attendance Report (PDF)",
    description:
      "Formatted attendance report showing per-subject rates, makeup log, and full history. Suitable for parent sharing.",
    icon: "pdf",
    recommended: true,
  },
  {
    id: "csv",
    label: "Raw Data (CSV)",
    description: "All attendance records as a spreadsheet. One row per session.",
    icon: "rows",
  },
];

function AttendanceTab({ canExport }: { canExport: boolean }) {
  const { termRate, allTimeRate, consecutiveAbsences, noShows } = studentDetail.attendanceSummary;
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <div className="space-y-5">
      {canExport && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Attendance
          </button>
        </div>
      )}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title={`Export Attendance — ${STUDENT_NAME}`}
        recordCount={studentDetail.attendanceHistory.length}
        formats={ATTENDANCE_FORMATS}
      />
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Attendance This Term",  value: termRate              },
          { label: "All-Time Attendance",    value: allTimeRate           },
          { label: "Consecutive Absences",  value: consecutiveAbsences   },
          { label: "No-Shows",              value: noShows               },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Per-subject cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {studentDetail.attendanceBySubject.map((s) => (
          <div key={s.subject} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-800">{s.subject}</p>
              <span className="text-lg font-black text-slate-700">{s.rate}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div><span className="text-slate-400">Attended</span><span className="ml-1 font-semibold text-slate-700">{s.attended}</span></div>
              <div><span className="text-slate-400">Absent</span><span className="ml-1 font-semibold text-red-600">{s.absent}</span></div>
              <div><span className="text-slate-400">Makeup left</span><span className="ml-1 font-semibold text-slate-700">{s.makeupAllowance}</span></div>
              <div><span className="text-slate-400">Makeups used</span><span className="ml-1 font-semibold text-slate-700">{s.makeupUsed}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Makeup Log */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Makeup Log</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Session", "Subject", "Makeup Date", "Status"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {studentDetail.makeupLog.map((m, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5 text-slate-700">{m.session}</td>
                <td className="px-4 py-2.5 text-slate-700">{m.subject}</td>
                <td className="px-4 py-2.5 text-slate-700">{m.makeupDate}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      m.status === "Completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {m.status}
                    {m.expiring && " ⚠️ Expiring"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Attendance History</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Date", "Subject", "Status"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {studentDetail.attendanceHistory.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5 text-slate-700">{row.date}</td>
                <td className="px-4 py-2.5">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", SUBJECT_COLOR[row.subject]?.chip ?? "bg-slate-100 text-slate-600")}>
                    {row.subject}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      row.status === "Present" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                    )}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 4 — Invoices ─────────────────────────────────────────────────────────

type StudentInvoiceRow = (typeof studentDetail.invoices)[number];

const INVOICE_LINE_ITEMS: Record<string, { subject: string; sessions: number; rate: number }[]> = {
  "INV-1042": [{ subject: "Y8 Maths",   sessions: 8, rate: 400 }],
  "INV-0998": [{ subject: "Y8 English", sessions: 8, rate: 360 }],
  "INV-0967": [{ subject: "Y8 Science", sessions: 4, rate: 360 }],
  "INV-0821": [{ subject: "Y8 Maths",   sessions: 8, rate: 400 }],
};

const INVOICE_DUE_DATES: Record<string, string> = {
  "INV-1042": "20 Apr 2026",
  "INV-0998": "29 Mar 2026",
  "INV-0967": "29 Mar 2026",
  "INV-0821": "17 Jan 2026",
};

function InvoicePreviewDialog({
  invoice,
  open,
  onOpenChange,
  fireToast,
}: {
  invoice: StudentInvoiceRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fireToast: FireToast;
}) {
  if (!invoice) return null;
  const lineItems = INVOICE_LINE_ITEMS[invoice.id] ?? [{ subject: invoice.description, sessions: 1, rate: 0 }];
  const subtotal = lineItems.reduce((sum, li) => sum + li.sessions * li.rate, 0);
  const vat = Math.round(subtotal * 0.05);
  const total = subtotal + vat;
  const dueDate = INVOICE_DUE_DATES[invoice.id] ?? invoice.date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-[#0F172A] text-white border-b border-slate-800 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-amber-500 flex items-center justify-center">
                <span className="text-white font-bold text-base leading-none">IMI</span>
              </div>
              <div>
                <DialogTitle className="text-white text-lg">TAX INVOICE</DialogTitle>
                <DialogDescription className="text-slate-300">Improve ME Institute</DialogDescription>
              </div>
            </div>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold",
                invoice.status === "Paid"
                  ? "bg-emerald-500 text-white"
                  : invoice.status === "Overdue"
                    ? "bg-red-500 text-white"
                    : "bg-amber-500 text-white",
              )}
            >
              {invoice.status}
            </span>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Bill To</p>
              <p className="text-sm font-bold text-slate-800 mt-1">Fatima Rahman</p>
              <p className="text-sm text-slate-600">{STUDENT_NAME}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-slate-300 text-slate-600">
                Year 8
              </span>
            </div>
            <div className="text-right">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Invoice #</p>
                <p className="text-sm font-mono font-semibold text-slate-800 mt-0.5">{invoice.id}</p>
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Issue Date</p>
                <p className="text-sm text-slate-700 mt-0.5">{invoice.date} 2026</p>
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Due Date</p>
                <p className="text-sm text-slate-700 mt-0.5">{dueDate}</p>
              </div>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Subject</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400">Sessions</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400">Rate</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-3 py-2.5 text-slate-700">{li.subject}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700">{li.sessions}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700">AED {li.rate.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
                    AED {(li.sessions * li.rate).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <dl className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="text-slate-700 font-medium">AED {subtotal.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">VAT 5%</dt>
                <dd className="text-slate-700 font-medium">AED {vat.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <dt className="text-slate-800 font-bold">Total Due</dt>
                <dd className="text-slate-900 font-bold">AED {total.toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => fireToast(`Downloading ${invoice.id}...`)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoicesTab({
  canExport,
  fireToast,
  invoices,
  onPaymentRecorded,
}: {
  canExport: boolean;
  fireToast: FireToast;
  invoices: StudentInvoice[];
  onPaymentRecorded: (invoiceId: string, paidAmount: number, fullyPaid: boolean) => void;
}) {
  const [previewInvoice, setPreviewInvoice] = useState<StudentInvoiceRow | null>(null);
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {canExport && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => fireToast(`Downloading all invoices for ${STUDENT_NAME} as PDF...`)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download All Invoices
          </button>
        </div>
      )}
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Invoiced This Term", value: "AED 9,600" },
          { label: "Collected",                value: "AED 6,400" },
          { label: "Outstanding",              value: "AED 3,200", highlight: true },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={cn("text-xl font-bold mt-1", highlight ? "text-red-600" : "text-slate-800")}>{value}</p>
          </div>
        ))}
      </div>

      {/* Invoice table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["#", "Date", "Description", "Amount", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{inv.id}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{inv.date}</td>
                <td className="px-4 py-3 text-slate-700">{inv.description}</td>
                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{inv.amount}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      inv.status === "Overdue"
                        ? "bg-red-100 text-red-700"
                        : inv.status === "Paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {inv.status === "Paid" ? "✓ Paid" : inv.status === "Overdue" ? "Overdue" : inv.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {inv.status === "Overdue" && (
                      <button type="button" className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors cursor-pointer whitespace-nowrap">
                        Record Payment
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewInvoice(inv)}
                      className="text-xs text-slate-500 hover:text-amber-600 font-medium transition-colors cursor-pointer"
                    >
                      View Invoice
                    </button>
                    {canExport && (
                      <button
                        type="button"
                        onClick={() => fireToast(`Downloading ${inv.id}...`)}
                        title={`Download ${inv.id}`}
                        aria-label={`Download ${inv.id}`}
                        className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InvoicePreviewDialog
        invoice={previewInvoice}
        open={previewInvoice !== null}
        onOpenChange={(o) => !o && setPreviewInvoice(null)}
        fireToast={fireToast}
      />
      <RecordPaymentStudentDialog
        open={payInvoiceId !== null}
        onOpenChange={(o) => !o && setPayInvoiceId(null)}
        invoices={invoices}
        initialInvoiceId={payInvoiceId ?? undefined}
        fireToast={fireToast}
        onPaymentRecorded={onPaymentRecorded}
      />
    </div>
  );
}

// ─── Tab 5 — Grades ───────────────────────────────────────────────────────────

function GradeAccordion({ subject, data }: { subject: string; data: typeof studentDetail.grades.maths }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          <span className="font-semibold text-slate-800">{subject}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
            Target: {data.target}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            Predicted: {data.predicted}
          </span>
        </div>
      </button>
      {open && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Assignment", "Due", "Submitted", "Score", "Status"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.assignments.map((a, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5 text-slate-700 font-medium">{a.title}</td>
                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{a.due}</td>
                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{a.submitted}</td>
                <td className="px-4 py-2.5 font-semibold text-slate-800">{a.score}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const GRADES_FORMATS: ExportFormat[] = [
  {
    id: "pdf",
    label: "Progress Report (PDF)",
    description:
      "Formatted academic progress report. Shows predicted grades, targets, and assignment scores per subject.",
    icon: "pdf",
    recommended: true,
  },
  {
    id: "csv",
    label: "Grade Data (CSV)",
    description: "All assignment scores as a spreadsheet.",
    icon: "rows",
  },
];

function GradesTab({ canExport }: { canExport: boolean }) {
  const [exportOpen, setExportOpen] = useState(false);
  const totalAssignments =
    studentDetail.grades.maths.assignments.length + studentDetail.grades.english.assignments.length;
  return (
    <div className="space-y-4">
      {canExport && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Grades
          </button>
        </div>
      )}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title={`Export Grades — ${STUDENT_NAME}`}
        recordCount={totalAssignments}
        formats={GRADES_FORMATS}
      />
      <GradeAccordion subject="Y8 Maths"   data={studentDetail.grades.maths}   />
      <GradeAccordion subject="Y8 English" data={studentDetail.grades.english} />
    </div>
  );
}

// ─── Tab 6 — Courses ──────────────────────────────────────────────────────────

function CoursesTab() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Enrolments</p>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">3 Active</span>
      </div>
      {studentDetail.enrolments.map((enr) => {
        const cls = ENROLMENT_COLOR_CLASSES[enr.color];
        return (
          <div key={enr.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className={cn("px-4 py-3 flex items-center justify-between", cls.header)}>
              <div className="flex items-center gap-3">
                <p className="font-bold text-slate-800">{enr.subject}</p>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", cls.badge)}>
                  {enr.color === "amber" ? "Amber" : enr.color === "teal" ? "Teal" : "Blue"} subject
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                    enr.packageStatus === "Expiring" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {enr.packageStatus}
                </span>
              </div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs">
              <div><p className="text-slate-400">Teacher</p><p className="text-slate-700 font-medium mt-0.5">{enr.teacher}</p></div>
              <div><p className="text-slate-400">Schedule</p><p className="text-slate-700 font-medium mt-0.5">{enr.schedule}</p></div>
              <div><p className="text-slate-400">Package Start</p><p className="text-slate-700 font-medium mt-0.5">{enr.packageStart}</p></div>
              <div><p className="text-slate-400">Sessions</p><p className="text-slate-700 font-medium mt-0.5">{enr.sessionsRemaining} of {enr.sessionsPurchased} remaining</p></div>
            </div>
          </div>
        );
      })}
      <div className="mt-4 px-4 py-3 rounded-lg border border-slate-100 bg-slate-50 text-xs text-slate-400 text-center">
        No withdrawn enrolments
      </div>
    </div>
  );
}

// ─── Tab 7 — Communication Log ────────────────────────────────────────────────

function CommLogTab({ canExport, fireToast }: { canExport: boolean; fireToast: FireToast }) {
  return (
    <div className="space-y-3">
      {canExport && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => fireToast(`Downloading communication log for ${STUDENT_NAME}...`)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Log
          </button>
        </div>
      )}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {["Date", "Channel", "Message", "Sent by", "Status"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {studentDetail.communicationLog.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.date}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                    row.channel === "WhatsApp" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700",
                  )}
                >
                  {row.channel}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-700">{row.message}</td>
              <td className="px-4 py-3 text-slate-500">{row.sentBy}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">{row.status}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 8 — Tasks ────────────────────────────────────────────────────────────

function TasksTab() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Open Tasks</p>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          New Task
        </button>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Task", "Priority", "Assigned to", "Due", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {studentDetail.tasks.map((t, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-700 font-medium">{t.task}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      t.priority === "High"   ? "bg-red-100 text-red-700"    :
                      t.priority === "Medium" ? "bg-amber-100 text-amber-700" :
                                                "bg-slate-100 text-slate-600",
                    )}
                  >
                    {t.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{t.assignedTo}</td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{t.due}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    Open
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 9 — Concerns ─────────────────────────────────────────────────────────

function AddNoteDialog({
  open,
  onOpenChange,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fireToast: FireToast;
}) {
  const [note, setNote] = useState("");
  const valid = note.trim().length > 0;
  function submit() {
    fireToast("Note added to concern");
    setNote("");
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>Add a note to this concern.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-3">
          <FieldLabel required>Note</FieldLabel>
          <textarea
            className={cn(FIELD_INPUT, "min-h-[100px] resize-y")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your note…"
          />
        </div>
        <DialogActions onCancel={() => onOpenChange(false)} onSubmit={submit} submitLabel="Save Note" submitDisabled={!valid} />
      </DialogContent>
    </Dialog>
  );
}

function DismissConcernDialog({
  open,
  onOpenChange,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fireToast: FireToast;
}) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length > 0;
  function submit() {
    fireToast("Concern dismissed — reason required", "warning");
    setReason("");
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Dismiss Concern</DialogTitle>
          <DialogDescription>A reason is required to dismiss this concern.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-3">
          <FieldLabel required>Reason</FieldLabel>
          <textarea
            className={cn(FIELD_INPUT, "min-h-[80px] resize-y")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this concern being dismissed?"
          />
        </div>
        <DialogActions onCancel={() => onOpenChange(false)} onSubmit={submit} submitLabel="Dismiss" submitDisabled={!valid} />
      </DialogContent>
    </Dialog>
  );
}

function ConcernsTab({ canEscalate, fireToast }: { canEscalate: boolean; fireToast: FireToast }) {
  const [openDialog, setOpenDialog] = useState<"note" | "dismiss" | null>(null);
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Concerns</p>
      {studentDetail.concerns.map((c, i) => (
        <div key={i} className="bg-white rounded-lg border-2 border-amber-300 shadow-sm p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                {c.level}
              </span>
              <span className="text-sm font-bold text-slate-800">{c.subject}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              {c.status}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-400">Trigger</dt>
              <dd className="text-slate-700 font-medium mt-0.5">{c.trigger}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Level</dt>
              <dd className="text-slate-700 font-medium mt-0.5">{c.levelLabel}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Raised</dt>
              <dd className="text-slate-700 font-medium mt-0.5">{c.raised} by {c.raisedBy}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Assigned to</dt>
              <dd className="text-slate-700 font-medium mt-0.5">{c.assignedTo}</dd>
            </div>
          </dl>
          <div className="flex items-center gap-2 pt-2 border-t border-amber-100">
            <button
              type="button"
              onClick={() => setOpenDialog("note")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
            >
              <PenLine className="w-3 h-3" />
              Add Note
            </button>
            {canEscalate && (
              <button
                type="button"
                onClick={() => fireToast("Concern escalated to L2 — HOD and Academic Head notified")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3" />
                Escalate to L2
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpenDialog("dismiss")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-red-300 hover:text-red-600 transition-colors cursor-pointer ml-auto"
            >
              <XCircle className="w-3 h-3" />
              Dismiss
            </button>
          </div>
        </div>
      ))}
      <div className="mt-2 px-4 py-3 rounded-lg border border-slate-100 bg-slate-50 text-xs text-slate-400 text-center">
        No dismissed concerns
      </div>

      <AddNoteDialog
        open={openDialog === "note"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        fireToast={fireToast}
      />
      <DismissConcernDialog
        open={openDialog === "dismiss"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        fireToast={fireToast}
      />
    </div>
  );
}

// ─── Tab 10 — Tickets ────────────────────────────────────────────────────────

function RaiseTicketDialog({
  open,
  onOpenChange,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fireToast: FireToast;
}) {
  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const valid = type && subject.trim() && description.trim();

  function submit() {
    fireToast("Ticket raised — reference TKT-001");
    setType("");
    setSubject("");
    setDescription("");
    setPriority("Medium");
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Raise Complaint Ticket</DialogTitle>
          <DialogDescription>File a complaint or issue for {STUDENT_NAME}.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel required>Type</FieldLabel>
            <select className={FIELD_INPUT} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Select type…</option>
              <option>Academic</option>
              <option>Billing</option>
              <option>Scheduling</option>
              <option>Conduct</option>
              <option>Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Subject</FieldLabel>
            <input
              type="text"
              className={FIELD_INPUT}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief subject line"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Description</FieldLabel>
            <textarea
              className={cn(FIELD_INPUT, "min-h-[100px] resize-y")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue…"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Priority</FieldLabel>
            <div className="flex items-center gap-4">
              {(["Low", "Medium", "High"] as const).map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="ticket-priority"
                    checked={priority === p}
                    onChange={() => setPriority(p)}
                    className="accent-amber-500"
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Attachment</FieldLabel>
            <button
              type="button"
              onClick={() => fireToast("File attach — coming soon")}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Attach file
            </button>
          </div>
        </div>
        <DialogActions onCancel={() => onOpenChange(false)} onSubmit={submit} submitLabel="Submit Ticket" submitDisabled={!valid} />
      </DialogContent>
    </Dialog>
  );
}

function TicketsTab({ fireToast }: { fireToast: FireToast }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Raise Ticket
        </button>
      </div>
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <FileText className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-500">No complaint tickets raised for this student.</p>
        <p className="text-xs text-slate-400">Tickets will appear here once raised.</p>
      </div>
      <RaiseTicketDialog open={open} onOpenChange={setOpen} fireToast={fireToast} />
    </div>
  );
}

// ─── Tab 11 — Files ──────────────────────────────────────────────────────────

const STUDENT_FILES = [
  { name: "Term 3 Enrolment Contract.pdf",   uploadedOn: "6 Jan 2026",  uploadedBy: "Jason Daswani"  },
  { name: "Assessment Report — Jan 2026.pdf", uploadedOn: "15 Jan 2026", uploadedBy: "Jason Daswani"  },
  { name: "Guardian ID — Fatima Rahman.pdf",  uploadedOn: "12 Sep 2022", uploadedBy: "System"         },
  { name: "Medical Note — Mar 2026.pdf",      uploadedOn: "3 Mar 2026",  uploadedBy: "Sarah Thompson" },
];

function FilesTab({
  canDelete,
  canExport,
  fireToast,
}: {
  canDelete: boolean;
  canExport: boolean;
  fireToast: FireToast;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => fireToast("File upload — coming soon")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <Upload className="w-3 h-3" />
          Upload File
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STUDENT_FILES.map((file) => (
          <div
            key={file.name}
            className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex gap-3"
          >
            <div className="w-10 h-10 rounded-md bg-red-50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Uploaded {file.uploadedOn} · {file.uploadedBy}
              </p>
              <div className="flex items-center gap-2 mt-3">
                {canExport && (
                  <button
                    type="button"
                    onClick={() => fireToast(`Downloading ${file.name}...`)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => fireToast(`Deleted ${file.name}`, "warning")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-red-300 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Journey Student Banner ───────────────────────────────────────────────────

function JourneyStudentBanner({
  journey,
  onCreateEnrolment,
  onRecordPayment,
}: {
  journey: ReturnType<typeof useJourney>;
  onCreateEnrolment: () => void;
  onRecordPayment: () => void;
}) {
  const router = useRouter();
  const hasEnrolment = Boolean(journey.enrolment);
  const hasInvoice = Boolean(journey.invoice);
  const isPaid = journey.invoice?.status === "Paid";

  let title = "";
  let sub = "";
  let actionLabel = "";
  let onAction: () => void = onCreateEnrolment;

  if (!hasEnrolment) {
    title = "Next step — create the first enrolment";
    sub = "Choose a subject, term, and teacher to generate the opening invoice.";
    actionLabel = "Create Enrolment";
    onAction = onCreateEnrolment;
  } else if (!hasInvoice) {
    title = "Enrolment pending — issue the invoice";
    sub = `${journey.enrolment!.subject} · ${journey.enrolment!.sessionsThisTerm} sessions · AED ${journey.enrolment!.total.toLocaleString()}`;
    actionLabel = "Open invoice builder";
    onAction = () =>
      router.push(`/finance/invoice/new?student=${journey.student?.id ?? ""}&source=journey`);
  } else if (!isPaid) {
    title = `Invoice ${journey.invoice!.id} awaiting payment`;
    sub = `AED ${journey.invoice!.amount.toLocaleString()} outstanding · record payment to activate this enrolment.`;
    actionLabel = "Record Payment";
    onAction = onRecordPayment;
  } else {
    title = "Enrolment active";
    sub = `Payment recorded · ${journey.enrolment?.sessionsThisTerm ?? 0} sessions ready to schedule.`;
    actionLabel = "View Timetable";
    onAction = () => router.push("/timetable");
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm font-semibold text-amber-900">{title}</p>
        <p className="text-xs text-amber-700 mt-0.5">{sub}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold shadow-sm hover:bg-amber-600 cursor-pointer transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function StudentProfilePageContent() {
  const { can } = usePermission();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routeId = (params?.id as string) ?? "";
  const isJourneyStudent = routeId === BILAL_STUDENT_ID;
  const journey = useJourney();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: TabId = (rawTab && TABS.some(t => t.id === rawTab)) ? (rawTab as TabId) : 'overview';
  const [toast, setToast] = useState<{ msg: string; tone: "default" | "warning" } | null>(null);
  const [profile, setProfile] = useState<StudentProfile>(() => {
    if (routeId === BILAL_STUDENT_ID) {
      return {
        ...INITIAL_PROFILE,
        firstName: "Bilal",
        lastName: "Mahmood",
        preferredName: "",
        dob: "2013-06-15",
        gender: "Male",
        nationality: "Pakistani",
        phone: "+971 50 111 2222",
        whatsappSame: true,
        whatsapp: "+971 50 111 2222",
        email: "fatima.mahmood@gmail.com",
        studentId: BILAL_STUDENT_ID,
        dateEnrolled: new Date().toISOString().slice(0, 10),
        yearGroup: "Y7",
        school: "",
        targetGrades: [{ subject: "Maths", grade: "A" }],
        enrolledCoursesCount: 0,
        attendanceThisTerm: "—",
        sessionsRemaining: "0",
        primaryGuardianId: "G-001",
        primaryGuardianRelationship: "Mother",
      };
    }
    return INITIAL_PROFILE;
  });
  const [editSection, setEditSection] = useState<EditSection | null>(null);
  const [journeyEnrolmentOpen, setJourneyEnrolmentOpen] = useState(false);
  const [journeyPaymentOpen, setJourneyPaymentOpen] = useState(false);
  const [invoicesState, setInvoicesState] = useState<StudentInvoice[]>(() => studentDetail.invoices);

  function handlePaymentRecorded(invoiceId: string, _paidAmount: number, fullyPaid: boolean) {
    setInvoicesState((list) =>
      list.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, status: fullyPaid ? "Paid" : "Partial" }
          : inv,
      ),
    );
  }

  // Keep the journey student profile in sync with journey state
  useEffect(() => {
    if (!isJourneyStudent) return;
    if (!journey.student) return;
    setProfile((prev) => ({
      ...prev,
      firstName: journey.student!.firstName,
      lastName: journey.student!.lastName,
      studentId: journey.student!.id,
      yearGroup: journey.student!.yearGroup,
      school: journey.student!.school,
      enrolledCoursesCount: journey.enrolment ? 1 : 0,
      sessionsRemaining: journey.invoice?.status === "Paid" && journey.enrolment
        ? String(journey.enrolment.sessionsThisTerm)
        : "0",
    }));
  }, [isJourneyStudent, journey.student, journey.enrolment, journey.invoice]);

  const journeyStatusBadge = useMemo(() => {
    if (!isJourneyStudent || !journey.student) return null;
    if (journey.student.status === "Active") {
      return { label: "Active", className: "bg-emerald-500 text-white" };
    }
    if (journey.invoice?.status === "Issued") {
      return { label: "Awaiting payment", className: "bg-amber-500 text-white" };
    }
    if (journey.enrolment) {
      return { label: "Enrolment pending", className: "bg-blue-500 text-white" };
    }
    return { label: "Pending enrolment", className: "bg-slate-400 text-white" };
  }, [isJourneyStudent, journey.student, journey.invoice, journey.enrolment]);

  function fireToast(msg: string, tone: "default" | "warning" = "default") {
    setToast({ msg, tone });
    window.setTimeout(() => setToast(null), 2000);
  }

  function handleTabChange(tab: string) {
    router.replace(`?tab=${tab}`, { scroll: false });
  }

  const canExport = can("export");
  const canDelete = can("delete.records");
  const canEscalate = can("approve.discount");

  return (
    <div
      className="-m-6 flex flex-col overflow-hidden"
      style={{ height: "calc(100dvh - 56px)" }}
    >
      {/* ── Zone 1: Profile Header ──────────────────────────────────────────── */}
      <ProfileHeader
        profile={profile}
        fireToast={fireToast}
        isJourneyStudent={isJourneyStudent}
        onJourneyAddEnrolment={() => setJourneyEnrolmentOpen(true)}
        journeyStatusBadge={journeyStatusBadge}
        invoices={invoicesState}
        onPaymentRecorded={handlePaymentRecorded}
      />

      {isJourneyStudent && (
        <JourneyStudentBanner
          journey={journey}
          onCreateEnrolment={() => setJourneyEnrolmentOpen(true)}
          onRecordPayment={() => setJourneyPaymentOpen(true)}
        />
      )}

      {/* ── Zones 2 + 3: Sidebar + Main Panel ──────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Zone 2: Left Sidebar ──────────────────────────────────────────── */}
        <aside className="w-[260px] shrink-0 border-r border-slate-200 overflow-y-auto bg-white">
          <LeftSidebar
            profile={profile}
            onTabChange={handleTabChange}
            onEdit={setEditSection}
          />
        </aside>

        {/* ── Zone 3: Main Panel ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Tab Bar */}
          <TabBar activeTab={activeTab} setActiveTab={handleTabChange} can={can} />

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
            {activeTab === "overview"    && <OverviewTab    onTabChange={handleTabChange} />}
            {activeTab === "calendar"    && <CalendarTab    canExport={canExport} fireToast={fireToast} />}
            {activeTab === "attendance"  && <AttendanceTab  canExport={canExport} />}
            {activeTab === "invoices"    && <InvoicesTab    canExport={canExport} fireToast={fireToast} invoices={invoicesState} onPaymentRecorded={handlePaymentRecorded} />}
            {activeTab === "grades"      && <GradesTab      canExport={canExport} />}
            {activeTab === "courses"     && <CoursesTab />}
            {activeTab === "comms"       && <CommLogTab     canExport={canExport} fireToast={fireToast} />}
            {activeTab === "tasks"       && <TasksTab       />}
            {activeTab === "concerns"    && <ConcernsTab    canEscalate={canEscalate} fireToast={fireToast} />}
            {activeTab === "tickets"     && <TicketsTab     fireToast={fireToast} />}
            {activeTab === "files"       && <FilesTab       canDelete={canDelete} canExport={canExport} fireToast={fireToast} />}
          </div>
        </div>
      </div>

      <EditPersonalDetailsDialog
        open={editSection === "personal"}
        onOpenChange={(o) => !o && setEditSection(null)}
        profile={profile}
        setProfile={setProfile}
        fireToast={fireToast}
      />
      <EditAcademicDialog
        open={editSection === "academic"}
        onOpenChange={(o) => !o && setEditSection(null)}
        profile={profile}
        setProfile={setProfile}
        fireToast={fireToast}
      />
      <EditFamilyDialog
        open={editSection === "family"}
        onOpenChange={(o) => !o && setEditSection(null)}
        profile={profile}
        setProfile={setProfile}
        fireToast={fireToast}
      />

      {isJourneyStudent && (
        <>
          <CreateEnrolmentDialog open={journeyEnrolmentOpen} onOpenChange={setJourneyEnrolmentOpen} />
          <RecordPaymentDialog
            open={journeyPaymentOpen}
            onOpenChange={setJourneyPaymentOpen}
            defaultAmount={journey.invoice?.amount ?? journey.enrolment?.total ?? 0}
          />
        </>
      )}

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm shadow-lg",
            toast.tone === "warning"
              ? "bg-red-600 text-white"
              : toast.msg === "Saved"
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-white",
          )}
        >
          {toast.msg === "Saved" ? (
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Saved
            </span>
          ) : (
            toast.msg
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentProfilePage() {
  return (
    <Suspense>
      <StudentProfilePageContent />
    </Suspense>
  );
}
