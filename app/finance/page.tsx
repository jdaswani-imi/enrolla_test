"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePermission } from "@/lib/use-permission";
import { RoleBanner } from "@/components/ui/role-banner";
import { AccessDenied } from "@/components/ui/access-denied";
import {
  Search,
  Plus,
  Download,
  X,
  BarChart2,
  ClipboardList,
  Banknote,
  BookOpen,
  MoreHorizontal,
  Receipt,
  Eye,
  Bell,
  Ban,
} from "lucide-react";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { DateRangePicker, DATE_PRESETS, type DateRange } from "@/components/ui/date-range-picker";
import { SortableHeader } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useSavedSegments } from "@/hooks/use-saved-segments";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportDialog } from "@/components/ui/export-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  invoices,
  payments,
  creditLedger,
  students,
  type Invoice,
  type InvoiceStatus,
  type PaymentMethod,
  type Payment,
  type Credit,
} from "@/lib/mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number) {
  return `AED ${amount.toLocaleString()}`;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<InvoiceStatus, string> = {
  Draft:     "bg-slate-100 text-slate-600",
  Issued:    "bg-blue-100 text-blue-700",
  Part:      "bg-amber-100 text-amber-700",
  Paid:      "bg-emerald-100 text-emerald-700",
  Overdue:   "bg-red-100 text-red-700",
  Cancelled: "bg-slate-100 text-slate-400",
};

const METHOD_CONFIG: Record<PaymentMethod, string> = {
  Cash:            "bg-emerald-100 text-emerald-700",
  "Bank Transfer": "bg-blue-100 text-blue-700",
  Cheque:          "bg-violet-100 text-violet-700",
  Card:            "bg-amber-100 text-amber-700",
};

const STATUS_FILTER_OPTIONS = ["Draft", "Issued", "Part", "Paid", "Overdue", "Cancelled"];
const DEPT_FILTER_OPTIONS   = ["Primary", "Lower Secondary", "Senior"];

// ─── Save Segment Popover ─────────────────────────────────────────────────────

function SaveSegmentPopover({ onSave, onClose }: { onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  return (
    <div className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-56 top-full left-0 mt-1">
      <p className="text-xs font-medium text-slate-700 mb-2">Name this segment</p>
      <input
        autoFocus
        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:border-amber-400"
        placeholder="e.g. Overdue Primary"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onSave(name.trim());
          if (e.key === "Escape") onClose();
        }}
      />
      <div className="flex gap-2">
        <button onClick={() => name.trim() && onSave(name.trim())} className="flex-1 bg-amber-500 text-white text-xs py-1.5 rounded-lg hover:bg-amber-600 cursor-pointer">Save</button>
        <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-xs py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">Cancel</button>
      </div>
    </div>
  );
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "red" | "amber" | "green";
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col gap-1",
        accent === "red"   && "border-l-4 border-l-red-400",
        accent === "amber" && "border-l-4 border-l-amber-400",
        accent === "green" && "border-l-4 border-l-emerald-400",
      )}
    >
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={cn(
        "text-xl font-bold",
        accent === "red" ? "text-red-600" : "text-slate-800"
      )}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Invoice Preview Dialog ───────────────────────────────────────────────────

