"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Send,
  ListPlus,
  Pencil,
  Lock,
  CheckCircle,
  FileText,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  BookOpen,
  Mail,
  X as XIcon,
  ChevronRight,
  Download,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { guardians, students, type Guardian } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type FireToast = (msg: string, tone?: "default" | "warning") => void;
type Channel = "WhatsApp" | "Email";
type Relationship =
  | "Mother" | "Father" | "Grandparent" | "Uncle" | "Aunt" | "Legal Guardian" | "Other";

const RELATIONSHIPS: Relationship[] = [
  "Mother", "Father", "Grandparent", "Uncle", "Aunt", "Legal Guardian", "Other",
];

interface LinkedStudentRef {
  id: string;
  relationship: Relationship;
}

interface GuardianProfile {
  id: string;
  firstName: string;
  lastName: string;
  relationship: Relationship;
  phone: string;
  whatsappSame: boolean;
  whatsapp: string;
  email: string;
  nationality: string;
  homeArea: string;
  preferredChannel: Channel;
  dnc: boolean;
  dncReason: string;
  unsubscribed: boolean;
  mediaOptOut: boolean;
  linkedStudents: LinkedStudentRef[];
  coParentId: string | null;
  referralCode: string;
  totalReferrals: number;
  creditBalance: number;
  outstandingBalance: number;
  totalPaid: number;
  lastContact: string;
  dateAdded: string;
}

interface ActivityEvent {
  type: "invoice" | "payment" | "message" | "session" | "concern" | "assessment" | "enrolment" | "lead";
  description: string;
  timeAgo: string;
}

interface UpcomingSession {
  date: string;
  time: string;
  subject: string;
  studentName: string;
  teacher: string;
  room: string;
}

interface GuardianInvoiceRow {
  id: string;
  studentName: string;
  amount: string;
  status: "Paid" | "Overdue" | "Pending";
  dueDate: string;
}

interface GuardianMessageRow {
  channel: Channel;
  date: string;
  preview: string;
  direction: "Sent" | "Received";
}

interface ReferralRow {
  name: string;
  status: "Won" | "Pending";
  creditEarned: number;
}

type ConcernLevel = "L1" | "L2" | "L3";
type ConcernStatus = "Active" | "Resolved";

interface GuardianConcernRow {
  date: string;
  studentName: string;
  subject: string;
  level: ConcernLevel;
  status: ConcernStatus;
  raisedBy: string;
}

type TicketStatus = "Open" | "In Progress" | "Resolved";

interface GuardianTicketRow {
  date: string;
  subject: string;
  status: TicketStatus;
  assignedTo: string;
}

interface GuardianDetail {
  profile: GuardianProfile;
  activity: ActivityEvent[];
  upcomingSessions: UpcomingSession[];
  invoices: GuardianInvoiceRow[];
  messages: GuardianMessageRow[];
  referrals: ReferralRow[];
  concerns: GuardianConcernRow[];
  tickets: GuardianTicketRow[];
}

// ─── Seeded guardian profiles ────────────────────────────────────────────────

const FATIMA_PROFILE: GuardianProfile = {
  id: "G-001",
  firstName: "Fatima",
  lastName: "Rahman",
  relationship: "Mother",
  phone: "+971 50 123 4567",
  whatsappSame: true,
  whatsapp: "+971 50 123 4567",
  email: "fatima.rahman@gmail.com",
  nationality: "Emirati",
  homeArea: "Jumeirah 2, Dubai",
  preferredChannel: "WhatsApp",
  dnc: false,
  dncReason: "",
  unsubscribed: false,
  mediaOptOut: false,
  linkedStudents: [{ id: "IMI-0001", relationship: "Mother" }],
  coParentId: null,
  referralCode: "IMI-REF-001",
  totalReferrals: 1,
  creditBalance: 0,
  outstandingBalance: 1800,
  totalPaid: 5400,
  lastContact: "3 days ago",
  dateAdded: "12 Sep 2022",
};

const KHALID_PROFILE: GuardianProfile = {
  id: "G-002",
  firstName: "Khalid",
  lastName: "Al-Farsi",
  relationship: "Father",
  phone: "+971 55 234 5678",
  whatsappSame: true,
  whatsapp: "+971 55 234 5678",
  email: "khalid.alfarsi@gmail.com",
  nationality: "Emirati",
  homeArea: "Mirdif, Dubai",
  preferredChannel: "WhatsApp",
  dnc: false,
  dncReason: "",
  unsubscribed: false,
  mediaOptOut: false,
  linkedStudents: [{ id: "IMI-0002", relationship: "Father" }],
  coParentId: null,
  referralCode: "IMI-REF-002",
  totalReferrals: 2,
  creditBalance: 300,
  outstandingBalance: 0,
  totalPaid: 7200,
  lastContact: "7 days ago",
  dateAdded: "03 Mar 2023",
};

const NADIA_PROFILE: GuardianProfile = {
  id: "G-003",
  firstName: "Nadia",
  lastName: "Hassan",
  relationship: "Mother",
  phone: "+971 52 345 6789",
  whatsappSame: false,
  whatsapp: "+971 52 345 6700",
  email: "nadia.hassan@gmail.com",
  nationality: "Lebanese",
  homeArea: "Al Barsha, Dubai",
  preferredChannel: "Email",
  dnc: true,
  dncReason: "Requested no phone calls — email only",
  unsubscribed: false,
  mediaOptOut: true,
  linkedStudents: [{ id: "IMI-0003", relationship: "Mother" }],
  coParentId: null,
  referralCode: "IMI-REF-003",
  totalReferrals: 0,
  creditBalance: 0,
  outstandingBalance: 3780,
  totalPaid: 11600,
  lastContact: "3 days ago",
  dateAdded: "01 Sep 2021",
};

