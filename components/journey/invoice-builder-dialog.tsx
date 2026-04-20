"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useJourney,
  departmentFor,
  sessionRateFor,
  formatDate,
  TERM_WEEKS,
  ENROLMENT_FEE,
  VAT_RATE,
  MIN_SESSIONS_PER_SUBJECT,
  type InvoiceLine,
  type InvoiceBuilderData,
} from "@/lib/journey-store";
import type { Lead } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { FIELD, FieldLabel, FormActions } from "./dialog-parts";
import { WhatsAppBlock } from "./whatsapp-block";

function nextInvoiceNumber(): string {
  const n = 1043 + Math.floor(Math.random() * 50);
  return `INV-${n}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function revenueTagFor(dept: string) {
  if (dept === "Primary") return "Primary";
  if (dept === "Senior") return "Senior";
  return "Lower Secondary";
}

export function InvoiceBuilderDialog({
  open,
  onOpenChange,
  lead,
  onCommit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead?: Lead | null;
  onCommit?: () => void;
}) {
  const journey = useJourney();
  const leadId = lead?.id ?? "";
  const schedule = leadId ? journey.scheduleByLead[leadId] : undefined;

  const yearGroup = lead?.yearGroup ?? "Y7";
  const dept = useMemo(() => departmentFor(yearGroup), [yearGroup]);
  const revenueTag = revenueTagFor(dept);
  const guardianFirstName = (lead?.guardian ?? "Tariq Mahmood").split(" ")[0];
  const childName = lead?.childName ?? "Bilal Mahmood";

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [includeEnrolmentFee, setIncludeEnrolmentFee] = useState(true);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<"pct" | "aed">("pct");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [paymentPlan, setPaymentPlan] = useState(false);
  const [firstInstPct, setFirstInstPct] = useState(60);
  const [secondDueDate, setSecondDueDate] = useState("");
  const [sent, setSent] = useState(false);

  const totalSessionsPerWeek = useMemo(
    () => (schedule?.rows ?? []).reduce((sum, r) => sum + r.sessionsPerWeek, 0),
    [schedule],
  );
  const perSessionRate = useMemo(
    () => sessionRateFor(dept, totalSessionsPerWeek),
    [dept, totalSessionsPerWeek],
  );

  const tuitionLines: InvoiceLine[] = useMemo(() => {
    if (!schedule?.rows) return [];
    return schedule.rows.map((r) => {
      const sessions = r.sessionsPerWeek * TERM_WEEKS;
      return {
        subject: r.subject,
        term: "Term 3",
        sessions,
        rate: perSessionRate,
        subtotal: sessions * perSessionRate,
      };
    });
  }, [schedule, perSessionRate]);

  const tuitionSubtotal = useMemo(
    () => tuitionLines.reduce((s, l) => s + l.subtotal, 0),
    [tuitionLines],
  );

  const discountAmount = useMemo(() => {
    if (!applyDiscount || discountValue <= 0) return 0;
    if (discountType === "pct") {
      return Math.min(tuitionSubtotal, Math.round(tuitionSubtotal * (discountValue / 100) * 100) / 100);
    }
    return Math.min(tuitionSubtotal, discountValue);
  }, [applyDiscount, discountType, discountValue, tuitionSubtotal]);

  const enrolmentFeeAmount = includeEnrolmentFee ? ENROLMENT_FEE : 0;
  const postDiscountSubtotal = tuitionSubtotal - discountAmount + enrolmentFeeAmount;
  const vat = Math.round(postDiscountSubtotal * VAT_RATE * 100) / 100;
  const total = Math.round((postDiscountSubtotal + vat) * 100) / 100;

  const belowMinSubjects = tuitionLines.filter((l) => l.sessions < MIN_SESSIONS_PER_SUBJECT);
  const needsPaymentPlanOption = total >= 4000;

  const upsellRow = useMemo(() => {
    if (!schedule?.rows) return null;
    const single = schedule.rows.find((r) => r.sessionsPerWeek === 1);
    if (!single) return null;
    const midRate = sessionRateFor(dept, 2);
    const savingPerSession = perSessionRate - midRate;
    if (savingPerSession <= 0) return null;
    return {
      subject: single.subject,
      midRate,
      savingPerSession,
      termSaving: savingPerSession * TERM_WEEKS,
    };
  }, [schedule, dept, perSessionRate]);

  const firstInstAmount = paymentPlan ? Math.round(total * (firstInstPct / 100) * 100) / 100 : 0;
  const secondInstAmount = paymentPlan ? Math.round((total - firstInstAmount) * 100) / 100 : 0;

  useEffect(() => {
    if (!open) return;
    setInvoiceNumber(nextInvoiceNumber());
    const today = new Date().toISOString().slice(0, 10);
    setDueDate(addDaysIso(today, 7));
    setSecondDueDate(addDaysIso(today, 37));
    setNotes("");
    setIncludeEnrolmentFee(true);
    setApplyDiscount(false);
    setDiscountType("pct");
    setDiscountValue(0);
    setDiscountReason("");
    setPaymentPlan(false);
    setFirstInstPct(60);
    setSent(false);
  }, [open]);

  const canSubmit =
    Boolean(schedule?.rows?.length) &&
    invoiceNumber.trim().length > 0 &&
    Boolean(dueDate) &&
    belowMinSubjects.length === 0 &&
    (!applyDiscount || (discountValue > 0 && discountReason.trim().length > 0)) &&
    (!paymentPlan || firstInstPct >= 50);

  const message = useMemo(() => {
    if (!tuitionLines.length) return "";
    return `Hi ${guardianFirstName}, the term invoice for ${childName} is ready:

Invoice: ${invoiceNumber}
Total: AED ${total.toFixed(2)}
Due: ${dueDate ? formatDate(dueDate) : "—"}${paymentPlan ? `
Payment plan: AED ${firstInstAmount.toFixed(0)} now + AED ${secondInstAmount.toFixed(0)} by ${formatDate(secondDueDate)}` : ""}

Please transfer to our bank account and send the reference when done. Thank you — Improve ME Institute.`;
  }, [guardianFirstName, childName, invoiceNumber, total, dueDate, paymentPlan, firstInstAmount, secondInstAmount, secondDueDate, tuitionLines.length]);

  function submit() {
    if (!canSubmit || !leadId) return;
    const status: InvoiceBuilderData["status"] = applyDiscount ? "Draft" : "Issued";
    const lines: InvoiceLine[] = [
      ...tuitionLines,
      ...(includeEnrolmentFee
        ? [{
            subject: "Enrolment fee",
            term: "One-off",
            sessions: 1,
            rate: ENROLMENT_FEE,
            subtotal: ENROLMENT_FEE,
            isEnrolmentFee: true,
          }]
        : []),
    ];
    const data: InvoiceBuilderData = {
      invoiceNumber: invoiceNumber.trim(),
      lines,
      tuitionSubtotal,
      enrolmentFee: enrolmentFeeAmount,
      discountAmount,
      discountReason: applyDiscount ? discountReason.trim() : undefined,
      postDiscountSubtotal,
      vat,
      total,
      dueDate,
      notes: notes.trim() || undefined,
      revenueTag,
      paymentPlan: paymentPlan
        ? { firstAmount: firstInstAmount, secondAmount: secondInstAmount, secondDueDate }
        : undefined,
      status,
    };
    journey.setInvoice(leadId, data);
    toast.success(
      status === "Draft"
        ? `Invoice ${invoiceNumber} saved as Draft — pending Admin Head approval`
        : `Invoice ${invoiceNumber} issued — AED ${total.toFixed(0)} due ${formatDate(dueDate)}`,
    );
    onCommit?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[640px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Build &amp; issue invoice</DialogTitle>
          <DialogDescription>
            Invoice will be issued against the confirmed schedule. Rates are locked to the {revenueTag} tier.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 max-h-[76vh] overflow-y-auto">
          {!schedule?.rows?.length && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              No confirmed schedule on file — cannot build invoice.
            </div>
          )}

          {/* Line items */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Line items</p>
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div
                className="grid text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200 px-3 py-2"
                style={{ gridTemplateColumns: "1.8fr 0.8fr 0.8fr 0.8fr" }}
              >
                <div>Item</div>
                <div className="text-right">Sessions</div>
                <div className="text-right">Rate (AED)</div>
                <div className="text-right">Subtotal</div>
              </div>
              {tuitionLines.map((l) => (
                <div
                  key={l.subject}
                  className="grid px-3 py-2 border-b border-slate-100 text-sm text-slate-700"
                  style={{ gridTemplateColumns: "1.8fr 0.8fr 0.8fr 0.8fr" }}
                >
                  <div>
                    <span className="font-semibold text-slate-800">{l.subject}</span>
                    <span className="text-slate-500"> — {l.term}</span>
                    {l.sessions < MIN_SESSIONS_PER_SUBJECT && (
                      <span className="ml-2 inline-flex items-center text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded px-1.5">
                        below min {MIN_SESSIONS_PER_SUBJECT}
                      </span>
                    )}
                  </div>
                  <div className="text-right tabular-nums">{l.sessions}</div>
                  <div className="text-right tabular-nums">{l.rate.toFixed(0)}</div>
                  <div className="text-right tabular-nums font-semibold">{l.subtotal.toFixed(0)}</div>
                </div>
              ))}
              <div
                className="grid px-3 py-2 text-sm items-center"
                style={{ gridTemplateColumns: "1.8fr 0.8fr 0.8fr 0.8fr" }}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEnrolmentFee}
                    onChange={(e) => setIncludeEnrolmentFee(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                  <span className="text-slate-700">
                    <span className="font-semibold text-slate-800">Enrolment fee</span>
                    <span className="text-slate-500"> (non-discountable)</span>
                  </span>
                </label>
                <div />
                <div className="text-right tabular-nums">{ENROLMENT_FEE}</div>
                <div className="text-right tabular-nums font-semibold">{enrolmentFeeAmount.toFixed(0)}</div>
              </div>
            </div>

            {belowMinSubjects.length > 0 && (
              <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  {belowMinSubjects.map((l) => l.subject).join(", ")} below minimum {MIN_SESSIONS_PER_SUBJECT} sessions per subject. Adjust sessions/week in the schedule to proceed.
                </span>
              </div>
            )}

            {upsellRow && (
              <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                <span>
                  Adding 1 more session/week to <strong>{upsellRow.subject}</strong> would save AED {upsellRow.savingPerSession.toFixed(0)}/session (Mid tier: AED {upsellRow.midRate}). Total saving: AED {upsellRow.termSaving.toFixed(0)} this term.
                </span>
              </div>
            )}
          </div>

          {/* Discount */}
          <div className="rounded-lg border border-slate-200 p-3 space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={applyDiscount}
                onChange={(e) => setApplyDiscount(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
              Apply discount (tuition only)
            </label>
            {applyDiscount && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "pct" | "aed")}
                    className={FIELD}
                  >
                    <option value="pct">% off</option>
                    <option value="aed">AED off</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className={FIELD}
                    placeholder={discountType === "pct" ? "10" : "200"}
                  />
                  <input
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className={FIELD}
                    placeholder="Reason (required)"
                  />
                </div>
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                  <span>
                    Discount requires Admin Head approval. Invoice will be created as <strong>Draft</strong> until approved.
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Totals */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Tuition subtotal</span>
              <span className="tabular-nums text-slate-800 font-medium">AED {tuitionSubtotal.toFixed(2)}</span>
            </div>
            {applyDiscount && (
              <div className="flex justify-between">
                <span className="text-slate-500">Discount</span>
                <span className="tabular-nums text-red-600 font-medium">− AED {discountAmount.toFixed(2)}</span>
              </div>
            )}
            {includeEnrolmentFee && (
              <div className="flex justify-between">
                <span className="text-slate-500">Enrolment fee</span>
                <span className="tabular-nums text-slate-800 font-medium">AED {enrolmentFeeAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Post-discount subtotal</span>
              <span className="tabular-nums text-slate-800 font-medium">AED {postDiscountSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">VAT (5% post-discount)</span>
              <span className="tabular-nums text-slate-800 font-medium">AED {vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-700 font-semibold">Total</span>
              <span className="tabular-nums text-slate-900 font-bold">AED {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Invoice details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="ib-no" required>Invoice number</FieldLabel>
              <input
                id="ib-no"
                className={FIELD}
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="ib-due" required>Payment due date</FieldLabel>
              <input
                id="ib-due"
                type="date"
                className={FIELD}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <FieldLabel htmlFor="ib-notes">Notes</FieldLabel>
              <input
                id="ib-notes"
                className={FIELD}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
              <span>Revenue tag</span>
              <span className="font-semibold text-slate-700">{revenueTag}</span>
            </div>
          </div>

          {/* Payment plan */}
          {needsPaymentPlanOption && (
            <div className="rounded-lg border border-slate-200 p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentPlan}
                  onChange={(e) => setPaymentPlan(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                Offer payment plan (total ≥ AED 4,000)
              </label>
              {paymentPlan && (
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <FieldLabel htmlFor="ib-pct">First instalment (%)</FieldLabel>
                    <input
                      id="ib-pct"
                      type="number"
                      min={50}
                      max={100}
                      value={firstInstPct}
                      onChange={(e) => setFirstInstPct(Number(e.target.value))}
                      className={cn(FIELD, firstInstPct < 50 && "border-red-400")}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      AED {firstInstAmount.toFixed(0)} · min 50%
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Second instalment</FieldLabel>
                    <div className={cn(FIELD, "bg-slate-50 text-slate-600")}>
                      AED {secondInstAmount.toFixed(0)}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Auto-calculated</p>
                  </div>
                  <div>
                    <FieldLabel htmlFor="ib-2nd-due">Second due date</FieldLabel>
                    <input
                      id="ib-2nd-due"
                      type="date"
                      className={FIELD}
                      value={secondDueDate}
                      onChange={(e) => setSecondDueDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {tuitionLines.length > 0 && (
            <WhatsAppBlock message={message} sent={sent} onSentChange={setSent} />
          )}
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel={applyDiscount ? "Save as Draft" : "Issue Invoice"}
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
