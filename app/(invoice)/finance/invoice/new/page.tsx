'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Search, Plus, X, Send, Save,
  Building2, AlertCircle, CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { students, staffMembers, invoices, type Student } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { usePermission } from '@/lib/use-permission';
import { useJourney, BILAL_STUDENT_ID, enrolmentRateFor } from '@/lib/journey-store';
import { RecordPaymentDialog } from '@/components/journey/record-payment-dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  subject: string;
  yearGroup: string;
  sessions: number;
  rate: number;
  validTill: string;
}

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
  Y7: 168, Y8: 168, Y9: 168,
  Y10: 189, Y11: 189, Y12: 189, Y13: 189,
};

const BANK_ROUTING: Record<string, BankInfo> = {
  Primary: { name: 'ADCB KBW', account: '10464418124001', iban: 'AE230030010464418124001' },
  'Lower Secondary': { name: 'ADCB KBW', account: '10464418920002', iban: 'AE920030010464418920002' },
  Senior: { name: 'ADCB KBW', account: '10464418920001', iban: 'AE220030010464418920001' },
};

const DEFAULT_BANK = BANK_ROUTING['Senior'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const numFmt = new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtAED = (n: number) => `AED ${numFmt.format(n)}`;
const todayStr = () => new Date().toISOString().split('T')[0];

function nextInvoiceNumber(): string {
  const nums = invoices.map((inv) => parseInt(inv.id.replace(/\D/g, ''), 10)).filter(Boolean);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1001;
  return `INV-${next}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function fmtDate(s: string): string {
  if (!s) return '';
  const p = s.split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function getRate(subject: string, yearGroup: string): number {
  if (subject === 'CAT4') return 200;
  return CATALOGUE_RATES[yearGroup] ?? 0;
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

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
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow',
          checked ? 'translate-x-4' : 'translate-x-1',
        )}
      />
    </button>
  );
}

// ─── PDF Preview ──────────────────────────────────────────────────────────────

function PDFPreview({
  invoiceNo,
  status,
  student,
  lineItems,
  issueDate,
  dueDate,
  discountEnabled,
  discountType,
  enrolmentFee,
  paymentPlan,
  planSplit,
  customSplit,
  totals,
  bankInfo,
  notes,
  paymentTerms,
}: {
  invoiceNo: string;
  status: 'Draft' | 'Issued';
  student: Student | null;
  lineItems: LineItem[];
  issueDate: string;
  dueDate: string;
  discountEnabled: boolean;
  discountType: '%' | 'AED';
  enrolmentFee: boolean;
  paymentPlan: boolean;
  planSplit: '2' | '3' | 'custom';
  customSplit: [number, number, number];
  totals: Totals;
  bankInfo: BankInfo | null;
  notes: string;
  paymentTerms: string;
}) {
  const resolvedBank = bankInfo ?? DEFAULT_BANK;

  const instalments = useMemo(() => {
    if (!paymentPlan || totals.totalDue < 4000) return [];
    if (planSplit === '2') return [
      { label: 'Instalment 1', pct: 60, due: dueDate },
      { label: 'Instalment 2', pct: 40, due: addDays(dueDate, 30) },
    ];
    if (planSplit === '3') return [
      { label: 'Instalment 1', pct: 50, due: dueDate },
      { label: 'Instalment 2', pct: 25, due: addDays(dueDate, 30) },
      { label: 'Instalment 3', pct: 25, due: addDays(dueDate, 60) },
    ];
    return customSplit.map((pct, i) => ({
      label: `Instalment ${i + 1}`,
      pct,
      due: i === 0 ? dueDate : addDays(dueDate, i * 30),
    }));
  }, [paymentPlan, planSplit, customSplit, dueDate, totals.totalDue]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-slate-200">

      {/* Header */}
      <div className="bg-[#1E3A8A] p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-bold text-base text-[#1E3A8A] flex-shrink-0">
              IMI
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Improve ME Institute</p>
              <p className="text-white/60 text-xs mt-0.5">Gold &amp; Diamond Park, Dubai</p>
              <p className="text-white/50 text-xs">TRN: 100123456700003</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-white font-bold text-xl tracking-wide whitespace-nowrap">TAX INVOICE</p>
            <p className="text-white/80 text-sm font-medium mt-1">{invoiceNo}</p>
            <p className="text-white/55 text-xs mt-2">Issue: {fmtDate(issueDate)}</p>
            <p className="text-white/55 text-xs">Due: {fmtDate(dueDate)}</p>
            <div className="mt-2">
              <span className={cn(
                'inline-block text-[10px] font-bold uppercase tracking-widest border rounded px-2 py-0.5',
                status === 'Issued'
                  ? 'bg-blue-500/30 text-blue-200 border-blue-400/40'
                  : 'bg-slate-600/40 text-white/80 border-white/20',
              )}>
                {status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Meta band */}
      <div className="grid grid-cols-2 border-b border-slate-200">
        <div className="p-4 border-r border-slate-200">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">BILL TO</p>
          <p className="font-semibold text-slate-900 text-sm">{student?.guardian ?? '—'}</p>
          {student && (
            <>
              <p className="text-xs text-slate-600 mt-0.5">{student.name}</p>
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full">{student.yearGroup}</span>
                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded-full">{student.department}</span>
              </div>
            </>
          )}
          <p className="text-[10px] text-slate-400 mt-2">{paymentTerms}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">PAYMENT REF</p>
          <p className="font-mono font-semibold text-slate-900 text-sm tracking-wide">{invoiceNo}</p>
          <div className="mt-2 space-y-1">
            <div>
              <span className="text-[10px] text-slate-400">Bank </span>
              <span className="text-xs font-medium text-slate-600">{resolvedBank.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">IBAN </span>
              <span className="text-[10px] font-mono text-slate-500">{resolvedBank.iban}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line items header */}
      <div className="grid grid-cols-12 px-5 py-2 bg-[#1E3A8A] text-white text-[10px] uppercase tracking-widest font-semibold">
        <div className="col-span-5">Subject</div>
        <div className="col-span-2 text-center">Sessions</div>
        <div className="col-span-2 text-center">Rate</div>
        <div className="col-span-3 text-right">Amount</div>
      </div>

      {lineItems.length === 0 && (
        <div className="py-8 text-center text-slate-300 text-xs italic">
          Add subjects using the form on the left
        </div>
      )}
      {lineItems.map((item, i) => (
        <div
          key={item.id}
          className={cn('grid grid-cols-12 px-5 py-3 border-b border-slate-100 text-xs', i % 2 !== 0 && 'bg-slate-50/60')}
        >
          <div className="col-span-5">
            {item.subject ? (
              <p className="font-medium text-slate-900 text-xs">{item.subject}</p>
            ) : (
              <p className="text-xs text-slate-300">—</p>
            )}
            {item.subject && item.yearGroup && (
              <div className="text-[10px] text-slate-400 mt-0.5">
                {item.yearGroup}
              </div>
            )}
          </div>
          <div className="col-span-2 text-center text-slate-600">{item.sessions}</div>
          <div className="col-span-2 text-center text-slate-600">AED {item.rate.toLocaleString('en-AE')}</div>
          <div className="col-span-3 text-right font-semibold text-slate-900">{fmtAED(item.sessions * item.rate)}</div>
        </div>
      ))}
      {enrolmentFee && (
        <div className="grid grid-cols-12 px-5 py-2.5 bg-amber-50/60 border-b border-slate-100 text-[11px] italic text-slate-500">
          <div className="col-span-5">Enrolment fee</div>
          <div className="col-span-2 text-center">—</div>
          <div className="col-span-2 text-center">—</div>
          <div className="col-span-3 text-right font-medium text-slate-700 not-italic">AED 300.00</div>
        </div>
      )}

      {/* Totals + notes */}
      <div className="grid grid-cols-2 border-t-2 border-slate-200">
        <div className="p-4 border-r border-slate-200">
          {notes && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">NOTES</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{notes}</p>
            </div>
          )}
          {paymentPlan && totals.totalDue >= 4000 && instalments.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">PAYMENT SCHEDULE</p>
              {instalments.map((inst) => (
                <div key={inst.label} className="flex justify-between text-[11px] py-1 border-b border-slate-100">
                  <span className="text-slate-600">{inst.label}</span>
                  <span className="text-slate-400">{fmtDate(inst.due)}</span>
                  <span className="font-medium text-slate-800">{fmtAED((totals.totalDue * inst.pct) / 100)}</span>
                </div>
              ))}
            </div>
          )}
          {!notes && !(paymentPlan && totals.totalDue >= 4000) && <span className="text-slate-300 text-xs italic">—</span>}
        </div>
        <div className="p-4">
          <div className="flex justify-between text-xs py-1">
            <span className="text-slate-600">Subtotal</span>
            <span className="text-slate-800">{fmtAED(totals.subtotal)}</span>
          </div>
          {discountEnabled && totals.discountValue > 0 && (
            <div className="flex justify-between text-xs py-1 text-amber-600">
              <span>Discount ({discountType})</span>
              <span>− {fmtAED(totals.discountValue)}</span>
            </div>
          )}
          <div className="border-t border-slate-200 my-1.5" />
          <div className="flex justify-between text-xs py-1">
            <span className="text-slate-600">Total excl. VAT</span>
            <span className="text-slate-800">{fmtAED(totals.totalExclVAT)}</span>
          </div>
          <div className="flex justify-between text-xs py-1">
            <span className="text-slate-600">VAT (5%)</span>
            <span className="text-slate-800">{fmtAED(totals.vat)}</span>
          </div>
          <div className="border-t-2 border-slate-800 my-2" />
          <div className="flex justify-between">
            <span className="text-xs font-bold text-slate-900">TOTAL DUE</span>
            <span className="text-xs font-bold text-[#1E3A8A]">{fmtAED(totals.totalDue)}</span>
          </div>
        </div>
      </div>

      {/* Bank details */}
      <div className="bg-slate-50 border-t border-slate-200 p-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">TRANSFER PAYMENT TO</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {(
            [
              ['Bank', resolvedBank.name],
              ['Account', resolvedBank.account],
              ['IBAN', resolvedBank.iban],
              ['Swift', 'ADCBAEAA060'],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] text-slate-400">{label}</p>
              <p className="text-[11px] font-medium text-slate-700 font-mono">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#1E3A8A] px-6 py-3 grid grid-cols-2 items-center">
        <div className="text-white/60 text-[10px] leading-relaxed">
          <p>Improve ME Institute LLC · Gold &amp; Diamond Park · Dubai, UAE</p>
          <p>info@improveme.ae · TRN: 100123456700003</p>
        </div>
        <div className="text-white/80 text-[11px] text-right font-medium">
          <p>Thank you for choosing</p>
          <p>Improve ME Institute</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewInvoicePage() {
  const router = useRouter();
  const { can } = usePermission();
  const today = todayStr();
  const invoiceNo = useMemo(() => nextInvoiceNumber(), []);
  const [status, setStatus] = useState<'Draft' | 'Issued'>('Draft');
  const journey = useJourney();
  const [isJourneyInvoice, setIsJourneyInvoice] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(addDays(today, 7));
  const [invoicedBy, setInvoicedBy] = useState('Jason Daswani');

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<'%' | 'AED'>('%');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [enrolmentFee, setEnrolmentFee] = useState(true);
  const [paymentPlan, setPaymentPlan] = useState(false);
  const [planSplit, setPlanSplit] = useState<'2' | '3' | 'custom'>('2');
  const [customSplit, setCustomSplit] = useState<[number, number, number]>([50, 25, 25]);

  const [notes, setNotes] = useState('');

  const paymentTerms = 'Net 7';

  useEffect(() => {
    const sidebar = document.querySelector('aside')
    const topbar = document.querySelector('header')
    if (sidebar) (sidebar as HTMLElement).style.display = 'none'
    if (topbar) (topbar as HTMLElement).style.display = 'none'
    return () => {
      if (sidebar) (sidebar as HTMLElement).style.display = ''
      if (topbar) (topbar as HTMLElement).style.display = ''
    }
  }, [])

  // Journey pre-fill: if routed here from the Bilal flow, pre-populate student + line items
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const studentParam = params.get('student');
    const isJourney = params.get('source') === 'journey' && studentParam === BILAL_STUDENT_ID;
    if (!isJourney || !journey.student || !journey.enrolment) return;

    setIsJourneyInvoice(true);
    const virtual: Student = {
      id: journey.student.id,
      name: journey.student.name,
      yearGroup: journey.student.yearGroup,
      department: journey.student.department,
      school: journey.student.school || '—',
      guardian: journey.student.guardianName,
      guardianPhone: journey.student.guardianPhone,
      enrolments: 0,
      churnScore: null,
      status: 'Active',
      lastContact: 'Today',
      createdOn: journey.student.createdOn,
    } as Student;
    setSelectedStudent(virtual);

    const subjectOnly = journey.enrolment.subject.replace(/^Y\d+\s+/, '');
    setLineItems([
      {
        id: crypto.randomUUID(),
        subject: subjectOnly,
        yearGroup: journey.student.yearGroup,
        sessions: journey.enrolment.sessionsThisTerm,
        rate: journey.enrolment.ratePerSession || enrolmentRateFor(journey.student.yearGroup),
        validTill: addDays(today, 90),
      },
    ]);
    setEnrolmentFee(journey.enrolment.enrolmentFee > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredStudents = useMemo<Student[]>(() => {
    if (!searchQuery || selectedStudent) return [];
    return students.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8);
  }, [searchQuery, selectedStudent]);

  function handleStudentSelect(s: Student) {
    setSelectedStudent(s);
    setSearchQuery('');
    setLineItems((prev) =>
      prev.map((item) => ({ ...item, yearGroup: s.yearGroup, rate: getRate(item.subject, s.yearGroup) })),
    );
  }

  function addLineItem() {
    const yg = selectedStudent?.yearGroup ?? 'Y1';
    setLineItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        subject: '',
        yearGroup: yg,
        sessions: 10,
        rate: CATALOGUE_RATES[yg] ?? 0,
        validTill: addDays(today, 90),
      },
    ]);
  }

  function updateLineItem(id: string, patch: Partial<LineItem>) {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        if ('subject' in patch || 'yearGroup' in patch) {
          next.rate = getRate(next.subject, next.yearGroup);
        }
        return next;
      }),
    );
  }

  function removeLineItem(id: string) {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
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
      discountValue = discountType === '%' ? subtotal * (discountAmount / 100) : discountAmount;
      discountValue = Math.min(discountValue, subtotal);
    }
    const totalExclVAT = subtotal - discountValue;
    const vat = totalExclVAT * 0.05;
    const totalDue = Math.round((totalExclVAT + vat) / 0.05) * 0.05;
    return { subtotal, discountValue, totalExclVAT, vat, totalDue };
  }, [lineItems, discountEnabled, discountType, discountAmount, enrolmentFee]);

  const planRows = useMemo(() => {
    if (planSplit === '2') return [{ pct: 60, due: dueDate }, { pct: 40, due: addDays(dueDate, 30) }];
    if (planSplit === '3') return [
      { pct: 50, due: dueDate },
      { pct: 25, due: addDays(dueDate, 30) },
      { pct: 25, due: addDays(dueDate, 60) },
    ];
    return customSplit.map((pct, i) => ({ pct, due: i === 0 ? dueDate : addDays(dueDate, i * 30) }));
  }, [planSplit, customSplit, dueDate]);

  const instalmentCount = planSplit === 'custom' ? 3 : parseInt(planSplit, 10);
  const displayBank = bankInfo ?? DEFAULT_BANK;

  const labelCls = 'text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5';
  const inputCls = 'w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100';

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ── Topbar ── */}
      <div className="h-14 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => router.push('/finance')}
            className="flex items-center gap-1 cursor-pointer group"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400 group-hover:text-slate-600 transition-colors">Finance</span>
          </button>
          <span className="text-slate-200 mx-2">/</span>
          <span className="text-sm font-semibold text-slate-900">New Invoice</span>
          <span className="text-slate-300 mx-2">·</span>
          <span className="text-sm text-slate-400 font-mono">{invoiceNo}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            'text-xs rounded-full px-3 py-1 border font-medium',
            status === 'Issued'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-100 text-slate-500 border-slate-200',
          )}>
            {status}
          </span>
          {status === 'Draft' && (
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </button>
          )}
          <button
            type="button"
            disabled={status === 'Issued'}
            onClick={() => {
              setStatus('Issued');
              if (isJourneyInvoice) {
                journey.setInvoiceIssued(invoiceNo, totals.totalDue);
                toast.success(`Invoice ${invoiceNo} issued — AED ${totals.totalDue.toFixed(0)}`);
              }
            }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer',
              status === 'Issued'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-600 text-white',
            )}
          >
            <Send className="w-3.5 h-3.5" />
            {status === 'Issued' ? 'Issued' : 'Issue Invoice'}
          </button>
          {isJourneyInvoice && status === 'Issued' && journey.invoice?.status !== 'Paid' && (
            <button
              type="button"
              onClick={() => setPaymentOpen(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Record Payment
            </button>
          )}
          {isJourneyInvoice && journey.invoice?.status === 'Paid' && (
            <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CreditCard className="w-3.5 h-3.5" />
              Paid
            </span>
          )}
        </div>
      </div>

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        defaultAmount={journey.invoice?.amount ?? totals.totalDue}
      />

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-8 pb-32">

              {/* BLOCK 1 — STUDENT */}
              <div className="mb-8">
                <p className={labelCls}>Student</p>
                {selectedStudent ? (
                  <div className="rounded-xl border border-slate-200 p-4 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {getInitials(selectedStudent.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{selectedStudent.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selectedStudent.yearGroup} · {selectedStudent.department} · Billed to: {selectedStudent.guardian}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="text-xs text-amber-500 hover:text-amber-600 font-medium cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div ref={searchRef} className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search student by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                    {searchQuery.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-56 overflow-y-auto">
                        {filteredStudents.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-4">No students found</p>
                        ) : (
                          filteredStudents.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleStudentSelect(s)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 cursor-pointer border-b border-slate-50 last:border-0 text-left transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {getInitials(s.name)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{s.name}</p>
                                <p className="text-xs text-slate-400">{s.yearGroup} · {s.department}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BLOCK 2 — INVOICE DETAILS */}
              <div className="mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Invoice no.</label>
                    <div className="h-11 bg-slate-50 rounded-xl border border-slate-200 px-3 text-sm text-slate-500 font-mono flex items-center">
                      IMI-0142
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="invoiced-by">Invoiced by</label>
                    <select
                      id="invoiced-by"
                      value={invoicedBy}
                      onChange={(e) => setInvoicedBy(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 cursor-pointer"
                    >
                      {staffMembers.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="issue-date">Issue date</label>
                    <input
                      id="issue-date"
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="due-date">Due date</label>
                    <input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>
              </div>

              {/* BLOCK 3 — LINE ITEMS */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className={cn(labelCls, 'mb-0')}>Items</p>
                  {lineItems.length > 0 && (
                    <span className="text-xs text-slate-400">
                      {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Table header */}
                <div
                  className="grid gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-200"
                  style={{ gridTemplateColumns: '1fr 60px 70px 90px 110px 90px 32px' }}
                >
                  <div>Subject</div>
                  <div>Year</div>
                  <div className="text-center">Sessions</div>
                  <div className="text-center">Rate/session</div>
                  <div className="text-center">Valid till</div>
                  <div className="text-right">Amount</div>
                  <div />
                </div>

                {/* Item rows */}
                {lineItems.map((item) => {
                  const amount = item.sessions * item.rate;
                  return (
                    <div
                      key={item.id}
                      className="grid gap-2 px-3 py-2.5 items-center border-b border-slate-100 hover:bg-slate-50/60 group"
                      style={{ gridTemplateColumns: '1fr 60px 70px 90px 110px 90px 32px' }}
                    >
                      <div>
                        <select
                          value={item.subject}
                          onChange={(e) => updateLineItem(item.id, { subject: e.target.value })}
                          className="w-full h-9 rounded-lg border border-slate-200 text-sm px-2 bg-white focus:outline-none focus:border-amber-400 cursor-pointer"
                        >
                          <option value="">Select subject...</option>
                          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <select
                          value={item.yearGroup}
                          onChange={(e) => updateLineItem(item.id, { yearGroup: e.target.value })}
                          className="w-full h-9 rounded-lg border border-slate-200 text-sm px-2 bg-white focus:outline-none focus:border-amber-400 cursor-pointer"
                        >
                          {YEAR_GROUPS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          min={1}
                          value={item.sessions}
                          onChange={(e) =>
                            updateLineItem(item.id, { sessions: Math.max(1, parseInt(e.target.value) || 1) })
                          }
                          className="w-full h-9 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          value={item.rate}
                          onChange={(e) =>
                            updateLineItem(item.id, { rate: Math.max(0, parseFloat(e.target.value) || 0) })
                          }
                          className="w-full h-9 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          value={item.validTill}
                          onChange={(e) => updateLineItem(item.id, { validTill: e.target.value })}
                          className="w-full h-9 rounded-lg border border-slate-200 text-sm px-2 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-900">{numFmt.format(amount)}</span>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          aria-label="Remove item"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Enrolment fee row */}
                {enrolmentFee && (
                  <div
                    className="grid gap-2 px-3 py-2.5 bg-amber-50/40 border-b border-amber-100/60 items-center"
                    style={{ gridTemplateColumns: '1fr 60px 70px 90px 110px 90px 32px' }}
                  >
                    <div className="text-slate-500 italic text-xs">Enrolment fee</div>
                    <div className="text-slate-300 text-center text-xs">—</div>
                    <div className="text-slate-300 text-center text-xs">—</div>
                    <div className="text-slate-300 text-center text-xs">—</div>
                    <div className="text-slate-300 text-center text-xs">—</div>
                    <div className="text-right font-semibold text-slate-700 text-sm">300</div>
                    <div />
                  </div>
                )}

                {/* Add item */}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-600 font-medium py-2 px-3 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add item
                  </button>
                </div>
              </div>

              {/* BLOCK 4 — ADJUSTMENTS */}
              <div className="mb-8">

                {/* Discount */}
                {can('approve.discount') && (
                <div className="rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-slate-700">Discount</span>
                      {discountEnabled && totals.discountValue > 0 && (
                        <span className="ml-2 bg-amber-100 text-amber-700 text-xs rounded px-2 py-0.5 font-medium">
                          − {fmtAED(totals.discountValue)}
                        </span>
                      )}
                    </div>
                    <Toggle checked={discountEnabled} onChange={() => setDiscountEnabled((v) => !v)} />
                  </div>
                  {discountEnabled && (
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex gap-2">
                          {(['%', 'AED'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setDiscountType(type)}
                              className={cn(
                                'flex-1 rounded-lg px-4 py-2 text-sm cursor-pointer transition-colors',
                                discountType === type
                                  ? 'bg-amber-500 text-white font-medium'
                                  : 'bg-slate-100 text-slate-500',
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
                          onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="h-10 rounded-xl border border-slate-200 text-sm text-center focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        />
                        <div className="flex items-center">
                          {discountAmount > 0 && (
                            <span className="text-sm font-semibold text-amber-600">
                              = {fmtAED(totals.discountValue)}
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Discount reason — required"
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        className="mt-3 w-full h-10 rounded-xl border border-slate-200 text-sm px-3 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                      <div className="mt-2 flex items-center gap-1 text-xs text-amber-500">
                        <AlertCircle className="w-3 h-3" />
                        Admin Head will be notified
                      </div>
                    </div>
                  )}
                </div>
                )}

                {/* Enrolment fee */}
                <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-slate-700">Enrolment fee</span>
                    <span className="text-xs text-slate-400 ml-2">AED 300 · one-time</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">AED 300.00</span>
                    <Toggle checked={enrolmentFee} onChange={() => setEnrolmentFee((v) => !v)} />
                  </div>
                </div>

                {/* Payment plan */}
                <div className="rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-slate-700">Split into instalments</span>
                      {paymentPlan && totals.totalDue >= 4000 && (
                        <span className="text-xs text-amber-600 ml-2">
                          {instalmentCount} × {fmtAED(totals.totalDue / instalmentCount)}
                        </span>
                      )}
                    </div>
                    <Toggle checked={paymentPlan} onChange={() => setPaymentPlan((v) => !v)} />
                  </div>
                  {paymentPlan && (
                    <div className="px-4 pb-4">
                      {totals.totalDue < 4000 ? (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          Minimum AED 4,000 required for payment plans
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            {(
                              [
                                { key: '2', label: '2 instalments', sub: '60% / 40%' },
                                { key: '3', label: '3 instalments', sub: '50% / 25% / 25%' },
                                { key: 'custom', label: 'Custom split', sub: 'Set your own' },
                              ] as const
                            ).map((opt) => (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => setPlanSplit(opt.key)}
                                className={cn(
                                  'rounded-xl border-2 p-3 cursor-pointer text-center transition-all',
                                  planSplit === opt.key
                                    ? 'border-amber-400 bg-amber-50'
                                    : 'border-slate-200 bg-white',
                                )}
                              >
                                <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{opt.sub}</p>
                              </button>
                            ))}
                          </div>

                          {planSplit === 'custom' && (
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              {([0, 1, 2] as Array<0 | 1 | 2>).map((i) => (
                                <div key={i}>
                                  <label className={labelCls}>Instalment {i + 1} (%)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={customSplit[i]}
                                    onChange={(e) => {
                                      const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                      setCustomSplit((prev) => {
                                        const n = [...prev] as [number, number, number];
                                        n[i] = v;
                                        return n;
                                      });
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="rounded-xl border border-slate-200 overflow-hidden">
                            {planRows.map((row, i) => (
                              <div
                                key={i}
                                className="flex justify-between items-center px-4 py-3 border-b border-slate-100 last:border-0 text-sm"
                              >
                                <span className="font-medium text-slate-700">Instalment {i + 1}</span>
                                <input
                                  type="date"
                                  defaultValue={row.due}
                                  className="w-32 h-8 rounded-lg border border-slate-200 text-xs px-2 focus:outline-none focus:ring-1 focus:ring-amber-400"
                                />
                                <span className="font-semibold text-slate-900">
                                  {fmtAED((totals.totalDue * row.pct) / 100)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCK 5 — NOTE / MEMO */}
              <div className="mb-8">
                <label className={labelCls} htmlFor="invoice-notes">Note / memo</label>
                <textarea
                  id="invoice-notes"
                  rows={3}
                  placeholder="Add a note — displayed on the invoice"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
                <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Auto-routing payment to:</p>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      {displayBank.name} · {displayBank.account}
                    </p>
                    <p className="text-xs text-slate-300 italic mt-0.5">(Based on student year group)</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Sticky bottom bar */}
          <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 px-10 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-8 text-sm">
              <span className="text-slate-500">
                Subtotal: <span className="font-medium">{fmtAED(totals.subtotal)}</span>
              </span>
              {discountEnabled && totals.discountValue > 0 && (
                <span className="text-amber-600">Discount: − {fmtAED(totals.discountValue)}</span>
              )}
              <span className="text-slate-400">VAT (5%): {fmtAED(totals.vat)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-slate-500 mr-3">Total due</span>
              <span className="text-xl font-bold text-[#1E3A8A]">{fmtAED(totals.totalDue)}</span>
            </div>
          </div>
        </div>

        {/* Right panel — PDF preview */}
        <div className="w-[560px] flex-shrink-0 bg-slate-100 border-l border-slate-200 overflow-y-auto p-8">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Invoice preview</span>
            <span className="text-xs text-slate-300">Updates as you type</span>
          </div>
          <PDFPreview
            invoiceNo={invoiceNo}
            status={status}
            student={selectedStudent}
            lineItems={lineItems}
            issueDate={issueDate}
            dueDate={dueDate}
            discountEnabled={discountEnabled}
            discountType={discountType}
            enrolmentFee={enrolmentFee}
            paymentPlan={paymentPlan}
            planSplit={planSplit}
            customSplit={customSplit}
            totals={totals}
            bankInfo={bankInfo}
            notes={notes}
            paymentTerms={paymentTerms}
          />
        </div>
      </div>
    </div>
  );
}