const FATIMA_DETAIL: GuardianDetail = {
  profile: FATIMA_PROFILE,
  activity: [
    { type: "invoice",    description: "Invoice issued — INV-1042, AED 3,200 (Aisha Rahman)",           timeAgo: "3 days ago"  },
    { type: "payment",    description: "Payment received — AED 1,800, Bank Transfer",                   timeAgo: "8 days ago"  },
    { type: "message",    description: "Message sent — WhatsApp, payment reminder",                      timeAgo: "15 days ago" },
    { type: "session",    description: "Aisha attended — Y8 English, Tue 8 Apr",                         timeAgo: "12 days ago" },
    { type: "concern",    description: "Concern raised — L1, Aisha Rahman, Y8 Maths attendance",         timeAgo: "10 days ago" },
    { type: "assessment", description: "Assessment booked — Y8 Maths diagnostic, 22 Apr",                timeAgo: "6 days ago"  },
    { type: "enrolment",  description: "Enrolment added — Y8 Science for Aisha Rahman",                  timeAgo: "14 days ago" },
    { type: "lead",       description: "Lead created — Noor Rahman (Y6 Maths enquiry)",                  timeAgo: "30 days ago" },
  ],
  upcomingSessions: [
    { date: "Mon 21 Apr", time: "15:00", subject: "Y8 Maths",   studentName: "Aisha Rahman", teacher: "Mr Ahmed Khalil",    room: "Room 3A" },
    { date: "Tue 22 Apr", time: "16:00", subject: "Y8 English", studentName: "Aisha Rahman", teacher: "Ms Sarah Mitchell",  room: "Room 2B" },
    { date: "Wed 23 Apr", time: "15:00", subject: "Y8 Maths",   studentName: "Aisha Rahman", teacher: "Mr Ahmed Khalil",    room: "Room 3A" },
    { date: "Thu 24 Apr", time: "16:00", subject: "Y8 English", studentName: "Aisha Rahman", teacher: "Ms Sarah Mitchell",  room: "Room 2B" },
    { date: "Fri 25 Apr", time: "14:00", subject: "Y8 Science", studentName: "Aisha Rahman", teacher: "Mr Tariq Al-Amin",   room: "Room 1C" },
  ],
  invoices: [
    { id: "INV-1042", studentName: "Aisha Rahman", amount: "AED 3,200", status: "Overdue", dueDate: "20 Apr 2025" },
    { id: "INV-0998", studentName: "Aisha Rahman", amount: "AED 2,880", status: "Paid",    dueDate: "29 Mar 2025" },
    { id: "INV-0967", studentName: "Aisha Rahman", amount: "AED 1,440", status: "Paid",    dueDate: "29 Mar 2025" },
    { id: "INV-0821", studentName: "Aisha Rahman", amount: "AED 3,200", status: "Paid",    dueDate: "17 Jan 2025" },
  ],
  messages: [
    { channel: "WhatsApp", date: "17 Apr 2025, 10:12", preview: "Thanks for the reminder — will transfer tomorrow morning.", direction: "Received" },
    { channel: "WhatsApp", date: "17 Apr 2025, 09:45", preview: "Friendly reminder: INV-1042 (AED 3,200) is due 20 Apr.",    direction: "Sent"     },
    { channel: "Email",    date: "15 Apr 2025, 18:00", preview: "Re: Term 3 schedule confirmation — all looks good.",         direction: "Received" },
    { channel: "WhatsApp", date: "12 Apr 2025, 14:30", preview: "Aisha's attendance report attached.",                        direction: "Sent"     },
    { channel: "Email",    date: "08 Apr 2025, 09:00", preview: "Y8 Maths progress update — end of March.",                   direction: "Sent"     },
  ],
  referrals: [
    { name: "Noor Rahman (cousin)", status: "Won",     creditEarned: 200 },
  ],
  concerns: [
    { date: "10 days ago", studentName: "Aisha Rahman", subject: "Y8 Maths — Inconsistent attendance",  level: "L1", status: "Active",   raisedBy: "Ahmed Khalil"   },
    { date: "30 days ago", studentName: "Aisha Rahman", subject: "Y8 English — Missed homework",        level: "L1", status: "Resolved", raisedBy: "Sarah Mitchell" },
  ],
  tickets: [
    { date: "3 days ago",  subject: "Invoice query — INV-1042",              status: "Open",     assignedTo: "Jason Daswani"  },
    { date: "14 days ago", subject: "Schedule change request — Y8 Maths",    status: "Resolved", assignedTo: "Sarah Thompson" },
  ],
};