function InvoicePreviewDialog({
  invoice,
  open,
  onClose,
  canRecordPayment,
  onRecordPayment,
}: {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  canRecordPayment?: boolean;
  onRecordPayment?: (invoice: Invoice) => void;
}) {
  if (!invoice) return null;
  const payable =
    invoice.status !== "Paid" &&
    invoice.status !== "Cancelled" &&
    invoice.status !== "Draft";
  const showRecordPayment = Boolean(canRecordPayment && payable && onRecordPayment);

  const subtotal  = invoice.amount / 1.05;
  const vat       = invoice.amount - subtotal;
  const amountDue = invoice.amount - invoice.amountPaid;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0">
        {/* Navy header */}
        <div className="bg-[#0F172A] text-white px-6 py-5 rounded-t-xl flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-white text-lg">
              IMI
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-300">Tax Invoice</p>
              <p className="font-mono font-bold text-xl mt-0.5">{invoice.id}</p>
              <p className="text-xs text-slate-300 mt-1">
                Issued {invoice.issueDate} · Due {invoice.dueDate}
              </p>
            </div>
          </div>
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", STATUS_CONFIG[invoice.status])}>
            {invoice.status === "Part" ? "Part Paid" : invoice.status}
          </span>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Bill To */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Bill To</p>
            <p className="text-sm font-semibold text-slate-800">{invoice.guardian}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-600">{invoice.student}</span>
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{invoice.yearGroup}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{invoice.department}</p>
          </div>

          {/* Line items */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Line Items</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs text-slate-500 py-2 font-medium">Subject</th>
                  <th className="text-right text-xs text-slate-500 py-2 font-medium">Sessions</th>
                  <th className="text-right text-xs text-slate-500 py-2 font-medium">Rate</th>
                  <th className="text-right text-xs text-slate-500 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-700">{invoice.description}</td>
                  <td className="py-2 text-right text-slate-600">20</td>
                  <td className="py-2 text-right text-slate-600">AED {Math.round(subtotal / 20).toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-700 font-medium">{fmt(Math.round(subtotal))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 border-t border-slate-200 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-700">{fmt(Math.round(subtotal))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">VAT (5%)</span>
              <span className="text-slate-700">{fmt(Math.round(vat))}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2 mt-2">
              <span className="text-slate-800">Total Due</span>
              <span className={amountDue > 0 ? "text-red-600" : "text-emerald-600"}>
                {amountDue > 0 ? fmt(amountDue) : "Paid in full"}
              </span>
            </div>
          </div>

          {/* Bank transfer details */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Bank Transfer Details</p>
            <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-600">
              <span className="text-slate-400">Bank</span><span>ADCB KBW</span>
              <span className="text-slate-400">Account Name</span><span>Improve ME Institute</span>
              <span className="text-slate-400">IBAN</span><span className="font-mono">AE12 3456 7890 1234 5678 901</span>
              <span className="text-slate-400">Swift</span><span className="font-mono">ADCBAEAA</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => toast.success(`Downloading ${invoice.id}...`)}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-lg hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          {showRecordPayment && (
            <button
              type="button"
              onClick={() => onRecordPayment!(invoice)}
              className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              Record Payment
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Record Payment Dialog ────────────────────────────────────────────────────

function RecordPaymentDialog({
  invoice,
  open,
  onClose,
  onSaved,
}: {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const amountDue = invoice ? invoice.amount - invoice.amountPaid : 0;
  const [payAmount, setPayAmount] = useState("0");
  const [payDate, setPayDate]     = useState(new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod] = useState<PaymentMethod>("Bank Transfer");
  const [payRef, setPayRef]       = useState("");
  const [payNotes, setPayNotes]   = useState("");

  useEffect(() => {
    if (invoice && open) {
      setPayAmount(String(amountDue));
      setPayDate(new Date().toISOString().slice(0, 10));
      setPayMethod("Bank Transfer");
      setPayRef("");
      setPayNotes("");
    }
  }, [invoice, open, amountDue]);

  if (!invoice) return null;

  const showRef = payMethod === "Bank Transfer" || payMethod === "Cheque";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment — {invoice.id}</DialogTitle>
          <DialogDescription>{invoice.student} · {invoice.yearGroup}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Amount Due</p>
              <p className="text-lg font-bold text-slate-800">{fmt(amountDue)}</p>
            </div>
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", STATUS_CONFIG[invoice.status])}>
              {invoice.status === "Part" ? "Part Paid" : invoice.status}
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block" htmlFor="rp-amount">
              Amount Paid <span className="text-red-500">*</span>
            </label>
            <input
              id="rp-amount"
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block" htmlFor="rp-date">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              id="rp-date"
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">
              Method <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["Cash", "Card", "Bank Transfer", "Cheque"] as PaymentMethod[]).map((m) => (
                <label
                  key={m}
                  className={cn(
                    "flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                    payMethod === m ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600 hover:border-amber-300"
                  )}
                >
                  <input
                    type="radio"
                    name="rp-method"
                    value={m}
                    checked={payMethod === m}
                    onChange={() => setPayMethod(m)}
                    className="accent-amber-500"
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>

          {showRef && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block" htmlFor="rp-ref">Reference #</label>
              <input
                id="rp-ref"
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder={payMethod === "Cheque" ? "e.g. CHQ-441" : "e.g. TRF-88421"}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block" htmlFor="rp-notes">Notes (optional)</label>
            <textarea
              id="rp-notes"
              rows={2}
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              toast.success(`Payment recorded for ${invoice.id}`);
              onSaved(invoice.id);
              onClose();
            }}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Save Payment
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Void Confirm Dialog ──────────────────────────────────────────────────────

function VoidConfirmDialog({
  invoice,
  open,
  onClose,
  onConfirm,
}: {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  if (!invoice) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Void invoice?</DialogTitle>
          <DialogDescription>
            Are you sure you want to void {invoice.id}? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(invoice.id); onClose(); }}
            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
          >
            Void Invoice
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invoice row three-dot menu ───────────────────────────────────────────────

function InvoiceRowMenu({
  invoice,
  onView,
  onVoid,
}: {
  invoice: Invoice;
  onView: () => void;
  onVoid: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const actions: { icon: typeof Eye; label: string; onClick: () => void; danger?: boolean }[] = [
    { icon: Eye,      label: "View Invoice",          onClick: onView },
    { icon: Bell,     label: "Send Payment Reminder", onClick: () => toast("Payment reminder queued — coming soon") },
    { icon: Download, label: "Download PDF",          onClick: () => toast.success(`Downloading ${invoice.id}...`) },
    { icon: Ban,      label: "Mark as Void",          onClick: onVoid, danger: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label="Row actions"
        className="p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg min-w-[200px] py-1">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                type="button"
                onClick={(e) => { e.stopPropagation(); a.onClick(); setOpen(false); }}
                className={cn(
                  "w-full text-left flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors cursor-pointer",
                  a.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Payment Detail Dialog ────────────────────────────────────────────────────

function PaymentDetailDialog({
  payment,
  open,
  onClose,
}: {
  payment: Payment | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!payment) return null;
  const ref = payment.reference || `PMT-${payment.invoice.replace("INV-", "")}`;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Detail</DialogTitle>
          <DialogDescription>{ref} · {payment.date}</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Student</p>
              <p className="text-slate-800 font-medium mt-0.5">{payment.student}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Invoice</p>
              <p className="text-slate-800 font-mono mt-0.5">{payment.invoice}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Amount</p>
              <p className="text-slate-800 font-bold mt-0.5">{fmt(payment.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Method</p>
              <span className={cn("inline-block px-2.5 py-1 rounded-full text-xs font-semibold mt-0.5", METHOD_CONFIG[payment.method])}>
                {payment.method}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Reference</p>
              <p className="text-slate-800 font-mono mt-0.5">{payment.reference || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Recorded By</p>
              <p className="text-slate-800 mt-0.5">{payment.recordedBy}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Recorded At</p>
              <p className="text-slate-800 mt-0.5">{payment.date}, 14:30</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => toast.success(`Downloading receipt ${ref}...`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Receipt
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Issue Credit Dialog ──────────────────────────────────────────────────────

const CREDIT_REASONS = [
  "Session cancelled by teacher",
  "Billing adjustment",
  "Overpayment",
  "Goodwill credit",
  "Rescheduling disruption",
  "Other",
];

function IssueCreditDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [studentQuery, setStudentQuery] = useState("");
  const [studentPick, setStudentPick]   = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState(CREDIT_REASONS[0]);
  const [notes, setNotes]   = useState("");

  useEffect(() => {
    if (open) {
      setStudentQuery("");
      setStudentPick(null);
      setAmount("");
      setReason(CREDIT_REASONS[0]);
      setNotes("");
    }
  }, [open]);

  const matches = useMemo(() => {
    if (!studentQuery || studentPick) return [];
    const q = studentQuery.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 5);
  }, [studentQuery, studentPick]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue Credit</DialogTitle>
          <DialogDescription>Apply a credit note to a student account.</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <div className="relative">
            <label className="text-xs font-medium text-slate-600 mb-1 block" htmlFor="ic-student">
              Student <span className="text-red-500">*</span>
            </label>
            <input
              id="ic-student"
              type="text"
              value={studentPick ?? studentQuery}
              onChange={(e) => { setStudentPick(null); setStudentQuery(e.target.value); }}
              placeholder="Search by student name…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
            {matches.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {matches.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setStudentPick(s.name); setStudentQuery(""); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                  >
                    <span className="font-medium text-slate-800">{s.name}</span>
                    <span className="text-xs text-slate-400 ml-2">{s.yearGroup} · {s.department}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block" htmlFor="ic-amount">
              Amount (AED) <span className="text-red-500">*</span>
            </label>
            <input
              id="ic-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block" htmlFor="ic-reason">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              id="ic-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            >
              {CREDIT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block" htmlFor="ic-notes">Notes</label>
            <textarea
              id="ic-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { toast.success("Credit issued successfully"); onClose(); }}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Issue Credit
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Credit Detail Dialog ─────────────────────────────────────────────────────

function CreditDetailDialog({
  credit,
  open,
  onClose,
}: {
  credit: (Credit & { ref: string }) | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!credit) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Credit Detail</DialogTitle>
          <DialogDescription>{credit.ref} · {credit.date}</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Student</p>
              <p className="text-slate-800 font-medium mt-0.5">{credit.student}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Amount</p>
              <p className="text-slate-800 font-bold mt-0.5">{fmt(credit.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Issued By</p>
              <p className="text-slate-800 mt-0.5">{credit.issuedBy}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Status</p>
              <span className={cn(
                "inline-block px-2.5 py-1 rounded-full text-xs font-semibold mt-0.5",
                credit.status === "Unused" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              )}>
                {credit.status}
              </span>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Reason</p>
              <p className="text-slate-800 mt-0.5">{credit.reason}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            Close
          </button>
          {credit.status === "Unused" && (
            <button
              type="button"
              onClick={() => { toast.success(`Applying ${credit.ref} to invoice...`); onClose(); }}
              className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              Apply to Invoice
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Generate Report Dialog ───────────────────────────────────────────────────

const REPORT_TYPES = [
  "Revenue Summary",
  "VAT Report",
  "Outstanding Invoices",
  "Payment Reconciliation",
];

function GenerateReportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [type, setType]   = useState(REPORT_TYPES[0]);
  const [from, setFrom]   = useState("");
  const [to, setTo]       = useState("");
  const [format, setFormat] = useState<"PDF" | "CSV">("PDF");

  useEffect(() => {
    if (open) {
      setType(REPORT_TYPES[0]);
      setFrom("");
      setTo("");
      setFormat("PDF");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>Create a new financial report for a custom period.</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block" htmlFor="gr-type">
              Report Type <span className="text-red-500">*</span>
            </label>
            <select
              id="gr-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            >
              {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block" htmlFor="gr-from">
                From <span className="text-red-500">*</span>
              </label>
              <input
                id="gr-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block" htmlFor="gr-to">
                To <span className="text-red-500">*</span>
              </label>
              <input
                id="gr-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">
              Format <span className="text-red-500">*</span>
            </p>
            <div className="inline-flex border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              {(["PDF", "CSV"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                    format === f ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { toast.success("Report queued — ready shortly"); onClose(); }}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Generate
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab 1 — Invoices ─────────────────────────────────────────────────────────

function InvoicesTab() {
  const { can } = usePermission();
  const router = useRouter();
  const [exportOpen, setExportOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [deptFilter, setDeptFilter]     = useState<string[]>([]);
  const [dateRange, setDateRange]       = useState<DateRange>({ from: null, to: null });
  const [search, setSearch]             = useState("");

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [payInvoice, setPayInvoice]         = useState<Invoice | null>(null);
  const [voidInvoice, setVoidInvoice]       = useState<Invoice | null>(null);
  const [paidOverrides, setPaidOverrides]   = useState<Set<string>>(new Set());
  const [voidedOverrides, setVoidedOverrides] = useState<Set<string>>(new Set());

  // Sort
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Segments
  const { segments, saveSegment, deleteSegment } = useSavedSegments("finance");
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);

  const hasActiveFilters = statusFilter.length > 0 || deptFilter.length > 0 || dateRange.from != null;

  useEffect(() => { setPage(1); }, [statusFilter, deptFilter, dateRange, search]);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function applySegment(filters: Record<string, string[]>) {
    setStatusFilter(filters.status ?? []);
    setDeptFilter(filters.department ?? []);
    setPage(1);
  }

  const filtered = useMemo(() => {
    let data = invoices.filter((inv) => {
      if (statusFilter.length > 0 && !statusFilter.includes(inv.status)) return false;
      if (deptFilter.length > 0 && !deptFilter.includes(inv.department)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !inv.student.toLowerCase().includes(q) &&
          !inv.id.toLowerCase().includes(q) &&
          !inv.guardian.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
    if (sortField) {
      data = [...data].sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sortField];
        const bv = (b as unknown as Record<string, unknown>)[sortField];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [statusFilter, deptFilter, search, sortField, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total Invoiced This Term" value="AED 284,500" />
        <SummaryCard label="Collected This Term"      value="AED 241,200" accent="green" />
        <SummaryCard label="Outstanding"              value="AED 43,300" />
        <SummaryCard label="Overdue"                  value="AED 18,400" sub="23 invoices" accent="red" />
      </div>

      {/* Saved segments */}
      {segments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 uppercase tracking-wide">Saved:</span>
          {segments.map(seg => (
            <div key={seg.id} className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <button onClick={() => applySegment(seg.filters)} className="text-xs text-amber-700 font-medium hover:text-amber-900 cursor-pointer">{seg.name}</button>
              <button onClick={() => deleteSegment(seg.id)} className="text-amber-400 hover:text-amber-700 ml-1 text-xs cursor-pointer">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectFilter label="Status"     options={STATUS_FILTER_OPTIONS} selected={statusFilter} onChange={setStatusFilter} />
        <MultiSelectFilter label="Department" options={DEPT_FILTER_OPTIONS}   selected={deptFilter}   onChange={setDeptFilter}   />
        <DateRangePicker value={dateRange} onChange={setDateRange} presets={DATE_PRESETS} placeholder="Period" />

        {hasActiveFilters && (
          <div className="relative flex items-center gap-2">
            <button onClick={() => { setStatusFilter([]); setDeptFilter([]); setDateRange({ from: null, to: null }); }} className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium cursor-pointer">
              <X className="w-3.5 h-3.5" />Clear filters
            </button>
            <button onClick={() => setSavePopoverOpen(true)} className="text-xs text-amber-600 hover:text-amber-800 underline cursor-pointer">Save segment</button>
            {savePopoverOpen && (
              <SaveSegmentPopover
                onSave={(name) => { saveSegment(name, { status: statusFilter, department: deptFilter }); setSavePopoverOpen(false); }}
                onClose={() => setSavePopoverOpen(false)}
              />
            )}
          </div>
        )}

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, invoice #, guardian…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {can('bulk.generate.invoices') && (
            <button className="px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              Bulk Generate
            </button>
          )}
          {can('export') && (
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          {can('finance.createInvoice') && (
            <button
              onClick={() => router.push('/finance/invoice/new')}
              className="btn-primary flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          )}
        </div>
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Invoices"
        recordCount={23}
        formats={[
          { id: 'csv-row', label: 'One invoice per row', description: 'Download each invoice as one row. Invoice items are comma-separated. Recommended for quick review.', icon: 'rows', recommended: true },
          { id: 'csv-items', label: 'One item per row', description: 'Each invoice line-item appears in a separate row. Recommended for importing into accounting software.', icon: 'items' },
        ]}
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <SortableHeader label="Invoice #"   field="id"          sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Student"     field="student"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Guardian"    field="guardian"    sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap hidden md:table-cell">Description</th>
                <SortableHeader label="Issue Date"  field="issueDate"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Due Date"    field="dueDate"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell" />
                <SortableHeader label="Amount"      field="amount"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="right" />
                <SortableHeader label="Status"      field="status"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((baseInv) => {
                const inv = {
                  ...baseInv,
                  status: voidedOverrides.has(baseInv.id)
                    ? ("Cancelled" as InvoiceStatus)
                    : paidOverrides.has(baseInv.id)
                      ? ("Paid" as InvoiceStatus)
                      : baseInv.status,
                  amountPaid: paidOverrides.has(baseInv.id) ? baseInv.amount : baseInv.amountPaid,
                };
                return (
                <tr
                  key={inv.id}
                  onClick={() => setPreviewInvoice(inv)}
                  className={cn(
                    "border-b border-slate-100 transition-colors cursor-pointer",
                    inv.status === "Overdue" ? "bg-red-50 hover:bg-red-100/60"   : "",
                    inv.status === "Part"    ? "bg-amber-50 hover:bg-amber-100/60" : "",
                    inv.status !== "Overdue" && inv.status !== "Part" ? "hover:bg-slate-50" : "",
                  )}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-sm whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPreviewInvoice(inv); }}
                      className="text-slate-800 hover:text-amber-600 hover:underline transition-colors cursor-pointer"
                    >
                      {inv.id}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/students/${inv.studentId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-slate-800 text-sm leading-tight hover:text-amber-600 hover:underline transition-colors cursor-pointer"
                    >
                      {inv.student}
                    </Link>
                    <span className="block mt-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full w-fit">{inv.yearGroup}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{inv.guardian}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-[180px] truncate hidden md:table-cell">{inv.description}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{inv.issueDate}</td>
                  <td className={cn(
                    "px-4 py-3 text-sm whitespace-nowrap hidden md:table-cell",
                    inv.status === "Overdue" ? "text-red-600 font-medium" : "text-slate-500"
                  )}>
                    {inv.dueDate}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-right whitespace-nowrap">
                    {fmt(inv.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", STATUS_CONFIG[inv.status])}>
                      {inv.status === "Part" ? "Part Paid" : inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      {can('finance.logPayment') && inv.status !== "Paid" && inv.status !== "Cancelled" && inv.status !== "Draft" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setPayInvoice(inv); }}
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Record Payment
                        </button>
                      )}
                      <InvoiceRowMenu
                        invoice={inv}
                        onView={() => setPreviewInvoice(inv)}
                        onVoid={() => setVoidInvoice(inv)}
                      />
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState
              icon={Receipt}
              title="No invoices found"
              description="No invoices match your search or filters."
            />
          )}
        </div>
        <PaginationBar
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      </div>

      <InvoicePreviewDialog
        invoice={previewInvoice}
        open={previewInvoice !== null}
        onClose={() => setPreviewInvoice(null)}
        canRecordPayment={can('finance.logPayment')}
        onRecordPayment={(inv) => {
          setPreviewInvoice(null);
          setPayInvoice(inv);
        }}
      />
      <RecordPaymentDialog
        invoice={payInvoice}
        open={payInvoice !== null}
        onClose={() => setPayInvoice(null)}
        onSaved={(id) => setPaidOverrides((prev) => {
          const next = new Set(prev); next.add(id); return next;
        })}
      />
      <VoidConfirmDialog
        invoice={voidInvoice}
        open={voidInvoice !== null}
        onClose={() => setVoidInvoice(null)}
        onConfirm={(id) => {
          toast.success(`${id} voided`);
          setVoidedOverrides((prev) => {
            const next = new Set(prev); next.add(id); return next;
          });
        }}
      />
    </div>
  );
}

// ─── Tab 2 — Payments ─────────────────────────────────────────────────────────

function PaymentsTab() {
  const { can } = usePermission();
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Total Received This Month" value="AED 84,200" accent="green" />
        <SummaryCard label="Cash"                      value="AED 12,400" />
        <SummaryCard label="Bank Transfer"             value="AED 71,800" />
      </div>

      {can('export') && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      )}

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Payments"
        recordCount={10}
        formats={[
          { id: 'csv-summary', label: 'Payment Summary', description: 'One row per payment. Date, student, invoice, amount, method, reference, recorded by.', icon: 'rows', recommended: true },
          { id: 'csv-reconciliation', label: 'Reconciliation Export', description: 'Formatted for bank reconciliation. Includes transfer references and IBAN details.', icon: 'items' },
        ]}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Date", "Student", "Invoice #", "Amount", "Method", "Reference", "Recorded By"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap",
                      h === "Amount" && "text-right"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr
                  key={i}
                  onClick={() => setSelectedPayment(p)}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{p.date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">{p.student}</td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-600">{p.invoice}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-right whitespace-nowrap">{fmt(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", METHOD_CONFIG[p.method])}>
                      {p.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.reference || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{p.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentDetailDialog
        payment={selectedPayment}
        open={selectedPayment !== null}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
}

// ─── Tab 3 — Credits ──────────────────────────────────────────────────────────

function CreditsTab() {
  const { can } = usePermission();
  const [exportOpen, setExportOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<(Credit & { ref: string }) | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="grid grid-cols-2 gap-3 flex-1">
          <SummaryCard label="Total Credits Issued This Term" value="AED 4,800" accent="amber" />
          <SummaryCard label="Applied / Unused" value="AED 3,200 applied" sub="AED 1,600 unused" />
        </div>
        {can('export') && (
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors whitespace-nowrap mt-1"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
        {can('issue.credit') && (
          <button
            type="button"
            onClick={() => setIssueOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer whitespace-nowrap mt-1"
          >
            <Plus className="w-4 h-4" />
            Issue Credit
          </button>
        )}
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Credits"
        recordCount={6}
        formats={[
          { id: 'csv-credits', label: 'Credit Ledger', description: 'One row per credit. Date, student, amount, reason, issued by, status.', icon: 'rows', recommended: true },
          { id: 'csv-accounting', label: 'Accounting Export', description: 'Formatted for Zoho Books import. Includes credit note references.', icon: 'items' },
        ]}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Date", "Student", "Amount", "Reason", "Issued By", "Status"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3",
                      h === "Amount" && "text-right"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creditLedger.map((c, i) => {
                const ref = `CR-${String(1001 + i)}`;
                return (
                <tr
                  key={i}
                  onClick={() => setSelectedCredit({ ...c, ref })}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{c.date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">{c.student}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-right whitespace-nowrap">{fmt(c.amount)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{c.reason}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{c.issuedBy}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold",
                      c.status === "Unused" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {c.status}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <IssueCreditDialog open={issueOpen} onClose={() => setIssueOpen(false)} />
      <CreditDetailDialog
        credit={selectedCredit}
        open={selectedCredit !== null}
        onClose={() => setSelectedCredit(null)}
      />
    </div>
  );
}

// ─── Tab 4 — Reports ──────────────────────────────────────────────────────────

const REPORT_CARDS = [
  {
    icon: BarChart2,
    name: "Revenue Summary",
    description: "Total invoiced, collected, and outstanding by department and term.",
    lastGenerated: "Today 08:00",
  },
  {
    icon: ClipboardList,
    name: "Overdue Invoice Report",
    description: "All overdue invoices with guardian contact details and days overdue.",
    lastGenerated: "Yesterday",
  },
  {
    icon: Banknote,
    name: "Payment Reconciliation",
    description: "All payments this month by method with totals.",
    lastGenerated: "2 days ago",
  },
  {
    icon: BookOpen,
    name: "Credit Ledger Export",
    description: "All credits issued, applied, and unused.",
    lastGenerated: "5 days ago",
  },
];

const REPORT_HISTORY = [
  { name: "Revenue Summary",        generatedBy: "Jason Daswani", datetime: "Today, 08:00"     },
  { name: "Overdue Invoice Report", generatedBy: "Jason Daswani", datetime: "Yesterday, 17:30" },
  { name: "Payment Reconciliation", generatedBy: "Sarah Admin",   datetime: "14 Apr, 09:15"    },
  { name: "Revenue Summary",        generatedBy: "Jason Daswani", datetime: "12 Apr, 08:00"    },
  { name: "Credit Ledger Export",   generatedBy: "Sarah Admin",   datetime: "11 Apr, 14:40"    },
];

function ReportsTab() {
  const { can } = usePermission();
  const [generateOpen, setGenerateOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setGenerateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {REPORT_CARDS.map(({ icon: Icon, name, description, lastGenerated }) => (
          <div key={name} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
            <div className="p-2.5 bg-amber-50 rounded-lg w-fit">
              <Icon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{name}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
            </div>
            <p className="text-xs text-slate-400">Last generated: {lastGenerated}</p>
            <div className="flex items-center gap-2 mt-auto">
              <button
                type="button"
                onClick={() => toast.success("Report queued — ready shortly")}
                className="flex-1 py-1.5 border border-slate-200 text-sm text-slate-600 rounded-lg hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer font-medium"
              >
                Generate
              </button>
              {can('finance.export') && (
                <button
                  type="button"
                  onClick={() => toast.success(`Downloading ${name}...`)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">Reports History</p>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Report Name", "Generated By", "Date / Time", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REPORT_HISTORY.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-default">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{r.generatedBy}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{r.datetime}</td>
                  <td className="px-4 py-3">
                    {can('finance.export') && (
                      <button
                        type="button"
                        onClick={() => toast.success(`Downloading ${r.name}...`)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <GenerateReportDialog open={generateOpen} onClose={() => setGenerateOpen(false)} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "invoices" | "payments" | "credits" | "reports";

const TABS: { key: Tab; label: string }[] = [
  { key: "invoices", label: "Invoices"  },
  { key: "payments", label: "Payments"  },
  { key: "credits",  label: "Credits"   },
  { key: "reports",  label: "Reports"   },
];

export default function FinancePage() {
  const { can, role } = usePermission();
  const [tab, setTab] = useState<Tab>("invoices");

  if (!can('finance.view')) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-4 min-h-0">
      {role === 'Admin' && (
        <RoleBanner message="Discount and refund approvals require Admin Head or above." />
      )}
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-slate-200 -mt-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px",
              tab === key
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto pb-4">
        <div key={tab} className="page-enter">
          {tab === "invoices" && <InvoicesTab />}
          {tab === "payments" && <PaymentsTab />}
          {tab === "credits"  && <CreditsTab  />}
          {tab === "reports"  && <ReportsTab  />}
        </div>
      </div>
    </div>
  );
}
