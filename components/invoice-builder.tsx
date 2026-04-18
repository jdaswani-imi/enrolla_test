'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Send, Plus, X, Building2, ChevronDown } from 'lucide-react';
import { students, type Student } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  subject: string;
  yearGroup: string;
  sessions: number;
  rate: number;
  frequency: string;
  duration: string;
}

export interface InvoiceBuilderProps {
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECTS = [
  'Maths', 'English', 'Science', 'Biology', 'Chemistry',
  'Physics', 'French', 'Arabic', 'Economics', 'Business Studies',
  'History', 'Geography', 'Computer Science', 'CAT4',
];

const YEAR_GROUPS = [
  'KG1', 'KG2', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6',
  'Y7', 'Y8', 'Y9', 'Y10', 'Y11', 'Y12', 'Y13',
];

const CATALOGUE_RATES: Record<string, number> = {
  KG1: 160, KG2: 160,
  Y1: 170, Y2: 170, Y3: 170,
  Y4: 180, Y5: 180, Y6: 180,
  Y7: 0, Y8: 0, Y9: 0,
  Y10: 0, Y11: 0, Y12: 0, Y13: 0,
};

const SECONDARY_GROUPS = new Set(['Y7', 'Y8', 'Y9', 'Y10', 'Y11', 'Y12', 'Y13']);

const BANK_ROUTING: Record<string, { name: string; account: string; iban: string }> = {
  Primary: {
    name: 'ADCB KBW',
    account: '10464418124001',
    iban: 'AE230030010464418124001',
  },
  'Lower Secondary': {
    name: 'ADCB KBW',
    account: '10464418920002',
    iban: 'AE920030010464418920002',
  },
  Senior: {
    name: 'ADCB KBW',
    account: '10464418920001',
    iban: 'AE220030010464418920001',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAED(n: number) {
  return `AED ${n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function fmtDate(dateStr: string) {
  if (!dateStr) return '';
  const [y, m, day] = dateStr.split('-');
  return `${day}/${m}/${y}`;
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer flex-shrink-0',
        checked ? 'bg-amber-500' : 'bg-slate-200',
      )}
    >
      <span className={cn(
        'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow',
        checked ? 'translate-x-4' : 'translate-x-1',
      )} />
    </button>
  );
}

// ─── Student Search ───────────────────────────────────────────────────────────

function StudentSearch({
  selected,
  onSelect,
}: {
  selected: Student | null;
  onSelect: (s: Student | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return students.slice(0, 8);
    const q = query.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  if (selected) {
    return (
      <div className="border border-slate-200 rounded-xl p-4 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-slate-900">{selected.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{selected.yearGroup}</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">{selected.department}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Billed to: {selected.guardian}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs text-amber-600 hover:text-amber-700 cursor-pointer font-medium"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search student..."
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden">
          {filtered.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => { onSelect(s); setOpen(false); setQuery(''); }}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-amber-50 text-left transition-colors cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-400">{s.yearGroup} · {s.department}</p>
              </div>
              <span className="text-xs text-slate-400 ml-4 flex-shrink-0">{s.guardian}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Line Item Row ────────────────────────────────────────────────────────────

function LineItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: LineItem;
  onChange: (updated: LineItem) => void;
  onRemove: () => void;
}) {
  const isSecondary = SECONDARY_GROUPS.has(item.yearGroup);
  const amount = item.sessions * item.rate;

  function update(patch: Partial<LineItem>) {
    const updated = { ...item, ...patch };
    if ('yearGroup' in patch && patch.yearGroup !== undefined) {
      updated.rate = CATALOGUE_RATES[patch.yearGroup] ?? 0;
    }
    onChange(updated);
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 mb-3 relative bg-white">
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-3 right-3 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
        aria-label="Remove line item"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="grid grid-cols-12 gap-3 items-end pr-6">
        <div className="col-span-4">
          <label className="text-xs text-slate-500 mb-1 block">Subject</label>
          <select
            value={item.subject}
            onChange={e => update({ subject: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            <option value="">Select...</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <label className="text-xs text-slate-500 mb-1 block">Year Group</label>
          <select
            value={item.yearGroup}
            onChange={e => update({ yearGroup: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            {YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <label className="text-xs text-slate-500 mb-1 block">Sessions</label>
          <input
            type="number"
            min={1}
            value={item.sessions}
            onChange={e => update({ sessions: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="col-span-2">
          <label className="text-xs text-slate-500 mb-1 block">Rate (AED)</label>
          <input
            type="number"
            min={0}
            value={item.rate}
            onChange={e => update({ rate: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="col-span-2">
          <label className="text-xs text-slate-500 mb-1 block">Amount</label>
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 whitespace-nowrap">
            {fmtAED(amount)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 flex-wrap">
        {isSecondary && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Frequency:</span>
            <select
              value={item.frequency}
              onChange={e => update({ frequency: e.target.value })}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              {['1×/week', '2×/week', '3×/week', '4+×/week'].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Duration:</span>
          <select
            value={item.duration}
            onChange={e => update({ duration: e.target.value })}
            className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            {['60 min', '90 min', '120 min'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-400 ml-auto">Valid until: 30 Jun 2025</span>
      </div>
    </div>
  );
}

// ─── PDF Preview ──────────────────────────────────────────────────────────────

interface Totals {
  subtotal: number;
  discountValue: number;
  totalExclVAT: number;
  vat: number;
  totalDue: number;
}

interface BankInfo {
  name: string;
  account: string;
  iban: string;
}

function PDFPreview({
  student,
  lineItems,
  issueDate,
  dueDate,
  discountEnabled,
  enrolmentFee,
  paymentPlan,
  planSplit,
  customSplit,
  totals,
  bankInfo,
}: {
  student: Student | null;
  lineItems: LineItem[];
  issueDate: string;
  dueDate: string;
  discountEnabled: boolean;
  enrolmentFee: boolean;
  paymentPlan: boolean;
  planSplit: '2' | '3' | 'custom';
  customSplit: [number, number, number];
  totals: Totals;
  bankInfo: BankInfo | null;
}) {
  const instalments = useMemo(() => {
    if (!paymentPlan || totals.totalDue < 4000) return [];
    if (planSplit === '2') {
      return [
        { label: 'Instalment 1', pct: 60, due: dueDate },
        { label: 'Instalment 2', pct: 40, due: addDays(dueDate, 30) },
      ];
    }
    if (planSplit === '3') {
      return [
        { label: 'Instalment 1', pct: 50, due: dueDate },
        { label: 'Instalment 2', pct: 25, due: addDays(dueDate, 30) },
        { label: 'Instalment 3', pct: 25, due: addDays(dueDate, 60) },
      ];
    }
    return customSplit.map((pct, i) => ({
      label: `Instalment ${i + 1}`,
      pct,
      due: i === 0 ? dueDate : addDays(dueDate, i * 30),
    }));
  }, [paymentPlan, planSplit, customSplit, dueDate, totals.totalDue]);

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-slate-200 text-[13px]">
      {/* Header band */}
      <div className="bg-[#1E3A8A] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center font-bold text-[#1E3A8A] text-xl flex-shrink-0">
            IMI
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">Improve ME Institute</p>
            <p className="text-white text-xs opacity-80">Gold &amp; Diamond Park, Dubai</p>
          </div>
        </div>
        <div className="text-right text-white">
          <p className="font-bold text-xl">TAX INVOICE</p>
          <p className="text-sm opacity-90">Invoice #IMI-0142</p>
          <p className="text-xs opacity-75">Date: {fmtDate(issueDate)}</p>
          <p className="text-xs opacity-75">Due: {fmtDate(dueDate)}</p>
        </div>
      </div>

      {/* Bill to / from */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border-b border-slate-200">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Bill To:</p>
          <p className="font-semibold text-slate-900">{student?.guardian ?? '—'}</p>
          <p className="text-sm text-slate-600">{student?.name ?? '—'}</p>
          <p className="text-xs text-slate-400">
            {student ? `${student.yearGroup} · ${student.department}` : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">TRN: TRN-XXXXXXXX</p>
          <p className="text-xs text-slate-500 mt-1">Payment Reference:</p>
          <p className="text-sm font-semibold text-slate-900">IMI-0142</p>
        </div>
      </div>

      {/* Line items */}
      <div className="p-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-800 text-white">
              {['Subject', 'Year', 'Sessions', 'Rate/Session', 'Amount'].map((h, i) => (
                <th
                  key={h}
                  className={cn('font-medium py-2 px-3 text-left', i >= 2 && 'text-right')}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-300 py-6 italic">
                  Add subjects to see line items
                </td>
              </tr>
            ) : (
              lineItems.map((item, i) => (
                <tr
                  key={item.id}
                  className={cn('border-b border-slate-100', i % 2 === 0 ? 'bg-white' : 'bg-slate-50')}
                >
                  <td className="py-2 px-3">{item.subject || '—'}</td>
                  <td className="py-2 px-3">{item.yearGroup}</td>
                  <td className="py-2 px-3 text-right">{item.sessions}</td>
                  <td className="py-2 px-3 text-right">AED {item.rate.toLocaleString('en-AE')}</td>
                  <td className="py-2 px-3 text-right font-medium">{fmtAED(item.sessions * item.rate)}</td>
                </tr>
              ))
            )}
            {enrolmentFee && (
              <tr className="border-b border-slate-100 bg-white">
                <td className="py-2 px-3 italic text-slate-500">Enrolment Fee</td>
                <td className="py-2 px-3 text-slate-400">—</td>
                <td className="py-2 px-3 text-right text-slate-400">—</td>
                <td className="py-2 px-3 text-right text-slate-400">—</td>
                <td className="py-2 px-3 text-right font-medium">{fmtAED(300)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-4 pb-4 border-t-2 border-slate-200 pt-4">
        <div className="ml-auto w-64 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal</span><span>{fmtAED(totals.subtotal)}</span>
          </div>
          {discountEnabled && totals.discountValue > 0 && (
            <div className="flex justify-between text-xs text-amber-600">
              <span>Discount</span><span>− {fmtAED(totals.discountValue)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-slate-600">
            <span>Total excl. VAT</span><span>{fmtAED(totals.totalExclVAT)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>VAT (5%)</span><span>{fmtAED(totals.vat)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 mt-2">
            <span className="text-slate-900">TOTAL DUE</span>
            <span className="text-slate-900">{fmtAED(totals.totalDue)}</span>
          </div>
        </div>

        {instalments.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Payment Schedule:</p>
            {instalments.map(inst => (
              <p key={inst.label} className="text-xs text-slate-600">
                {inst.label} — {fmtAED(totals.totalDue * inst.pct / 100)} — Due {fmtDate(inst.due)}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Bank details */}
      {bankInfo && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Please transfer payment to:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {(
              [
                ['Bank', 'ADCB KBW Branch'],
                ['Account', bankInfo.account],
                ['IBAN', bankInfo.iban],
                ['Swift', 'ADCBAEAA060'],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="text-slate-400 w-14 flex-shrink-0">{label}:</span>
                <span className="text-slate-600 break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 bg-slate-800 text-white text-[10px] text-center space-y-0.5">
        <p>Improve ME Institute LLC · Gold &amp; Diamond Park · Dubai, UAE</p>
        <p>TRN: TRN-XXXXXXXX · Tel: +971 4 XXX XXXX · info@improveme.ae</p>
        <p>Thank you for choosing Improve ME Institute</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvoiceBuilder({ onClose }: InvoiceBuilderProps) {
  const today = todayStr();

  // Bill To
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(addDays(today, 7));
  const [paymentTerms, setPaymentTerms] = useState('Net 7');

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Adjustments
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<'%' | 'AED'>('%');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('');
  const [enrolmentFee, setEnrolmentFee] = useState(true);
  const [enrolmentWaiver, setEnrolmentWaiver] = useState('');

  // Payment plan
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [planSplit, setPlanSplit] = useState<'2' | '3' | 'custom'>('2');
  const [customSplit, setCustomSplit] = useState<[number, number, number]>([50, 25, 25]);

  // Notes
  const [notes, setNotes] = useState('');

  function handleStudentSelect(s: Student | null) {
    setSelectedStudent(s);
    if (s) {
      setLineItems(prev =>
        prev.map(item => ({
          ...item,
          yearGroup: s.yearGroup,
          rate: CATALOGUE_RATES[s.yearGroup] ?? item.rate,
        })),
      );
    }
  }

  function addLineItem() {
    const yg = selectedStudent?.yearGroup ?? 'Y1';
    setLineItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        subject: '',
        yearGroup: yg,
        sessions: 10,
        rate: CATALOGUE_RATES[yg] ?? 0,
        frequency: '1×/week',
        duration: '60 min',
      },
    ]);
  }

  function updateLineItem(id: string, updated: LineItem) {
    setLineItems(prev => prev.map(item => (item.id === id ? updated : item)));
  }

  function removeLineItem(id: string) {
    setLineItems(prev => prev.filter(item => item.id !== id));
  }

  const bankInfo = useMemo(
    () => (selectedStudent ? (BANK_ROUTING[selectedStudent.department] ?? null) : null),
    [selectedStudent],
  );

  const totals = useMemo<Totals>(() => {
    const lineSubtotal = lineItems.reduce((acc, item) => acc + item.sessions * item.rate, 0);
    const enrolmentAmt = enrolmentFee ? 300 : 0;
    const subtotal = lineSubtotal + enrolmentAmt;

    let discountValue = 0;
    if (discountEnabled && discountAmount > 0) {
      discountValue =
        discountType === '%' ? subtotal * (discountAmount / 100) : discountAmount;
      discountValue = Math.min(discountValue, subtotal);
    }

    const totalExclVAT = subtotal - discountValue;
    const vat = totalExclVAT * 0.05;
    const rawTotal = totalExclVAT + vat;
    const totalDue = Math.round(rawTotal / 0.05) * 0.05;

    return { subtotal, discountValue, totalExclVAT, vat, totalDue };
  }, [lineItems, discountEnabled, discountType, discountAmount, enrolmentFee]);

  const customSplitSum = customSplit[0] + customSplit[1] + customSplit[2];

  const planRows = useMemo(() => {
    if (planSplit === '2') {
      return [
        { pct: 60, due: dueDate },
        { pct: 40, due: addDays(dueDate, 30) },
      ];
    }
    if (planSplit === '3') {
      return [
        { pct: 50, due: dueDate },
        { pct: 25, due: addDays(dueDate, 30) },
        { pct: 25, due: addDays(dueDate, 60) },
      ];
    }
    return customSplit.map((pct, i) => ({
      pct,
      due: i === 0 ? dueDate : addDays(dueDate, i * 30),
    }));
  }, [planSplit, customSplit, dueDate]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1200px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900 text-lg">New Invoice</span>
            <span className="text-slate-400 text-sm ml-1">IMI-0142</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-slate-100 text-slate-500 rounded-full px-3 py-1 text-xs font-medium">
              Draft
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Issue Invoice
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Left panel ── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-7">

            {/* BILL TO */}
            <section>
              <p className="text-xs uppercase text-slate-400 tracking-wide mb-3">Bill To</p>
              <StudentSearch selected={selectedStudent} onSelect={handleStudentSelect} />

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" htmlFor="ib-issue-date">
                    Issue Date
                  </label>
                  <input
                    id="ib-issue-date"
                    type="date"
                    value={issueDate}
                    onChange={e => setIssueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" htmlFor="ib-due-date">
                    Due Date
                  </label>
                  <input
                    id="ib-due-date"
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs text-slate-500 mb-1 block">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  {['Due on receipt', 'Net 7', 'Net 14', 'Net 30', 'Custom'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </section>

            {/* LINE ITEMS */}
            <section>
              <p className="text-xs uppercase text-slate-400 tracking-wide mb-3">Line Items</p>
              {lineItems.map(item => (
                <LineItemRow
                  key={item.id}
                  item={item}
                  onChange={updated => updateLineItem(item.id, updated)}
                  onRemove={() => removeLineItem(item.id)}
                />
              ))}
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium mt-2 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Subject
              </button>
            </section>

            {/* ADJUSTMENTS */}
            <section>
              <p className="text-xs uppercase text-slate-400 tracking-wide mb-3">Adjustments</p>

              {/* Discount toggle */}
              <div className="flex items-center gap-3 mb-2">
                <Toggle checked={discountEnabled} onChange={() => setDiscountEnabled(v => !v)} />
                <span className="text-sm text-slate-700">Apply discount</span>
              </div>

              {discountEnabled && (
                <div className="space-y-3 pl-12 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {(['%', 'AED'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setDiscountType(type)}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer',
                            discountType === type
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300',
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={discountAmount}
                      onChange={e =>
                        setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      className="w-28 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Reason for discount — required"
                    value={discountReason}
                    onChange={e => setDiscountReason(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  {discountAmount > 0 && (
                    <div className="bg-amber-50 rounded p-2 text-xs text-amber-700">
                      Admin Head will be notified of this discount
                    </div>
                  )}
                </div>
              )}

              {/* Enrolment fee */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-slate-700">Enrolment fee (AED 300)</span>
                <Toggle checked={enrolmentFee} onChange={() => setEnrolmentFee(v => !v)} />
              </div>
              {!enrolmentFee && (
                <input
                  type="text"
                  placeholder="Waiver reason"
                  value={enrolmentWaiver}
                  onChange={e => setEnrolmentWaiver(e.target.value)}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              )}
            </section>

            {/* PAYMENT PLAN */}
            <section>
              <p className="text-xs uppercase text-slate-400 tracking-wide mb-3">Payment Plan</p>

              <div className="flex items-center gap-3 mb-3">
                <Toggle checked={splitEnabled} onChange={() => setSplitEnabled(v => !v)} />
                <span className="text-sm text-slate-700">Split into instalments</span>
              </div>

              {splitEnabled && totals.totalDue < 4000 && (
                <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
                  Payment plans require a minimum of AED 4,000
                </div>
              )}

              {splitEnabled && totals.totalDue >= 4000 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { key: '2', label: '2 instalments', sub: '60% / 40%' },
                        { key: '3', label: '3 instalments', sub: '50% / 25% / 25%' },
                        { key: 'custom', label: 'Custom split', sub: 'Set your own' },
                      ] as const
                    ).map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPlanSplit(opt.key)}
                        className={cn(
                          'rounded-xl border-2 p-3 cursor-pointer text-center text-sm transition-colors',
                          planSplit === opt.key
                            ? 'border-amber-400 bg-amber-50'
                            : 'border-transparent bg-slate-50 hover:border-slate-300',
                        )}
                      >
                        <p className="font-medium text-slate-800">{opt.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{opt.sub}</p>
                      </button>
                    ))}
                  </div>

                  {planSplit === 'custom' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {([0, 1, 2] as const).map(i => (
                          <div key={i}>
                            <label className="text-xs text-slate-500 mb-1 block">
                              Instalment {i + 1} (%)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={customSplit[i]}
                              onChange={e => {
                                const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                setCustomSplit(prev => {
                                  const next = [...prev] as [number, number, number];
                                  next[i] = v;
                                  return next;
                                });
                              }}
                              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                        ))}
                      </div>
                      {customSplitSum !== 100 && (
                        <p className="text-xs text-red-500">
                          Percentages must sum to 100% (currently {customSplitSum}%)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Schedule table */}
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {['Instalment', 'Amount', 'Due Date', 'Status'].map(h => (
                            <th
                              key={h}
                              className="text-left px-3 py-2 text-slate-500 font-medium"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {planRows.map((row, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-2 font-medium text-slate-700">#{i + 1}</td>
                            <td className="px-3 py-2 text-slate-600">
                              {fmtAED(totals.totalDue * row.pct / 100)}
                            </td>
                            <td className="px-3 py-2 text-slate-500">{fmtDate(row.due)}</td>
                            <td className="px-3 py-2">
                              <span className="bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                                Pending
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* NOTES */}
            <section>
              <p className="text-xs uppercase text-slate-400 tracking-wide mb-3">Notes</p>
              <textarea
                rows={2}
                placeholder="Internal notes — not shown on the invoice"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
              />

              {bankInfo && (
                <div className="mt-3 bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2">Payment to:</p>
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-600">{bankInfo.name}</p>
                      <p className="text-xs text-slate-600">Account: {bankInfo.account}</p>
                      <p className="text-xs text-slate-600">IBAN: {bankInfo.iban}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">(Auto-selected based on year group)</p>
                </div>
              )}
            </section>
          </div>

          {/* ── Right panel — PDF Preview ── */}
          <div className="w-[420px] flex-shrink-0 bg-slate-50 border-l border-slate-200 p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs uppercase text-slate-400 tracking-wide">Invoice Preview</span>
              <span className="text-xs text-slate-300">Updates as you type</span>
            </div>
            <PDFPreview
              student={selectedStudent}
              lineItems={lineItems}
              issueDate={issueDate}
              dueDate={dueDate}
              discountEnabled={discountEnabled}
              enrolmentFee={enrolmentFee}
              paymentPlan={splitEnabled}
              planSplit={planSplit}
              customSplit={customSplit}
              totals={totals}
              bankInfo={bankInfo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