const KHALID_DETAIL: GuardianDetail = {
  profile: KHALID_PROFILE,
  activity: [
    { type: "invoice",    description: "Invoice issued — INV-1021, AED 1,440 (Omar Al-Farsi)",    timeAgo: "5 days ago"  },
    { type: "payment",    description: "Payment received — AED 1,440, Card",                      timeAgo: "4 days ago"  },
    { type: "session",    description: "Omar attended — Y5 Maths, Sat 12 Apr",                     timeAgo: "8 days ago"  },
    { type: "message",    description: "Message sent — WhatsApp, Term 3 welcome",                  timeAgo: "20 days ago" },
    { type: "enrolment",  description: "Enrolment added — Y5 English for Omar Al-Farsi",          timeAgo: "25 days ago" },
    { type: "lead",       description: "Lead created — Maya Al-Farsi (Y2 English enquiry)",       timeAgo: "45 days ago" },
    { type: "assessment", description: "Assessment booked — Y5 English diagnostic",               timeAgo: "50 days ago" },
    { type: "concern",    description: "Minor concern logged — Y5 Maths homework completion",     timeAgo: "60 days ago" },
  ],
  upcomingSessions: [
    { date: "Sat 19 Apr", time: "10:00", subject: "Y5 Maths",   studentName: "Omar Al-Farsi", teacher: "Ms Leila Hassan", room: "Room 1B" },
    { date: "Sat 19 Apr", time: "11:30", subject: "Y5 English", studentName: "Omar Al-Farsi", teacher: "Ms Sarah Mitchell", room: "Room 2A" },
    { date: "Wed 23 Apr", time: "17:00", subject: "Y5 Maths",   studentName: "Omar Al-Farsi", teacher: "Ms Leila Hassan", room: "Room 1B" },
  ],
  invoices: [
    { id: "INV-1021", studentName: "Omar Al-Farsi", amount: "AED 1,440", status: "Paid",    dueDate: "15 Apr 2025" },
    { id: "INV-0956", studentName: "Omar Al-Farsi", amount: "AED 2,400", status: "Paid",    dueDate: "28 Mar 2025" },
    { id: "INV-0874", studentName: "Omar Al-Farsi", amount: "AED 3,360", status: "Paid",    dueDate: "15 Feb 2025" },
  ],
  messages: [
    { channel: "WhatsApp", date: "15 Apr 2025, 09:00", preview: "Thanks — transfer done.",                    direction: "Received" },
    { channel: "WhatsApp", date: "14 Apr 2025, 16:00", preview: "INV-1021 reminder — due tomorrow.",          direction: "Sent"     },
    { channel: "WhatsApp", date: "02 Apr 2025, 10:00", preview: "Welcome to Term 3! Omar's schedule attached.", direction: "Sent"   },
  ],
  referrals: [
    { name: "Aisha Nasser",     status: "Won",     creditEarned: 200 },
    { name: "Rashid Al-Kaabi",  status: "Pending", creditEarned: 0   },
  ],
  concerns: [],
  tickets: [],
};

const NADIA_DETAIL: GuardianDetail = {
  profile: NADIA_PROFILE,
  activity: [
    { type: "invoice",    description: "Invoice issued — INV-1055, AED 3,780 (Layla Hassan)",   timeAgo: "2 days ago"   },
    { type: "concern",    description: "Concern raised — L2, Layla Hassan, Y10 Physics grades", timeAgo: "4 days ago"   },
    { type: "message",    description: "Email sent — grade report",                              timeAgo: "6 days ago"   },
    { type: "session",    description: "Layla attended — Y10 Chemistry, Thu 10 Apr",             timeAgo: "9 days ago"   },
    { type: "assessment", description: "Assessment booked — Y10 Physics mock, 5 May",           timeAgo: "11 days ago"  },
    { type: "payment",    description: "Payment received — AED 4,200, Bank Transfer",            timeAgo: "18 days ago" },
    { type: "enrolment",  description: "Enrolment added — Y10 Physics for Layla Hassan",         timeAgo: "22 days ago" },
    { type: "lead",       description: "Lead created — Youssef Hassan (Y7 Science enquiry)",     timeAgo: "40 days ago" },
  ],
  upcomingSessions: [
    { date: "Mon 21 Apr", time: "17:00", subject: "Y10 Physics",   studentName: "Layla Hassan", teacher: "Mr Tariq Al-Amin", room: "Room 4A" },
    { date: "Wed 23 Apr", time: "17:00", subject: "Y10 Chemistry", studentName: "Layla Hassan", teacher: "Dr Aaliya Khan",   room: "Room 4B" },
    { date: "Fri 25 Apr", time: "18:00", subject: "Y10 Maths",     studentName: "Layla Hassan", teacher: "Mr Ahmed Khalil",  room: "Room 3A" },
  ],
  invoices: [
    { id: "INV-1055", studentName: "Layla Hassan", amount: "AED 3,780", status: "Overdue", dueDate: "18 Apr 2025" },
    { id: "INV-0989", studentName: "Layla Hassan", amount: "AED 4,200", status: "Paid",    dueDate: "25 Mar 2025" },
    { id: "INV-0865", studentName: "Layla Hassan", amount: "AED 3,600", status: "Paid",    dueDate: "28 Feb 2025" },
    { id: "INV-0792", studentName: "Layla Hassan", amount: "AED 3,600", status: "Paid",    dueDate: "18 Jan 2025" },
  ],
  messages: [
    { channel: "Email", date: "14 Apr 2025, 10:00", preview: "Layla's March grade report attached.",                direction: "Sent"     },
    { channel: "Email", date: "10 Apr 2025, 16:20", preview: "Could we reschedule Friday's Physics session?",        direction: "Received" },
    { channel: "Email", date: "02 Apr 2025, 09:00", preview: "Term 3 Physics enrolment confirmation.",               direction: "Sent"     },
  ],
  referrals: [],
  concerns: [],
  tickets: [],
};

const GUARDIAN_DETAILS: Record<string, GuardianDetail> = {
  "G-001": FATIMA_DETAIL,
  "G-002": KHALID_DETAIL,
  "G-003": NADIA_DETAIL,
};

