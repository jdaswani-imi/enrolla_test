"use client";

import Link from "next/link";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronDown,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import {
  invoices,
  payments,
  creditLedger,
  type Invoice,
  type InvoiceStatus,
  type PaymentMethod,
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

const STATUS_FILTERS = ["All", "Draft", "Issued", "Part", "Paid", "Overdue", "Cancelled"];
const DEPT_FILTERS   = ["All", "Primary", "Lower Secondary", "Senior"];
const DATE_FILTERS   = ["This Term", "Last Term", "This Month", "Custom"];

// ─── FilterDropdown ───────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const defaultVal = options[0];
  const active = value !== defaultVal;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer",
          active
            ? "bg-amber-50 border-amber-300 text-amber-800"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        {active ? `${label}: ${value}` : label}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[170px]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer",
                value === opt
                  ? "bg-amber-50 text-amber-800 font-medium"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
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

// ─── Invoice Slide-Over ───────────────────────────────────────────────────────

function InvoiceSlideover({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [payAmount, setPayAmount]   = useState(String(invoice.amount - invoice.amountPaid));
  const [payMethod, setPayMethod]   = useState<PaymentMethod>("Bank Transfer");
  const [payRef, setPayRef]         = useState("");
  const [payNotes, setPayNotes]     = useState("");

  const subtotal  = invoice.amount / 1.05;
  const vat       = invoice.amount - subtotal;
  const amountDue = invoice.amount - invoice.amountPaid;

  return (
    <>
      <div className="fade-in fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="slide-in-right fixed right-0 top-0 h-full w-[480px] bg-white z-50 shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-mono font-bold text-slate-800 text-base">{invoice.id}</p>
              <p className="text-xs text-slate-400">{invoice.issueDate}</p>
            </div>
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", STATUS_CONFIG[invoice.status])}>
              {invoice.status === "Part" ? "Part Paid" : invoice.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Invoice to */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Invoice To</p>
            <p className="text-sm font-semibold text-slate-800">{invoice.guardian}</p>
            <p className="text-sm text-slate-500">{invoice.student} · {invoice.yearGroup}</p>
            <p className="text-sm text-slate-500">{invoice.department}</p>
          </div>

          {/* Line items */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Line Items</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs text-slate-500 py-1.5 font-medium">Description</th>
                  <th className="text-right text-xs text-slate-500 py-1.5 font-medium">Qty</th>
                  <th className="text-right text-xs text-slate-500 py-1.5 font-medium">Unit</th>
                  <th className="text-right text-xs text-slate-500 py-1.5 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-700 text-xs">{invoice.description}</td>
                  <td className="py-2 text-right text-slate-600 text-xs">20</td>
                  <td className="py-2 text-right text-slate-600 text-xs">AED {Math.round(subtotal / 20).toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-700 text-xs font-medium">{fmt(Math.round(subtotal))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 border-t border-slate-200 pt-4">
            {[
              { label: "Subtotal",        value: fmt(Math.round(subtotal)) },
              { label: "Discount",        value: "— AED 0" },
              { label: "Total excl. VAT", value: fmt(Math.round(subtotal)) },
              { label: "VAT (5%)",        value: fmt(Math.round(vat))      },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-700">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 mt-2">
              <span className="text-slate-800">Total</span>
              <span className="text-slate-800">{fmt(invoice.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount Paid</span>
              <span className="text-emerald-600">{invoice.amountPaid > 0 ? fmt(invoice.amountPaid) : "—"}</span>
            </div>
            <div className="flex justify-between text-base font-bold mt-1">
              <span className="text-slate-800">Amount Due</span>
              <span className={amountDue > 0 ? "text-red-600" : "text-emerald-600"}>
                {amountDue > 0 ? fmt(amountDue) : "Paid in full"}
              </span>
            </div>
          </div>

          {/* Payment history */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Payment History</p>
            {invoice.amountPaid === 0 ? (
              <p className="text-sm text-slate-400 italic">No payments recorded</p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 text-xs">
                  <span className="text-slate-600">Bank Transfer · {invoice.issueDate}</span>
                  <span className="font-semibold text-slate-700">{fmt(invoice.amountPaid)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Record Payment — accordion */}
          {amountDue > 0 && (
            <div>
              {!recordingPayment ? (
                <button
                  onClick={() => setRecordingPayment(true)}
                  className="w-full py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  Record Payment
                </button>
              ) : (
                <div className="border border-amber-200 rounded-xl bg-amber-50/40 p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Record Payment</p>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block" htmlFor="pay-amount">Amount (AED)</label>
                    <input
                      id="pay-amount"
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Payment Method</label>
                    <div className="flex flex-wrap gap-2">
                      {(["Cash", "Bank Transfer", "Cheque", "Card"] as PaymentMethod[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setPayMethod(m)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                            payMethod === m
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block" htmlFor="pay-ref">Reference #</label>
                    <input
                      id="pay-ref"
                      type="text"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder="e.g. TRF-88421"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block" htmlFor="pay-date">Date Received</label>
                    <input
                      id="pay-date"
                      type="date"
                      defaultValue="2025-04-16"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block" htmlFor="pay-notes">Notes (optional)</label>
                    <textarea
                      id="pay-notes"
                      rows={2}
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button className="flex-1 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer">
                      Save Payment
                    </button>
                    <button
                      onClick={() => setRecordingPayment(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Tab 1 — Invoices ─────────────────────────────────────────────────────────

function InvoicesTab() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter]     = useState("All");
  const [dateFilter, setDateFilter]     = useState("This Term");
  const [search, setSearch]             = useState("");
  const [selected, setSelected]         = useState<Invoice | null>(null);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "All" && inv.status !== statusFilter) return false;
      if (deptFilter !== "All" && inv.department !== deptFilter) return false;
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
  }, [statusFilter, deptFilter, search]);

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total Invoiced This Term" value="AED 284,500" />
        <SummaryCard label="Collected This Term"      value="AED 241,200" accent="green" />
        <SummaryCard label="Outstanding"              value="AED 43,300" />
        <SummaryCard label="Overdue"                  value="AED 18,400" sub="23 invoices" accent="red" />
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterDropdown label="Status"     value={statusFilter} options={STATUS_FILTERS} onChange={setStatusFilter} />
        <FilterDropdown label="Department" value={deptFilter}   options={DEPT_FILTERS}   onChange={setDeptFilter}   />
        <FilterDropdown label="Period"     value={dateFilter}   options={DATE_FILTERS}   onChange={setDateFilter}   />

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
          <button className="px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Bulk Generate
          </button>
          <button className="btn-primary flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg">
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Invoice #</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Student</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Guardian</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap hidden md:table-cell">Description</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Issue Date</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap hidden md:table-cell">Due Date</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Amount</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelected(inv)}
                  className={cn(
                    "border-b border-slate-100 transition-colors cursor-pointer",
                    inv.status === "Overdue" ? "bg-red-50 hover:bg-red-100/60"   : "",
                    inv.status === "Part"    ? "bg-amber-50 hover:bg-amber-100/60" : "",
                    inv.status !== "Overdue" && inv.status !== "Part" ? "hover:bg-slate-50" : "",
                  )}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800 text-sm whitespace-nowrap">{inv.id}</td>
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
                      {inv.status !== "Paid" && inv.status !== "Cancelled" && inv.status !== "Draft" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(inv); }}
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Record Payment
                        </button>
                      )}
                      <button className="p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer">
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
      </div>

      {selected && <InvoiceSlideover invoice={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Tab 2 — Payments ─────────────────────────────────────────────────────────

function PaymentsTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Total Received This Month" value="AED 84,200" accent="green" />
        <SummaryCard label="Cash"                      value="AED 12,400" />
        <SummaryCard label="Bank Transfer"             value="AED 71,800" />
      </div>

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
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-default">
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
    </div>
  );
}

// ─── Tab 3 — Credits ──────────────────────────────────────────────────────────

function CreditsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="grid grid-cols-2 gap-3 flex-1">
          <SummaryCard label="Total Credits Issued This Term" value="AED 4,800" accent="amber" />
          <SummaryCard label="Applied / Unused" value="AED 3,200 applied" sub="AED 1,600 unused" />
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer whitespace-nowrap mt-1">
          <Plus className="w-4 h-4" />
          Issue Credit
        </button>
      </div>

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
              {creditLedger.map((c, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-default">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
  return (
    <div className="space-y-6">
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
                onClick={() => console.log(`Generate: ${name}`)}
                className="flex-1 py-1.5 border border-slate-200 text-sm text-slate-600 rounded-lg hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer font-medium"
              >
                Generate
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
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
                    <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600 transition-colors cursor-pointer">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
  const [tab, setTab] = useState<Tab>("invoices");

  return (
    <div className="flex flex-col gap-4 min-h-0">
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
