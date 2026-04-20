"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useJourney, BILAL_LEAD_ID, type PaymentData } from "@/lib/journey-store";
import type { Lead } from "@/lib/mock-data";
import { FIELD, FieldLabel, FormActions } from "./dialog-parts";

const METHODS = ["Cash", "Bank Transfer", "Card", "Cheque"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

interface ConversionResult {
  studentId: string;
  studentName: string;
  previousStage: Lead["stage"];
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  lead,
  defaultAmount,
  onCommit,
  onAutoConvert,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead?: Lead | null;
  defaultAmount?: number;
  onCommit?: () => void;
  onAutoConvert?: (lead: Lead, payment: { amount: number; method: string }) => ConversionResult | null;
}) {
  const journey = useJourney();
  const leadId = lead?.id ?? "";
  const invoiceData = leadId ? journey.invoiceByLead[leadId] : undefined;

  const hasBuiltInvoice = Boolean(invoiceData);

  const totalDue = useMemo(() => {
    if (invoiceData) return invoiceData.total;
    if (typeof defaultAmount === "number") return defaultAmount;
    return journey.invoice?.amount ?? 0;
  }, [invoiceData, defaultAmount, journey.invoice]);

  const firstInstAmount = invoiceData?.paymentPlan?.firstAmount;
  const minFloor = firstInstAmount ?? totalDue;

  const [amountStr, setAmountStr] = useState<string>("");
  const [invoiceNumberInput, setInvoiceNumberInput] = useState<string>("");
  const [method, setMethod] = useState(METHODS[1]);
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState<
    | null
    | {
        amount: number;
        method: string;
        conversion: ConversionResult | null;
      }
  >(null);

  useEffect(() => {
    if (!open) return;
    setAmountStr(hasBuiltInvoice ? totalDue.toFixed(2) : "");
    setInvoiceNumberInput("");
    setMethod(METHODS[1]);
    setReference("");
    setDate(todayIso());
    setNotes("");
    setSuccess(null);
  }, [open, totalDue, hasBuiltInvoice]);

  const parsedAmount = Number.parseFloat(amountStr);
  const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  const amountEmpty = amountStr.trim() === "" || !Number.isFinite(parsedAmount) || parsedAmount <= 0;

  const remaining = hasBuiltInvoice
    ? Math.max(0, Math.round((totalDue - amount) * 100) / 100)
    : 0;
  const isPartial = hasBuiltInvoice && amount > 0 && amount < totalDue;
  const belowFloor = hasBuiltInvoice && amount > 0 && amount < minFloor;
  const status: PaymentData["status"] = isPartial ? "Part" : "Paid";

  const canSubmit = !amountEmpty && Boolean(method && date);

  function submit() {
    if (!canSubmit) return;
    const effectiveLeadId = leadId || BILAL_LEAD_ID;
    const effectiveTotalDue = hasBuiltInvoice ? totalDue : amount;
    const data: PaymentData = {
      amount,
      method,
      reference: reference.trim() || undefined,
      date,
      notes: notes.trim() || undefined,
      totalDue: effectiveTotalDue,
      remainingBalance: remaining,
      status,
    };

    journey.setPayment(effectiveLeadId, data);
    if (effectiveLeadId === BILAL_LEAD_ID && !isPartial) {
      journey.recordPayment({ amount, method, reference: reference.trim(), date });
    }

    // Partial payment path: no auto-conversion.
    if (isPartial) {
      toast.success(`Partial payment recorded — AED ${remaining.toFixed(0)} remaining`);
      onCommit?.();
      onOpenChange(false);
      return;
    }

    // Full payment: auto-convert to Won.
    const conversion = lead && onAutoConvert ? onAutoConvert(lead, { amount, method }) : null;
    setSuccess({ amount, method, conversion });

    toast.custom(
      (id) => (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg flex items-center gap-3 pl-3 pr-1.5 py-2.5 min-w-[340px]">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-900 flex-1">
            Payment recorded · Lead converted to Won
          </span>
          <button
            type="button"
            onClick={() => {
              // Revert payment
              journey.clearPayment(effectiveLeadId);
              // Revert conversion + lead stage to Invoice Sent
              if (conversion) {
                if (effectiveLeadId === BILAL_LEAD_ID) {
                  journey.undoConvertToStudent("Invoice Sent");
                }
                // The leads page onAutoConvert returns a result; caller is
                // expected to re-listen for undo through the toast it raises.
                // For non-Bilal, we rely on the outer page to handle its own
                // overrides via the returned previousStage snapshot.
                if (effectiveLeadId !== BILAL_LEAD_ID && typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("enrolla:undo-paid-conversion", {
                      detail: { leadId: effectiveLeadId, studentId: conversion.studentId, previousStage: conversion.previousStage },
                    }),
                  );
                }
              }
              setSuccess(null);
              onOpenChange(false);
              toast.dismiss(id);
            }}
            className="text-sm font-semibold text-amber-600 hover:text-amber-700 px-2.5 py-1 rounded cursor-pointer"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 6000 },
    );
  }

  function closeAfterSuccess() {
    // If auto-conversion already applied the Won stage, skip onCommit (which
    // would re-apply Paid and downgrade). Only call onCommit if conversion
    // did NOT happen (e.g. no lead context).
    if (!success?.conversion) onCommit?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>Match the incoming payment to the outstanding invoice.</DialogDescription>
        </DialogHeader>

        {success ? (
          <>
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-emerald-900">
                  Payment recorded — AED {success.amount.toFixed(0)} via {success.method}
                </p>
                {success.conversion ? (
                  <>
                    <p className="text-sm font-semibold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Lead converted to student — {success.conversion.studentId}
                    </p>
                    <Link
                      href={`/students/${success.conversion.studentId}`}
                      onClick={closeAfterSuccess}
                      className="inline-block text-sm font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-2"
                    >
                      View Student Profile →
                    </Link>
                  </>
                ) : (
                  <p className="text-xs text-emerald-800">
                    Invoice marked as paid. Conversion to student will be actioned from the lead detail.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAfterSuccess}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 cursor-pointer"
              >
                Close
              </button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
              {!hasBuiltInvoice && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                  <span>No invoice has been built for this lead. Please enter the amount manually.</span>
                </div>
              )}

              {/* Invoice summary */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
                <div className="flex justify-between items-center gap-3">
                  <span className="text-slate-500 shrink-0">Invoice</span>
                  {hasBuiltInvoice ? (
                    <span className="font-semibold text-slate-800">
                      {invoiceData?.invoiceNumber ?? journey.invoice?.id ?? "—"}
                    </span>
                  ) : (
                    <input
                      type="text"
                      className="flex-1 max-w-[220px] px-2 py-1 text-sm font-semibold text-slate-800 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      value={invoiceNumberInput}
                      onChange={(e) => setInvoiceNumberInput(e.target.value)}
                      placeholder="Invoice number"
                    />
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount due</span>
                  <span className="tabular-nums font-bold text-slate-900">
                    {hasBuiltInvoice ? `AED ${totalDue.toFixed(2)}` : "—"}
                  </span>
                </div>
                {firstInstAmount != null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">First instalment</span>
                    <span className="tabular-nums text-slate-700">AED {firstInstAmount.toFixed(0)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="rp-amount" required>Amount received (AED)</FieldLabel>
                  <input
                    id="rp-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    className={FIELD}
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder={hasBuiltInvoice ? undefined : "0.00"}
                  />
                  {amountEmpty && (
                    <p className="mt-1 text-xs text-red-600">Please enter the amount received.</p>
                  )}
                </div>
                <div>
                  <FieldLabel htmlFor="rp-method" required>Payment method</FieldLabel>
                  <select id="rp-method" className={FIELD} value={method} onChange={(e) => setMethod(e.target.value)}>
                    {METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <FieldLabel htmlFor="rp-ref">Reference number</FieldLabel>
                  <input
                    id="rp-ref"
                    className={FIELD}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Optional — e.g. bank reference, cheque no."
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="rp-date" required>Date received</FieldLabel>
                  <input id="rp-date" type="date" className={FIELD} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="rp-notes">Notes</FieldLabel>
                  <input
                    id="rp-notes"
                    className={FIELD}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {isPartial && (
                <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Partial payment</span>
                    <span className="tabular-nums">Remaining: AED {remaining.toFixed(2)}</span>
                  </div>
                  <p>Invoice status will be set to <strong>Part</strong>.</p>
                  {belowFloor && (
                    <p className="flex items-start gap-1.5 text-red-800">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        Payment below minimum instalment (AED {minFloor.toFixed(0)}) — enrolment remains Pending until Admin Head approves.
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <FormActions
              onCancel={() => onOpenChange(false)}
              onSubmit={submit}
              submitLabel="Record Payment"
              submitDisabled={!canSubmit}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