function buildFallbackDetail(g: Guardian): GuardianDetail {
  const parts = g.name.split(" ");
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ") || "—";
  const profile: GuardianProfile = {
    id: g.id,
    firstName,
    lastName,
    relationship: "Mother",
    phone: g.phone,
    whatsappSame: true,
    whatsapp: g.phone,
    email: g.email,
    nationality: "—",
    homeArea: "—",
    preferredChannel: "WhatsApp",
    dnc: false,
    dncReason: "",
    unsubscribed: false,
    mediaOptOut: false,
    linkedStudents: g.students.map((s) => ({ id: s.id, relationship: "Mother" as Relationship })),
    coParentId: null,
    referralCode: `IMI-REF-${g.id.replace("G-", "")}`,
    totalReferrals: 0,
    creditBalance: 0,
    outstandingBalance: 0,
    totalPaid: 0,
    lastContact: "—",
    dateAdded: "—",
  };
  return {
    profile,
    activity: [
      { type: "message",  description: `No recent activity logged for ${g.name}.`, timeAgo: "—" },
    ],
    upcomingSessions: [],
    invoices: [],
    messages: [],
    referrals: [],
    concerns: [],
    tickets: [],
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${(last || "").charAt(0)}`.toUpperCase();
}

function studentInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function formatAed(amount: number): string {
  return `AED ${amount.toLocaleString()}`;
}

const AVATAR_PALETTES = [
  { bg: "bg-amber-500",   ring: "ring-amber-200"   },
  { bg: "bg-teal-500",    ring: "ring-teal-200"    },
  { bg: "bg-blue-500",    ring: "ring-blue-200"    },
  { bg: "bg-violet-500",  ring: "ring-violet-200"  },
  { bg: "bg-rose-500",    ring: "ring-rose-200"    },
  { bg: "bg-emerald-500", ring: "ring-emerald-200" },
];

function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

// ─── Shared form primitives (mirrors student profile) ────────────────────────

const FIELD_INPUT =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-slate-600">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600">{msg}</p>;
}

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

function EditableSectionHeader({ label, onEdit }: { label: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
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

// ─── Edit Dialogs ────────────────────────────────────────────────────────────

function EditCommunicationStatusDialog({
  open,
  onOpenChange,
  profile,
  setProfile,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: GuardianProfile;
  setProfile: (p: GuardianProfile) => void;
  fireToast: FireToast;
}) {
  const [channel, setChannel] = useState<Channel>(profile.preferredChannel);
  const [dnc, setDnc] = useState(profile.dnc);
  const [dncReason, setDncReason] = useState(profile.dncReason);
  const [unsubscribed, setUnsubscribed] = useState(profile.unsubscribed);
  const [mediaOptOut, setMediaOptOut] = useState(profile.mediaOptOut);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (open) {
      setChannel(profile.preferredChannel);
      setDnc(profile.dnc);
      setDncReason(profile.dncReason);
      setUnsubscribed(profile.unsubscribed);
      setMediaOptOut(profile.mediaOptOut);
      setErrors({});
    }
  }, [open, profile]);

  function submit() {
    const next: Record<string, string | null> = {};
    if (dnc && !dncReason.trim()) next.dncReason = "Reason is required when DNC is active";
    if (Object.keys(next).length) { setErrors(next); return; }
    setProfile({ ...profile, preferredChannel: channel, dnc, dncReason: dnc ? dncReason.trim() : "", unsubscribed, mediaOptOut });
    fireToast("Saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)]">
        <DialogHeader>
          <DialogTitle>Edit Communication Status</DialogTitle>
          <DialogDescription>Preferred channel, DNC flag, and opt-outs.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <FieldLabel>Preferred channel</FieldLabel>
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

          <ToggleRow
            label="DNC (Do Not Contact)"
            hint="Guardian has requested no contact by phone."
            value={dnc}
            onChange={setDnc}
          />
          {dnc && (
            <div className="space-y-1.5">
              <FieldLabel required>DNC reason</FieldLabel>
              <textarea
                className={cn(FIELD_INPUT, "min-h-[80px] resize-y")}
                value={dncReason}
                onChange={(e) => setDncReason(e.target.value)}
                placeholder="Why was DNC enabled?"
              />
              <FieldError msg={errors.dncReason ?? null} />
            </div>
          )}

          <ToggleRow
            label="Unsubscribed from marketing"
            hint="Blocks bulk messaging & campaigns."
            value={unsubscribed}
            onChange={setUnsubscribed}
          />

          <ToggleRow
            label="Media opt-out"
            hint="Exclude from photos, videos, and social posts."
            value={mediaOptOut}
            onChange={setMediaOptOut}
          />
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

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer mt-0.5",
          value ? "bg-amber-500" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            value ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
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
  profile: GuardianProfile;
  setProfile: (p: GuardianProfile) => void;
  fireToast: FireToast;
}) {
  const [phone, setPhone] = useState(profile.phone);
  const [whatsappSame, setWhatsappSame] = useState(profile.whatsappSame);
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp);
  const [email, setEmail] = useState(profile.email);
  const [nationality, setNationality] = useState(profile.nationality);
  const [homeArea, setHomeArea] = useState(profile.homeArea);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (open) {
      setPhone(profile.phone);
      setWhatsappSame(profile.whatsappSame);
      setWhatsapp(profile.whatsapp);
      setEmail(profile.email);
      setNationality(profile.nationality);
      setHomeArea(profile.homeArea);
      setErrors({});
    }
  }, [open, profile]);

  function submit() {
    const next: Record<string, string | null> = {};
    if (!phone.trim()) next.phone = "Phone is required";
    if (!email.trim()) next.email = "Email is required";
    if (Object.keys(next).length) { setErrors(next); return; }
    setProfile({
      ...profile,
      phone: phone.trim(),
      whatsappSame,
      whatsapp: whatsappSame ? phone.trim() : whatsapp.trim(),
      email: email.trim(),
      nationality: nationality.trim(),
      homeArea: homeArea.trim(),
    });
    fireToast("Saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)]">
        <DialogHeader>
          <DialogTitle>Edit Personal Details</DialogTitle>
          <DialogDescription>Update {profile.firstName}&apos;s contact info.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <FieldLabel required>Phone</FieldLabel>
            <input type="text" className={FIELD_INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <FieldError msg={errors.phone ?? null} />
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
            <FieldLabel required>Email</FieldLabel>
            <input type="email" className={FIELD_INPUT} value={email} onChange={(e) => setEmail(e.target.value)} />
            <FieldError msg={errors.email ?? null} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Nationality</FieldLabel>
              <input type="text" className={FIELD_INPUT} value={nationality} onChange={(e) => setNationality(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Home area / district</FieldLabel>
              <input type="text" className={FIELD_INPUT} value={homeArea} onChange={(e) => setHomeArea(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <LockedField label="Guardian ID" value={profile.id} />
            <LockedField label="Date added" value={profile.dateAdded} />
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

function EditLinkedStudentsDialog({
  open,
  onOpenChange,
  profile,
  setProfile,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: GuardianProfile;
  setProfile: (p: GuardianProfile) => void;
  fireToast: FireToast;
}) {
  const [links, setLinks] = useState<LinkedStudentRef[]>(profile.linkedStudents);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLinks(profile.linkedStudents);
      setQuery("");
      setError(null);
    }
  }, [open, profile]);

  const matches = query.trim()
    ? students
        .filter(
          (s) =>
            !links.some((l) => l.id === s.id) &&
            s.name.toLowerCase().includes(query.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  function submit() {
    if (links.length === 0) { setError("At least one student must be linked"); return; }
    setProfile({ ...profile, linkedStudents: links });
    fireToast("Saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)]">
        <DialogHeader>
          <DialogTitle>Edit Linked Students</DialogTitle>
          <DialogDescription>Link students to {profile.firstName} and set the relationship.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <FieldLabel>Linked students</FieldLabel>
            {links.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No students linked yet.</p>
            ) : (
              <ul className="space-y-2">
                {links.map((l) => {
                  const student = students.find((s) => s.id === l.id);
                  if (!student) return null;
                  return (
                    <li key={l.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <span className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-white leading-none">
                          {studentInitials(student.name)}
                        </span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{student.name}</p>
                        <p className="text-[11px] text-slate-400 leading-none mt-0.5">{student.id} · {student.yearGroup}</p>
                      </div>
                      <select
                        className="rounded-md border border-slate-300 bg-white text-xs px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        value={l.relationship}
                        onChange={(e) => setLinks(links.map((x) => x.id === l.id ? { ...x, relationship: e.target.value as Relationship } : x))}
                      >
                        {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => setLinks(links.filter((x) => x.id !== l.id))}
                        aria-label={`Remove ${student.name}`}
                        className="p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                      >
                        <XIcon className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Search students to add</FieldLabel>
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
                        setLinks([...links, { id: s.id, relationship: "Mother" }]);
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

function EditCoParentDialog({
  open,
  onOpenChange,
  profile,
  setProfile,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: GuardianProfile;
  setProfile: (p: GuardianProfile) => void;
  fireToast: FireToast;
}) {
  const [coParentId, setCoParentId] = useState<string | null>(profile.coParentId);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setCoParentId(profile.coParentId);
      setQuery("");
    }
  }, [open, profile]);

  const selected = coParentId ? guardians.find((g) => g.id === coParentId) : null;
  const matches = query.trim()
    ? guardians
        .filter(
          (g) =>
            g.id !== profile.id &&
            g.id !== coParentId &&
            g.name.toLowerCase().includes(query.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  function submit() {
    setProfile({ ...profile, coParentId });
    fireToast("Saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)]">
        <DialogHeader>
          <DialogTitle>Edit Co-Parent</DialogTitle>
          <DialogDescription>Link another guardian as co-parent.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-500">Maximum 1 co-parent per guardian.</p>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Co-parent</FieldLabel>
            {selected ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5">
                <span className="text-sm font-medium text-amber-800">{selected.name}</span>
                <button
                  type="button"
                  onClick={() => setCoParentId(null)}
                  aria-label={`Remove ${selected.name}`}
                  className="p-0.5 rounded-full hover:bg-amber-100 cursor-pointer"
                >
                  <XIcon className="w-3.5 h-3.5 text-amber-700" />
                </button>
              </div>
            ) : (
              <>
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
                          onClick={() => { setCoParentId(g.id); setQuery(""); }}
                          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <span className="text-sm font-medium text-slate-700">{g.name}</span>
                          <span className="text-xs text-slate-400">{g.phone}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
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

// ─── Quick Action Dialogs ────────────────────────────────────────────────────

function SendMessageDialog({
  open,
  onOpenChange,
  guardianName,
  defaultChannel,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guardianName: string;
  defaultChannel: Channel;
  fireToast: FireToast;
}) {
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [message, setMessage] = useState("");
  const valid = message.trim().length > 0;

  useEffect(() => {
    if (open) {
      setChannel(defaultChannel);
      setMessage("");
    }
  }, [open, defaultChannel]);

  function submit() {
    fireToast("Message sent");
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>Send a message to {guardianName}.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
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
        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewTaskDialog({
  open,
  onOpenChange,
  guardianName,
  fireToast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guardianName: string;
  fireToast: FireToast;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const valid = title && priority && dueDate && assignee;

  function submit() {
    fireToast(`Task saved — ${title}`);
    setTitle(""); setPriority(""); setDueDate(""); setAssignee("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>Create a task linked to {guardianName}.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel required>Title</FieldLabel>
            <input type="text" className={FIELD_INPUT} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Follow up on overdue invoice" />
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
        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Task
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

type HeaderAction = "call" | "whatsapp" | "sendMessage" | "newTask";

function ProfileHeader({
  profile,
  detail,
  fireToast,
}: {
  profile: GuardianProfile;
  detail: GuardianDetail;
  fireToast: FireToast;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<HeaderAction | null>(null);
  const palette = getAvatarPalette(profile.firstName + profile.lastName);
  const displayName = `${profile.firstName} ${profile.lastName}`.trim();
  const ChannelIcon = profile.preferredChannel === "WhatsApp" ? MessageCircle : Mail;
  const linkedCount = profile.linkedStudents.length;

  const stats: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Outstanding",    value: formatAed(profile.outstandingBalance), highlight: profile.outstandingBalance > 0 },
    { label: "Total Paid",     value: formatAed(profile.totalPaid) },
    { label: "Linked Students", value: String(linkedCount) },
    { label: "Last Contact",    value: profile.lastContact },
  ];

  return (
    <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 z-10">
      <div className="mb-2">
        <button
          type="button"
          onClick={() => router.push("/guardians")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Guardians
        </button>
      </div>
      <div className="flex items-start justify-between gap-6 flex-wrap">
        {/* Left — Avatar + Name + Badges */}
        <div className="flex items-center gap-4">
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center shrink-0 ring-4", palette.bg, palette.ring)}>
            <span className="text-white font-bold text-xl leading-none">
              {getInitials(profile.firstName, profile.lastName)}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{displayName}</h1>
            <p className="text-xs text-slate-400 leading-none mt-0.5">{profile.relationship}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-300 text-slate-600">
                {profile.nationality || "—"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                <ChannelIcon className="w-3 h-3" />
                {profile.preferredChannel}
              </span>
              {profile.dnc && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  DNC
                </span>
              )}
              <span className="text-xs text-slate-500">{profile.id}</span>
            </div>
          </div>
        </div>

        {/* Right — Stats + Quick Actions */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="grid grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</p>
                <p className={cn("text-base font-bold mt-0.5", s.highlight ? "text-red-600" : "text-slate-800")}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => fireToast(profile.dnc ? "DNC active — call blocked" : `Calling ${displayName}…`, profile.dnc ? "warning" : "default")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Phone className="w-3 h-3 shrink-0" /> Call
            </button>
            <button
              type="button"
              onClick={() => fireToast("Opening WhatsApp…")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3 h-3 shrink-0" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setDialog("sendMessage")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3 shrink-0" /> Send Message
            </button>
            <button
              type="button"
              onClick={() => setDialog("newTask")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ListPlus className="w-3 h-3 shrink-0" /> New Task
            </button>
          </div>
        </div>
      </div>

      <SendMessageDialog
        open={dialog === "sendMessage"}
        onOpenChange={(o) => !o && setDialog(null)}
        guardianName={displayName}
        defaultChannel={profile.preferredChannel}
        fireToast={fireToast}
      />
      <NewTaskDialog
        open={dialog === "newTask"}
        onOpenChange={(o) => !o && setDialog(null)}
        guardianName={displayName}
        fireToast={fireToast}
      />
      {/* detail intentionally not consumed here — kept for shape parity */}
      <span className="hidden" data-activity-count={detail.activity.length} />
    </div>
  );
}

// ─── Left Sidebar ────────────────────────────────────────────────────────────

type EditSection = "comm" | "personal" | "linked" | "coParent";

function LeftSidebar({
  profile,
  onEdit,
}: {
  profile: GuardianProfile;
  onEdit: (s: EditSection) => void;
}) {
  const coParent = profile.coParentId ? guardians.find((g) => g.id === profile.coParentId) : null;
  return (
    <div className="px-4 py-4 space-y-5">

      {/* Communication Status */}
      <section className="group">
        <EditableSectionHeader label="Communication Status" onEdit={() => onEdit("comm")} />
        <dl className="space-y-1.5">
          <DetailRow label="Preferred channel" value={profile.preferredChannel} />
          <DetailRow
            label="DNC"
            value={profile.dnc ? `Yes${profile.dncReason ? ` — ${profile.dncReason}` : ""}` : "No"}
            highlight={profile.dnc}
          />
          <DetailRow label="Unsubscribed" value={profile.unsubscribed ? "Yes" : "No"} highlight={profile.unsubscribed} />
          <DetailRow label="Media opt-out" value={profile.mediaOptOut ? "Yes" : "No"} highlight={profile.mediaOptOut} />
        </dl>
      </section>

      <div className="border-t border-slate-100" />

      {/* Personal Details */}
      <section className="group">
        <EditableSectionHeader label="Personal Details" onEdit={() => onEdit("personal")} />
        <dl className="space-y-1.5">
          <DetailRow label="Phone" value={profile.phone || "—"} />
          <DetailRow label="WhatsApp" value={profile.whatsappSame ? "Same as phone" : (profile.whatsapp || "—")} />
          <DetailRow label="Email" value={profile.email || "—"} />
          <DetailRow label="Nationality" value={profile.nationality || "—"} />
          <DetailRow label="Home area" value={profile.homeArea || "—"} />
        </dl>
      </section>

      <div className="border-t border-slate-100" />

      {/* Linked Students */}
      <section className="group">
        <EditableSectionHeader label="Linked Students" onEdit={() => onEdit("linked")} />
        {profile.linkedStudents.length === 0 ? (
          <p className="text-xs text-slate-500 italic">None linked</p>
        ) : (
          <ul className="space-y-1">
            {profile.linkedStudents.map((l) => {
              const s = students.find((st) => st.id === l.id);
              if (!s) return null;
              return (
                <li key={l.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/students/${s.id}`}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors truncate"
                  >
                    {s.name} →
                  </Link>
                  <span className="text-[10px] text-slate-400 shrink-0">{s.yearGroup}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="border-t border-slate-100" />

      {/* Co-Parent */}
      <section className="group">
        <EditableSectionHeader label="Co-Parent" onEdit={() => onEdit("coParent")} />
        {coParent ? (
          <Link
            href={`/guardians/${coParent.id}`}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            {coParent.name} →
          </Link>
        ) : (
          <p className="text-xs text-slate-500 italic">None linked</p>
        )}
      </section>

      <div className="border-t border-slate-100" />

      {/* Referral */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Referral</p>
        <dl className="space-y-1.5">
          <DetailRow label="Referral code" value={profile.referralCode} mono />
          <DetailRow label="Total referrals" value={String(profile.totalReferrals)} />
          <DetailRow label="Credit balance" value={formatAed(profile.creditBalance)} />
        </dl>
      </section>
    </div>
  );
}

function DetailRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] text-slate-400 leading-none">{label}</dt>
      <dd className={cn(
        "text-xs font-medium leading-tight mt-0.5",
        mono && "font-mono",
        highlight ? "text-amber-700" : "text-slate-700",
      )}>
        {value}
      </dd>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",  label: "Overview"  },
  { id: "students",  label: "Students"  },
  { id: "invoices",  label: "Invoices"  },
  { id: "messages",  label: "Messages"  },
  { id: "concerns",  label: "Concerns"  },
  { id: "tickets",   label: "Tickets"   },
  { id: "referrals", label: "Referrals" },
] as const;

type TabId = typeof TABS[number]["id"];

function TabBar({ activeTab, setActiveTab }: { activeTab: TabId; setActiveTab: (t: TabId) => void }) {
  return (
    <div className="shrink-0 bg-white border-b border-slate-200 px-6 overflow-x-auto">
      <div className="flex items-end gap-0 whitespace-nowrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3.5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer shrink-0",
              activeTab === tab.id
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const ACTIVITY_META: Record<ActivityEvent["type"], { Icon: React.ElementType; color: string; bg: string }> = {
  invoice:    { Icon: FileText,        color: "text-amber-600",   bg: "bg-amber-50"   },
  payment:    { Icon: CreditCard,      color: "text-blue-600",    bg: "bg-blue-50"    },
  message:    { Icon: MessageSquare,   color: "text-blue-600",    bg: "bg-blue-50"    },
  session:    { Icon: CheckCircle,     color: "text-emerald-600", bg: "bg-emerald-50" },
  concern:    { Icon: AlertTriangle,   color: "text-red-500",     bg: "bg-red-50"     },
  assessment: { Icon: BookOpen,        color: "text-violet-600",  bg: "bg-violet-50"  },
  enrolment:  { Icon: UserPlus,        color: "text-emerald-600", bg: "bg-emerald-50" },
  lead:       { Icon: UserPlus,        color: "text-amber-600",   bg: "bg-amber-50"   },
};

function OverviewTab({ detail }: { detail: GuardianDetail }) {
  return (
    <div className="space-y-5">
      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Upcoming Sessions</p>
        {detail.upcomingSessions.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No upcoming sessions for linked students.</p>
        ) : (
          <div className="space-y-2">
            {detail.upcomingSessions.slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-slate-700 shrink-0">{s.date}</span>
                  <span className="text-sm text-slate-500 shrink-0">{s.time}</span>
                  <span className="text-sm text-slate-800 font-medium shrink-0">{s.subject}</span>
                  <span className="text-xs text-slate-400 truncate">{s.studentName} · {s.teacher}</span>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{s.room}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Recent Activity</p>
        <div className="space-y-3">
          {detail.activity.map((event, i) => {
            const { Icon, color, bg } = ACTIVITY_META[event.type];
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

function StudentsTab({ profile }: { profile: GuardianProfile }) {
  const router = useRouter();
  const rows = profile.linkedStudents
    .map((l) => students.find((s) => s.id === l.id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-10 text-center">
        <p className="text-sm text-slate-500">No students linked to this guardian.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {["Name", "Year", "Department", "Status", "Attendance", "Outstanding", ""].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr
              key={s.id}
              onClick={() => router.push(`/students/${s.id}`)}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white leading-none">
                      {studentInitials(s.name)}
                    </span>
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 leading-tight">{s.name}</p>
                    <p className="text-[11px] text-slate-400 leading-none mt-0.5">{s.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{s.yearGroup}</td>
              <td className="px-4 py-3 text-slate-600">{s.department}</td>
              <td className="px-4 py-3">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold",
                  s.status === "Active"    ? "bg-emerald-100 text-emerald-700" :
                  s.status === "Withdrawn" ? "bg-red-100 text-red-700"         :
                                             "bg-slate-200 text-slate-600",
                )}>
                  {s.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">87%</td>
              <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">AED 0</td>
              <td className="px-4 py-3 text-right">
                <ChevronRight className="w-4 h-4 text-slate-300 inline-block" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvoicesTab({ detail, fireToast }: { detail: GuardianDetail; fireToast: FireToast }) {
  if (detail.invoices.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-10 text-center">
        <p className="text-sm text-slate-500">No invoices for this guardian.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => fireToast("Downloading invoices…")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download All Invoices
        </button>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Invoice", "Student", "Amount", "Status", "Due", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {detail.invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{inv.id}</td>
                <td className="px-4 py-3 text-slate-700">{inv.studentName}</td>
                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{inv.amount}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                    inv.status === "Paid"    ? "bg-emerald-100 text-emerald-700" :
                    inv.status === "Overdue" ? "bg-red-100 text-red-700"         :
                                               "bg-amber-100 text-amber-700",
                  )}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{inv.dueDate}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => fireToast(`Downloading ${inv.id}…`)}
                    aria-label={`Download ${inv.id}`}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConcernsTab({ detail }: { detail: GuardianDetail }) {
  if (detail.concerns.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-10 text-center">
        <p className="text-sm text-slate-500">No concerns raised for this guardian.</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {["Date", "Student", "Subject", "Level", "Status", "Raised by"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {detail.concerns.map((c, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.date}</td>
              <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">{c.studentName}</td>
              <td className="px-4 py-3 text-slate-700">{c.subject}</td>
              <td className="px-4 py-3">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold",
                  c.level === "L1" ? "bg-amber-100 text-amber-700"   :
                  c.level === "L2" ? "bg-orange-100 text-orange-700" :
                                     "bg-red-100 text-red-700",
                )}>
                  {c.level}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold",
                  c.status === "Active"
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700",
                )}>
                  {c.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.raisedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TicketsTab({ detail }: { detail: GuardianDetail }) {
  if (detail.tickets.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-10 text-center">
        <p className="text-sm text-slate-500">No tickets for this guardian.</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {["Date", "Subject / Issue", "Status", "Assigned to"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {detail.tickets.map((t, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.date}</td>
              <td className="px-4 py-3 text-slate-700 font-medium">
                <span className="inline-flex items-center gap-2">
                  <Ticket className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {t.subject}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold",
                  t.status === "Open"        ? "bg-red-100 text-red-700"       :
                  t.status === "In Progress" ? "bg-amber-100 text-amber-700"   :
                                               "bg-emerald-100 text-emerald-700",
                )}>
                  {t.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.assignedTo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MessagesTab({ detail }: { detail: GuardianDetail }) {
  if (detail.messages.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-10 text-center">
        <p className="text-sm text-slate-500">No messages yet.</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
      {detail.messages.map((m, i) => {
        const Icon = m.channel === "WhatsApp" ? MessageCircle : Mail;
        return (
          <div key={i} className="p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-700">{m.channel}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                  m.direction === "Sent" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700",
                )}>
                  {m.direction}
                </span>
                <span className="text-[11px] text-slate-400">{m.date}</span>
              </div>
              <p className="text-sm text-slate-700 mt-1 leading-snug">{m.preview}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReferralsTab({ profile, detail }: { profile: GuardianProfile; detail: GuardianDetail }) {
  const totalCredit = detail.referrals.reduce((sum, r) => sum + r.creditEarned, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Referral Code</p>
          <p className="text-lg font-mono font-bold text-slate-800 mt-1">{profile.referralCode}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Total Credit Earned</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{formatAed(totalCredit)}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Current Balance</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{formatAed(profile.creditBalance)}</p>
        </div>
      </div>

      {detail.referrals.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-10 text-center">
          <p className="text-sm text-slate-500">No referrals yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Referred Contact", "Status", "Credit Earned"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detail.referrals.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-700 font-medium">{r.name}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      r.status === "Won" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                    )}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-semibold">{formatAed(r.creditEarned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GuardianProfilePage() {
  const { can } = usePermission();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "G-001";

  const baseDetail = useMemo<GuardianDetail>(() => {
    if (GUARDIAN_DETAILS[id]) return GUARDIAN_DETAILS[id];
    const raw = guardians.find((g) => g.id === id);
    if (raw) return buildFallbackDetail(raw);
    return FATIMA_DETAIL;
  }, [id]);

  const [profile, setProfile] = useState<GuardianProfile>(baseDetail.profile);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [editSection, setEditSection] = useState<EditSection | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "default" | "warning" } | null>(null);

  useEffect(() => {
    setProfile(baseDetail.profile);
    setActiveTab("overview");
  }, [baseDetail]);

  function fireToast(msg: string, tone: "default" | "warning" = "default") {
    setToast({ msg, tone });
    window.setTimeout(() => setToast(null), 2000);
  }

  if (!can("guardians.view")) return <AccessDenied />;

  const detail: GuardianDetail = { ...baseDetail, profile };

  return (
    <div className="-m-6 flex flex-col overflow-hidden" style={{ height: "calc(100dvh - 56px)" }}>
      <ProfileHeader profile={profile} detail={detail} fireToast={fireToast} />

      <div className="flex flex-1 min-h-0">
        <aside className="w-[260px] shrink-0 border-r border-slate-200 overflow-y-auto bg-white">
          <LeftSidebar profile={profile} onEdit={setEditSection} />
        </aside>

        <div className="flex-1 flex flex-col min-h-0">
          <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
            {activeTab === "overview"  && <OverviewTab  detail={detail} />}
            {activeTab === "students"  && <StudentsTab  profile={profile} />}
            {activeTab === "invoices"  && <InvoicesTab  detail={detail} fireToast={fireToast} />}
            {activeTab === "messages"  && <MessagesTab  detail={detail} />}
            {activeTab === "concerns"  && <ConcernsTab  detail={detail} />}
            {activeTab === "tickets"   && <TicketsTab   detail={detail} />}
            {activeTab === "referrals" && <ReferralsTab profile={profile} detail={detail} />}
          </div>
        </div>
      </div>

      <EditCommunicationStatusDialog
        open={editSection === "comm"}
        onOpenChange={(o) => !o && setEditSection(null)}
        profile={profile}
        setProfile={setProfile}
        fireToast={fireToast}
      />
      <EditPersonalDetailsDialog
        open={editSection === "personal"}
        onOpenChange={(o) => !o && setEditSection(null)}
        profile={profile}
        setProfile={setProfile}
        fireToast={fireToast}
      />
      <EditLinkedStudentsDialog
        open={editSection === "linked"}
        onOpenChange={(o) => !o && setEditSection(null)}
        profile={profile}
        setProfile={setProfile}
        fireToast={fireToast}
      />
      <EditCoParentDialog
        open={editSection === "coParent"}
        onOpenChange={(o) => !o && setEditSection(null)}
        profile={profile}
        setProfile={setProfile}
        fireToast={fireToast}
      />

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
