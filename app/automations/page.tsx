'use client';

import { Suspense, useState, useRef, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus, Search, Eye, Pencil, Copy, Lock, Zap, Send,
  MessageSquare, Megaphone, Activity, Trash2, ChevronDown,
  RefreshCw, Calendar, Clock, AlertTriangle, ClipboardList,
  MousePointer, Repeat, CheckSquare, UserPlus, AlertCircle,
  FileText, ChevronRight, Clipboard, Paperclip,
  X, Check, CheckCircle2, XCircle, Hash, ArrowLeft, ArrowRight,
  Info, Smile, AtSign, Link2, Image as ImageIcon, GraduationCap,
  UserCircle2, Receipt, AlertOctagon, ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermission } from '@/lib/use-permission';
import { AccessDenied } from '@/components/ui/access-denied';
import {
  automationTemplates,
  automationRules,
  dispatchQueueItems,
  marketingMoments,
  marketingCampaigns,
  executionLogs,
  segments,
  type AutomationTemplate,
  type AutomationRule,
  type AutomationTemplateType,
  type AutomationTemplateOwner,
  type AutomationRuleTrigger,
  type AutomationRuleStatus,
  type DispatchQueueItem,
  type MarketingMoment,
  type MarketingCampaign,
  type ExecutionLog,
} from '@/lib/mock-data';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { SortableHeader, useSortState } from '@/components/ui/sortable-header';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['Templates', 'Rules', 'Trigger Library', 'Dispatch Queue', 'Internal Messages', 'Marketing', 'Execution Log'] as const;
type Tab = typeof TABS[number];

const MERGE_FIELDS = ['[child_name]', '[parent_name]', '[subject]', '[session_date]', '[session_time]', '[teacher_name]', '[amount]', '[due_date]', '[tenant_name]'];

const TRIGGER_TYPES: { key: AutomationRuleTrigger; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'Status Change',   label: 'Status Change',        icon: RefreshCw       },
  { key: 'Time-based',      label: 'Time-based Absolute',  icon: Calendar        },
  { key: 'Time-based',      label: 'Time-based Relative',  icon: Clock           },
  { key: 'Threshold',       label: 'Threshold Breach',     icon: AlertTriangle   },
  { key: 'Form Submission', label: 'Form Submission',      icon: ClipboardList   },
  { key: 'Manual',          label: 'Manual',               icon: MousePointer    },
  { key: 'Manual',          label: 'Recurring Schedule',   icon: Repeat          },
];

// ─── Badge helpers ────────────────────────────────────────────────────────────

function typeBadge(type: AutomationTemplateType) {
  const map: Record<AutomationTemplateType, string> = {
    Message:      'bg-blue-100 text-blue-700',
    Email:        'bg-indigo-100 text-indigo-700',
    Task:         'bg-amber-100 text-amber-700',
    Announcement: 'bg-green-100 text-green-700',
  };
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', map[type])}>{type}</span>;
}

function templateStatusBadge(status: AutomationTemplate['status']) {
  const map = {
    Active:   'bg-green-100 text-green-700',
    Draft:    'bg-amber-100 text-amber-700',
    Archived: 'bg-slate-100 text-slate-600',
  };
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', map[status])}>{status}</span>;
}

function triggerBadge(type: AutomationRuleTrigger) {
  const map: Record<AutomationRuleTrigger, string> = {
    'Status Change':   'bg-blue-100 text-blue-700',
    'Time-based':      'bg-purple-100 text-purple-700',
    'Threshold':       'bg-red-100 text-red-700',
    'Form Submission': 'bg-green-100 text-green-700',
    'Manual':          'bg-slate-100 text-slate-600',
  };
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap', map[type])}>{type}</span>;
}

function ruleStatusBadge(status: AutomationRuleStatus) {
  const map: Record<AutomationRuleStatus, string> = {
    Enabled:  'bg-green-100 text-green-700',
    Disabled: 'bg-slate-100 text-slate-600',
    Locked:   'bg-amber-100 text-amber-700',
  };
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', map[status])}>{status}</span>;
}

// ─── Render body with merge field highlights ──────────────────────────────────

function BodyWithFields({ body }: { body: string }) {
  const parts = body.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\[.*\]$/.test(part)
          ? <span key={i} className="bg-amber-100 text-amber-700 rounded px-1 text-sm">{part}</span>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

// ─── Simple native select ─────────────────────────────────────────────────────

function FilterSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg pl-3 pr-8 py-1.5 cursor-pointer hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ enabled, onChange, disabled }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(!enabled)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300',
        enabled ? 'bg-green-500' : 'bg-slate-200',
        disabled && 'opacity-40 cursor-not-allowed',
        !disabled && 'cursor-pointer'
      )}
    >
      <span className={cn(
        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
        enabled ? 'translate-x-4.5' : 'translate-x-0.5'
      )} />
    </button>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string | number; color: 'green' | 'blue' | 'amber' | 'slate' }) {
  const textMap = { green: 'text-green-600', blue: 'text-blue-600', amber: 'text-amber-600', slate: 'text-slate-600' };
  const bgMap   = { green: 'bg-green-50',    blue: 'bg-blue-50',    amber: 'bg-amber-50',    slate: 'bg-slate-100'  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col gap-1">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={cn('text-2xl font-bold', textMap[color])}>
        <span className={cn('inline-block px-2 py-0.5 rounded-lg text-2xl font-bold', bgMap[color], textMap[color])}>{value}</span>
      </p>
    </div>
  );
}

// ─── Trigger Library Tab ──────────────────────────────────────────────────────

const TRIGGER_CATEGORIES: { label: string; module: string; triggers: string[] }[] = [
  { label: 'LEAD MANAGEMENT', module: 'M02', triggers: ['lead_created','lead_status_changed','lead_assigned','lead_inactive_14_days','lead_converted','lead_lost','lead_duplicate_detected'] },
  { label: 'ENROLMENT & LIFECYCLE', module: 'M03', triggers: ['enrolment_confirmed','trial_booked','trial_completed','withdrawal_initiated','withdrawal_confirmed','student_paused','student_reactivated','year_group_progressed'] },
  { label: 'ATTENDANCE', module: 'M05', triggers: ['session_marked_absent','session_marked_no_show','attendance_not_marked_48h','makeup_booked','makeup_no_show','absence_allowance_exceeded'] },
  { label: 'FINANCE', module: 'M08', triggers: ['invoice_created','invoice_overdue','payment_received','payment_partial','credit_issued','refund_approved','bad_debt_marked'] },
  { label: 'CONCERNS & COMPLAINTS', module: 'M07', triggers: ['concern_raised_l1','concern_escalated_l2','concern_escalated_l3','concern_resolved','complaint_ticket_logged','complaint_resolved','recurring_complaint_trigger'] },
  { label: 'SCHEDULING & TIMETABLE', module: 'M04', triggers: ['session_created','session_cancelled','session_rescheduled','room_conflict_detected','teacher_unavailable'] },
  { label: 'STAFF & HR', module: 'M09', triggers: ['staff_onboarded','staff_role_changed','access_revoked','cpd_logged','cpd_target_50_reached','cpd_target_100_reached','performance_review_due','offboarding_initiated'] },
  { label: 'CHURN & RETENTION', module: 'M07', triggers: ['churn_score_high','churn_score_critical','retention_score_low','student_inactive_app_14d','nps_detractor_response'] },
  { label: 'FEEDBACK & QUALITY', module: 'M07', triggers: ['feedback_approved','feedback_overdue','survey_response_received','low_satisfaction_alert','google_review_prompted'] },
  { label: 'TASKS & ADMIN', module: 'M11', triggers: ['task_created','task_overdue','task_completed','recurring_task_generated'] },
  { label: 'PLATFORM & ONBOARDING', module: 'M01', triggers: ['tenant_onboarded','tenant_go_live','dpa_signed','platform_incident_declared'] },
  { label: 'PROGRESS & ACADEMIC', module: 'M07', triggers: ['progress_report_generated','progress_report_approved','academic_alert_triggered','predicted_grade_changed','assignment_published','assignment_overdue'] },
  { label: 'EVENTS & INVENTORY', module: 'M12', triggers: ['inventory_reorder_breach','auto_deduct_failed','inventory_item_out_of_stock'] },
];

const TRIGGER_TYPE_MAP: Record<string, AutomationRuleTrigger> = {
  lead_created: 'Status Change', lead_status_changed: 'Status Change', lead_assigned: 'Status Change',
  lead_inactive_14_days: 'Time-based', lead_converted: 'Status Change', lead_lost: 'Status Change',
  lead_duplicate_detected: 'Threshold', enrolment_confirmed: 'Status Change', trial_booked: 'Status Change',
  trial_completed: 'Status Change', withdrawal_initiated: 'Status Change', withdrawal_confirmed: 'Status Change',
  student_paused: 'Status Change', student_reactivated: 'Status Change', year_group_progressed: 'Status Change',
  session_marked_absent: 'Status Change', session_marked_no_show: 'Status Change',
  attendance_not_marked_48h: 'Time-based', makeup_booked: 'Status Change', makeup_no_show: 'Status Change',
  absence_allowance_exceeded: 'Threshold', invoice_created: 'Status Change', invoice_overdue: 'Time-based',
  payment_received: 'Status Change', payment_partial: 'Status Change', credit_issued: 'Manual',
  refund_approved: 'Manual', bad_debt_marked: 'Manual', concern_raised_l1: 'Status Change',
  concern_escalated_l2: 'Status Change', concern_escalated_l3: 'Status Change', concern_resolved: 'Status Change',
  complaint_ticket_logged: 'Status Change', complaint_resolved: 'Status Change',
  recurring_complaint_trigger: 'Threshold', session_created: 'Status Change', session_cancelled: 'Status Change',
  session_rescheduled: 'Status Change', room_conflict_detected: 'Threshold', teacher_unavailable: 'Status Change',
  staff_onboarded: 'Status Change', staff_role_changed: 'Status Change', access_revoked: 'Manual',
  cpd_logged: 'Status Change', cpd_target_50_reached: 'Threshold', cpd_target_100_reached: 'Threshold',
  performance_review_due: 'Time-based', offboarding_initiated: 'Status Change', churn_score_high: 'Threshold',
  churn_score_critical: 'Threshold', retention_score_low: 'Threshold', student_inactive_app_14d: 'Time-based',
  nps_detractor_response: 'Form Submission', feedback_approved: 'Status Change', feedback_overdue: 'Time-based',
  survey_response_received: 'Form Submission', low_satisfaction_alert: 'Threshold',
  google_review_prompted: 'Manual', task_created: 'Status Change', task_overdue: 'Time-based',
  task_completed: 'Status Change', recurring_task_generated: 'Manual', tenant_onboarded: 'Status Change',
  tenant_go_live: 'Status Change', dpa_signed: 'Form Submission', platform_incident_declared: 'Manual',
  progress_report_generated: 'Manual', progress_report_approved: 'Status Change',
  academic_alert_triggered: 'Threshold', predicted_grade_changed: 'Status Change',
  assignment_published: 'Status Change', assignment_overdue: 'Time-based',
  inventory_reorder_breach: 'Threshold', auto_deduct_failed: 'Threshold',
  inventory_item_out_of_stock: 'Threshold',
};

function TriggerLibraryTab() {
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(TRIGGER_CATEGORIES.map(c => [c.label, true]))
  );
  const [toast, setToast] = useState('');

  function toggleSection(label: string) {
    setOpenSections(s => ({ ...s, [label]: !s[label] }));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return TRIGGER_CATEGORIES;
    const q = search.toLowerCase();
    return TRIGGER_CATEGORIES.map(cat => ({
      ...cat,
      triggers: cat.triggers.filter(t => t.includes(q)),
    })).filter(cat => cat.triggers.length > 0);
  }, [search]);

  return (
    <div className="relative">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-slate-600">
          Browse all automation triggers emitted across the platform. Click any trigger to create a new rule pre-filled with that trigger.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search triggers..."
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Zap} title="No triggers found" description="Try a different search term." />
      ) : (
        <div className="space-y-4">
          {filtered.map(cat => {
            const isOpen = search.trim() ? true : (openSections[cat.label] ?? true);
            return (
              <div key={cat.label}>
                <button
                  type="button"
                  onClick={() => toggleSection(cat.label)}
                  className="flex items-center gap-1.5 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {isOpen
                    ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  }
                  <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{cat.label}</span>
                </button>
                {isOpen && (
                  <div>
                    {cat.triggers.map(trigger => {
                      const trigType = TRIGGER_TYPE_MAP[trigger] ?? 'Manual';
                      return (
                        <div key={trigger} className="bg-white border border-slate-200 rounded-lg p-3 mb-2 flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-mono text-sm text-slate-800 font-medium">{trigger}</span>
                            <div className="flex items-center gap-1.5">
                              {triggerBadge(trigType)}
                              <span className="bg-slate-100 text-xs rounded px-1.5 py-0.5 text-slate-500">· {cat.module}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => showToast('Opening rule builder with this trigger pre-filled')}
                            className="flex-shrink-0 border border-amber-400 text-amber-600 hover:bg-amber-50 text-xs py-1 px-2 rounded transition-colors cursor-pointer"
                          >
                            Use →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Dispatch Queue Tab ───────────────────────────────────────────────────────

function DispatchQueueTab() {
  const [search, setSearch] = useState('');
  const [unclaimedOnly, setUnclaimedOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState<DispatchQueueItem[]>(dispatchQueueItems);
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function handleCopy(item: DispatchQueueItem) {
    setItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, claimedBy: 'Jason Daswani', claimedUntil: '19:30', status: 'Claimed' } : i
    ));
    setExpandedId(item.id);
    navigator.clipboard?.writeText(item.renderedBody).catch(() => {});
  }

  function handleMarkSent(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'Sent' } : i));
    setExpandedId(null);
    showToast('Marked as sent');
  }

  function handleDismiss(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    setExpandedId(null);
  }

  const filtered = useMemo(() => items.filter(i => {
    if (unclaimedOnly && i.status !== 'Unclaimed') return false;
    if (search && !i.templateName.toLowerCase().includes(search.toLowerCase()) &&
        !i.contactName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, search, unclaimedOnly]);

  const unclaimed = items.filter(i => i.status === 'Unclaimed').length;
  const claimedByMe = items.filter(i => i.claimedBy === 'Jason Daswani').length;
  const sent = items.filter(i => i.status === 'Sent').length;

  return (
    <div className="relative">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
        <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          <span className="font-semibold">v1</span> — All outbound messages are copy-paste. Claim a message to lock it for 30 minutes, then send manually via WhatsApp or email.
        </p>
      </div>

      <div className="flex gap-3 mb-4">
        {[
          { label: 'Unclaimed', value: unclaimed, color: 'text-red-600 bg-red-50 border-red-200' },
          { label: 'Claimed by Me', value: claimedByMe, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: 'Sent Today', value: sent, color: 'text-green-600 bg-green-50 border-green-200' },
        ].map(s => (
          <div key={s.label} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border bg-white shadow-sm text-sm font-medium', s.color)}>
            <span className="text-slate-500">{s.label}:</span>
            <span className={cn('font-bold', s.color.split(' ')[0])}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={unclaimedOnly} onChange={e => setUnclaimedOnly(e.target.checked)}
            className="accent-amber-500" />
          Unclaimed only
        </label>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Send} title="No messages found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Template','Contact','Generated','Source Rule','Claimed By','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => (
                  <>
                    <tr key={item.id} className={cn('hover:bg-slate-50 transition-colors', item.status === 'Sent' && 'opacity-60')}>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{item.templateName}</td>
                      <td className="px-4 py-3 text-slate-600">{item.contactName}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{item.generatedAt}</td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{item.sourceRule}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {item.claimedBy
                          ? <span className="text-slate-700">{item.claimedBy} <span className="text-slate-400">· expires {item.claimedUntil}</span></span>
                          : <span className="text-red-500 font-medium">Unclaimed</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(item)}
                            disabled={item.status === 'Sent'}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-40"
                          >
                            Copy Message
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkSent(item.id)}
                            disabled={item.status === 'Sent'}
                            className="px-2 py-1 border border-green-400 text-green-600 hover:bg-green-50 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-40"
                          >
                            Mark Sent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismiss(item.id)}
                            className="px-2 py-1 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-medium rounded transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === item.id && (
                      <tr key={`${item.id}-expanded`}>
                        <td colSpan={6} className="px-4 py-0">
                          <div className="border-l-4 border-amber-400 bg-white rounded-r-lg p-4 my-2">
                            <p className="text-xs text-slate-400 mb-1">Rendered Message</p>
                            <p className="text-sm text-slate-800 mb-3">{item.renderedBody}</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => { navigator.clipboard?.writeText(item.renderedBody).catch(() => {}); showToast('Copied to clipboard'); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                              >
                                <Clipboard className="w-3 h-3" /> Copy to clipboard
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpandedId(null)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded transition-colors cursor-pointer"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Internal Messages Tab ────────────────────────────────────────────────────

type ChipRecordType = 'Student' | 'Lead' | 'Invoice' | 'Task' | 'Concern';

type RecordChip = {
  type: ChipRecordType;
  name: string;
  detail: string;
  id?: string;
};

type MsgReaction = { emoji: string; count: number };

type DayLabel = 'Today' | 'Yesterday' | 'Monday 14 Apr';

type IMMessage = {
  id: string;
  senderId: string;
  senderName: string;
  initials: string;
  color: string;
  day: DayLabel;
  time: string;
  body: string;
  chips?: RecordChip[];
  reactions?: MsgReaction[];
};

type IMChannel = {
  id: string;
  name: string;
  memberCount: number;
  unread?: boolean;
};

type IMDirectMessage = {
  id: string;
  name: string;
  initials: string;
  color: string;
  online: boolean;
};

const IM_CHANNELS: IMChannel[] = [
  { id: 'general',         name: 'general',         memberCount: 12, unread: true },
  { id: 'leads-pipeline',  name: 'leads-pipeline',  memberCount: 6 },
  { id: 'academic-team',   name: 'academic-team',   memberCount: 9 },
  { id: 'finance-admin',   name: 'finance-admin',   memberCount: 4 },
  { id: 'hr-notices',      name: 'hr-notices',      memberCount: 12 },
];

const IM_DMS: IMDirectMessage[] = [
  { id: 'dm-sarah',  name: 'Sarah Thompson', initials: 'ST', color: 'bg-blue-500',   online: true  },
  { id: 'dm-ahmed',  name: 'Ahmed Khalil',   initials: 'AK', color: 'bg-purple-500', online: false },
  { id: 'dm-tariq',  name: 'Tariq Al-Amin',  initials: 'TA', color: 'bg-green-500',  online: true  },
  { id: 'dm-hana',   name: 'Hana Yusuf',     initials: 'HY', color: 'bg-pink-500',   online: false },
];

const IM_THREAD_TYPES: { icon: string; label: string }[] = [
  { icon: '📋', label: 'General' },
  { icon: '🎫', label: 'Complaint' },
  { icon: '📅', label: 'Scheduling' },
  { icon: '🎓', label: 'Academic Concern' },
  { icon: '💬', label: 'Feedback' },
  { icon: '💰', label: 'Financial' },
  { icon: '📍', label: 'Meeting' },
];

const EMOJI_PALETTE = ['👍','✅','👀','🎉','❤️','😂','🙏','💪'];

const CURRENT_USER = {
  id: 'jason',
  name: 'Jason Daswani',
  initials: 'JD',
  color: 'bg-amber-500',
};

const IM_GENERAL_SEED: IMMessage[] = [
  {
    id: 'g-1',
    senderId: 'jason',
    senderName: 'Jason Daswani',
    initials: 'JD', color: 'bg-amber-500',
    day: 'Today', time: '09:14',
    body: 'Good morning team 👋 Just a reminder — Term 3 invoices need to go out by end of week. @Sarah can you handle the Lower Secondary batch?',
  },
  {
    id: 'g-2',
    senderId: 'sarah',
    senderName: 'Sarah Thompson',
    initials: 'ST', color: 'bg-blue-500',
    day: 'Today', time: '09:16',
    body: "On it! I'll start with Y7–Y9 this morning.",
    reactions: [{ emoji: '👍', count: 2 }],
  },
  {
    id: 'g-3',
    senderId: 'ahmed',
    senderName: 'Ahmed Khalil',
    initials: 'AK', color: 'bg-purple-500',
    day: 'Today', time: '09:31',
    body: "Quick heads up — Aisha Rahman missed her Y8 Maths session yesterday. I've logged it but her mum hasn't responded to my message.",
    chips: [{ type: 'Student', name: 'Aisha Rahman', detail: 'IMI-0001', id: 'IMI-0001' }],
  },
  {
    id: 'g-4',
    senderId: 'jason',
    senderName: 'Jason Daswani',
    initials: 'JD', color: 'bg-amber-500',
    day: 'Today', time: '09:33',
    body: "Thanks Ahmed. @Sarah can you follow up with the guardian? There's already an overdue invoice on the account.",
    chips: [{ type: 'Invoice', name: 'INV-1042', detail: 'AED 3,360 Overdue' }],
  },
  {
    id: 'g-5',
    senderId: 'sarah',
    senderName: 'Sarah Thompson',
    initials: 'ST', color: 'bg-blue-500',
    day: 'Today', time: '09:45',
    body: "I'll call her now. Also — new lead Bilal Mahmood has confirmed his assessment for Saturday.",
    chips: [{ type: 'Lead', name: 'Bilal Mahmood', detail: 'Assessment Booked' }],
  },
  {
    id: 'g-6',
    senderId: 'tariq',
    senderName: 'Tariq Al-Amin',
    initials: 'TA', color: 'bg-green-500',
    day: 'Today', time: '10:02',
    body: "Just saw the churn risk report — Omar Al-Farsi is flagged. He's been missing sessions. Should I raise a concern?",
  },
  {
    id: 'g-7',
    senderId: 'jason',
    senderName: 'Jason Daswani',
    initials: 'JD', color: 'bg-amber-500',
    day: 'Today', time: '10:05',
    body: 'Yes please raise L1 concern. Tag me and his HOD.',
    chips: [{ type: 'Task', name: 'Follow up Omar Al-Farsi attendance', detail: 'High' }],
  },
];

const IM_LEADS_PIPELINE_SEED: IMMessage[] = [
  {
    id: 'lp-1',
    senderId: 'sarah',
    senderName: 'Sarah Thompson',
    initials: 'ST', color: 'bg-blue-500',
    day: 'Today', time: '08:52',
    body: 'Pipeline check: 4 new leads from the weekend campaign. Prioritising Bilal Mahmood — parent sounded very keen on the call.',
    chips: [{ type: 'Lead', name: 'Bilal Mahmood', detail: 'Assessment Booked' }],
  },
  {
    id: 'lp-2',
    senderId: 'ahmed',
    senderName: 'Ahmed Khalil',
    initials: 'AK', color: 'bg-purple-500',
    day: 'Today', time: '09:05',
    body: 'Saturday assessment booked for Bilal — Maths + English, 10:00am with Ms Priya.',
  },
  {
    id: 'lp-3',
    senderId: 'tariq',
    senderName: 'Tariq Al-Amin',
    initials: 'TA', color: 'bg-green-500',
    day: 'Today', time: '09:40',
    body: '@Sarah nudge on Fatima Al-Suwaidi? She went quiet after the tour last week.',
    reactions: [{ emoji: '👀', count: 1 }],
  },
];

const IM_ACADEMIC_TEAM_SEED: IMMessage[] = [
  {
    id: 'at-1',
    senderId: 'ahmed',
    senderName: 'Ahmed Khalil',
    initials: 'AK', color: 'bg-purple-500',
    day: 'Today', time: '08:30',
    body: 'Y8 Maths cohort assessment results are in — averages are up 6% on last term. Nice work team.',
    reactions: [{ emoji: '🎉', count: 3 }],
  },
  {
    id: 'at-2',
    senderId: 'hana',
    senderName: 'Hana Yusuf',
    initials: 'HY', color: 'bg-pink-500',
    day: 'Today', time: '08:47',
    body: 'Progress reports due Friday. Please flag any students needing additional intervention.',
  },
];

const IM_FINANCE_ADMIN_SEED: IMMessage[] = [
  {
    id: 'fa-1',
    senderId: 'sarah',
    senderName: 'Sarah Thompson',
    initials: 'ST', color: 'bg-blue-500',
    day: 'Today', time: '08:20',
    body: 'Aisha Rahman invoice is 14 days overdue. Second reminder sent, escalating to Jason.',
    chips: [{ type: 'Invoice', name: 'INV-1042', detail: 'AED 3,360 Overdue' }],
  },
];

const IM_HR_NOTICES_SEED: IMMessage[] = [
  {
    id: 'hr-1',
    senderId: 'jason',
    senderName: 'Jason Daswani',
    initials: 'JD', color: 'bg-amber-500',
    day: 'Yesterday', time: '16:10',
    body: 'Reminder: term-break staff roster is due by Thursday. Please submit your availability in the shared sheet.',
  },
];

const IM_DM_SARAH_SEED: IMMessage[] = [
  {
    id: 'dms-1',
    senderId: 'sarah',
    senderName: 'Sarah Thompson',
    initials: 'ST', color: 'bg-blue-500',
    day: 'Today', time: '09:50',
    body: 'Called Aisha\'s mum — she\'s going to come in Thursday to sort the invoice.',
  },
];

const IM_CHANNEL_SEEDS: Record<string, IMMessage[]> = {
  'general':          IM_GENERAL_SEED,
  'leads-pipeline':   IM_LEADS_PIPELINE_SEED,
  'academic-team':    IM_ACADEMIC_TEAM_SEED,
  'finance-admin':    IM_FINANCE_ADMIN_SEED,
  'hr-notices':       IM_HR_NOTICES_SEED,
  'dm-sarah':         IM_DM_SARAH_SEED,
  'dm-ahmed':         [],
  'dm-tariq':         [],
  'dm-hana':          [],
};

// Seed mock records for the record picker.
const IM_RECORD_LIBRARY: Record<ChipRecordType, RecordChip[]> = {
  Student: [
    { type: 'Student', name: 'Aisha Rahman',   detail: 'IMI-0001', id: 'IMI-0001' },
    { type: 'Student', name: 'Omar Al-Farsi',  detail: 'IMI-0002', id: 'IMI-0002' },
    { type: 'Student', name: 'Layla Hassan',   detail: 'IMI-0003', id: 'IMI-0003' },
    { type: 'Student', name: 'Yousef Mahmoud', detail: 'IMI-0004', id: 'IMI-0004' },
    { type: 'Student', name: 'Noura Saleh',    detail: 'IMI-0005', id: 'IMI-0005' },
  ],
  Lead: [
    { type: 'Lead', name: 'Bilal Mahmood',      detail: 'Assessment Booked' },
    { type: 'Lead', name: 'Fatima Al-Suwaidi',  detail: 'Awaiting Callback' },
    { type: 'Lead', name: 'Kareem Ibrahim',     detail: 'Tour Completed' },
    { type: 'Lead', name: 'Maya Othman',        detail: 'New Enquiry' },
    { type: 'Lead', name: 'Zayd Hussein',       detail: 'Trial Booked' },
  ],
  Invoice: [
    { type: 'Invoice', name: 'INV-1042', detail: 'AED 3,360 Overdue' },
    { type: 'Invoice', name: 'INV-1058', detail: 'AED 2,100 Due Apr 24' },
    { type: 'Invoice', name: 'INV-1061', detail: 'AED 4,200 Paid' },
    { type: 'Invoice', name: 'INV-1073', detail: 'AED 1,680 Draft' },
    { type: 'Invoice', name: 'INV-1082', detail: 'AED 5,040 Due Apr 30' },
  ],
  Task: [
    { type: 'Task', name: 'Follow up Omar Al-Farsi attendance', detail: 'High' },
    { type: 'Task', name: 'Confirm Bilal Mahmood assessment',   detail: 'Medium' },
    { type: 'Task', name: 'Send Term 3 invoices (Y7-Y9)',       detail: 'High' },
    { type: 'Task', name: 'Review Y8 Maths progress',           detail: 'Low' },
    { type: 'Task', name: 'Collect term-break roster',          detail: 'Medium' },
  ],
  Concern: [
    { type: 'Concern', name: 'Omar Al-Farsi attendance', detail: 'L1 Churn Risk' },
    { type: 'Concern', name: 'Aisha Rahman fees',        detail: 'L2 Financial' },
    { type: 'Concern', name: 'Y9 English engagement',    detail: 'L1 Academic' },
    { type: 'Concern', name: 'Noura Saleh homework',     detail: 'L1 Academic' },
    { type: 'Concern', name: 'Kareem lead cold',         detail: 'L1 Pipeline' },
  ],
};

function IMAvatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      className={cn('rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0', color)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

function chipIcon(type: ChipRecordType) {
  switch (type) {
    case 'Student': return <GraduationCap className="w-3.5 h-3.5 text-amber-500" />;
    case 'Lead':    return <UserCircle2    className="w-3.5 h-3.5 text-amber-500" />;
    case 'Invoice': return <Receipt        className="w-3.5 h-3.5 text-amber-500" />;
    case 'Task':    return <ListChecks     className="w-3.5 h-3.5 text-amber-500" />;
    case 'Concern': return <AlertOctagon   className="w-3.5 h-3.5 text-amber-500" />;
  }
}

function MessageBody({ body }: { body: string }) {
  const mentionRx = /@([A-Za-z][A-Za-z\s]*?)(?=[\s,.!?]|$)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match;
  while ((match = mentionRx.exec(body)) !== null) {
    if (match.index > last) parts.push(body.slice(last, match.index));
    parts.push(
      <span key={match.index} className="bg-amber-100 text-amber-700 rounded px-1 font-medium">
        @{match[1].trim()}
      </span>
    );
    last = match.index + match[0].length;
  }
  if (last < body.length) parts.push(body.slice(last));
  return <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{parts}</p>;
}

function RecordPickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (chip: RecordChip) => void;
}) {
  const [category, setCategory] = useState<ChipRecordType>('Student');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const list = IM_RECORD_LIBRARY[category];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(r => r.name.toLowerCase().includes(q) || r.detail.toLowerCase().includes(q));
  }, [category, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Link a record</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${category.toLowerCase()}s...`}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(IM_RECORD_LIBRARY) as ChipRecordType[]).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors',
                  category === c
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {c}s
              </button>
            ))}
          </div>

          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 px-3 py-4 text-center">No matching records.</p>
            ) : filtered.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPick(r)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-amber-50 cursor-pointer transition-colors"
              >
                {chipIcon(r.type)}
                <span className="text-sm font-medium text-slate-800 flex-1 truncate">{r.name}</span>
                <span className="text-xs text-slate-500">{r.detail}</span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateTaskDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (chip: RecordChip) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <CreateTaskDialogInner onOpenChange={onOpenChange} onCreate={onCreate} />}
    </Dialog>
  );
}

function CreateTaskDialogInner({
  onOpenChange,
  onCreate,
}: {
  onOpenChange: (o: boolean) => void;
  onCreate: (chip: RecordChip) => void;
}) {
  const [title,    setTitle]    = useState('');
  const [priority, setPriority] = useState<'Low'|'Medium'|'High'>('Medium');
  const [assignee, setAssignee] = useState('Jason Daswani');
  const [dueDate,  setDueDate]  = useState('');

  const valid = title.trim() && priority && assignee && dueDate;

  return (
    <>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Create task & link</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-4 space-y-3">
          <div>
            <label className="text-xs text-slate-500 font-medium">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="e.g. Follow up guardian call"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium">Priority *</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as typeof priority)}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer bg-white"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Due date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Assignee *</label>
            <select
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer bg-white"
            >
              <option>Jason Daswani</option>
              <option>Sarah Thompson</option>
              <option>Ahmed Khalil</option>
              <option>Tariq Al-Amin</option>
              <option>Hana Yusuf</option>
            </select>
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => {
              onCreate({ type: 'Task', name: title.trim(), detail: priority });
              toast.success('Task created and linked');
              onOpenChange(false);
            }}
            className={cn(
              'px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors',
              valid
                ? 'bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
          >
            Create & Link
          </button>
        </DialogFooter>
      </DialogContent>
    </>
  );
}

function RecordChipInline({
  chip,
  onNavigate,
}: {
  chip: RecordChip;
  onNavigate: (chip: RecordChip) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(chip)}
      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-amber-50 rounded-lg pl-2 pr-3 py-1.5 border-l-2 border-amber-400 cursor-pointer transition-colors text-xs text-slate-700 mt-1.5 mr-1.5"
    >
      {chipIcon(chip.type)}
      <span className="font-medium">{chip.type}:</span>
      <span>{chip.name}</span>
      <span className="text-slate-400">—</span>
      <span>{chip.detail}</span>
    </button>
  );
}

function InternalMessagesTab() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialChannel = useMemo(() => {
    const ch = searchParams.get('channel');
    if (ch && IM_CHANNEL_SEEDS[ch] !== undefined) return ch;
    return 'general';
  }, [searchParams]);

  const [activeId, setActiveId] = useState<string>(initialChannel);
  useEffect(() => { setActiveId(initialChannel); }, [initialChannel]);

  const [query, setQuery] = useState('');
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, IMMessage[]>>(() => {
    const copy: Record<string, IMMessage[]> = {};
    Object.keys(IM_CHANNEL_SEEDS).forEach(k => { copy[k] = [...IM_CHANNEL_SEEDS[k]]; });
    return copy;
  });

  const [compose, setCompose] = useState('');
  const [pendingChips, setPendingChips] = useState<RecordChip[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [recordPickerOpen, setRecordPickerOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const [threadReplies, setThreadReplies] = useState<Record<string, IMMessage[]>>({
    'g-1': [{
      id: 'g-1-r1',
      senderId: 'ahmed',
      senderName: 'Ahmed Khalil',
      initials: 'AK', color: 'bg-purple-500',
      day: 'Today', time: '09:18',
      body: 'Concern raised — L1. HOD has been notified.',
    }],
  });
  const [threadDraft, setThreadDraft] = useState('');

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeChannel = IM_CHANNELS.find(c => c.id === activeId);
  const activeDM = IM_DMS.find(d => d.id === activeId);
  const activeMessages = messagesByChannel[activeId] ?? [];

  const filteredChannels = useMemo(
    () => IM_CHANNELS.filter(c => c.name.toLowerCase().includes(query.toLowerCase())),
    [query]
  );
  const filteredDMs = useMemo(
    () => IM_DMS.filter(d => d.name.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [activeId, activeMessages.length]);

  const selectedMessage = selectedMessageId
    ? activeMessages.find(m => m.id === selectedMessageId) ?? null
    : null;

  function handleChipNavigate(chip: RecordChip) {
    switch (chip.type) {
      case 'Student': {
        if (chip.id) router.push(`/students/${chip.id}`);
        else toast('Opening student record...');
        break;
      }
      case 'Lead':    toast('Opening lead record...'); break;
      case 'Invoice': router.push('/finance'); break;
      case 'Task':    router.push('/tasks'); break;
      case 'Concern': router.push('/progress?tab=alerts'); break;
    }
  }

  function toggleReaction(msgId: string, emoji: string) {
    setMessagesByChannel(prev => {
      const list = [...(prev[activeId] ?? [])];
      const idx = list.findIndex(m => m.id === msgId);
      if (idx === -1) return prev;
      const msg = { ...list[idx] };
      const reactions = [...(msg.reactions ?? [])];
      const rIdx = reactions.findIndex(r => r.emoji === emoji);
      if (rIdx === -1) reactions.push({ emoji, count: 1 });
      else reactions[rIdx] = { ...reactions[rIdx], count: reactions[rIdx].count + 1 };
      msg.reactions = reactions;
      list[idx] = msg;
      return { ...prev, [activeId]: list };
    });
  }

  function sendMessage() {
    const trimmed = compose.trim();
    if (!trimmed && pendingChips.length === 0) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const newMsg: IMMessage = {
      id: `m-${Date.now()}`,
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      initials: CURRENT_USER.initials,
      color: CURRENT_USER.color,
      day: 'Today',
      time: `${hh}:${mm}`,
      body: trimmed,
      chips: pendingChips.length ? pendingChips : undefined,
    };
    setMessagesByChannel(prev => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), newMsg] }));
    setCompose('');
    setPendingChips([]);
  }

  function sendThreadReply() {
    const text = threadDraft.trim();
    if (!text || !selectedMessage) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const reply: IMMessage = {
      id: `r-${Date.now()}`,
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      initials: CURRENT_USER.initials,
      color: CURRENT_USER.color,
      day: 'Today',
      time: `${hh}:${mm}`,
      body: text,
    };
    setThreadReplies(prev => ({
      ...prev,
      [selectedMessage.id]: [...(prev[selectedMessage.id] ?? []), reply],
    }));
    setThreadDraft('');
  }

  function insertAtCursor(value: string) {
    const el = textareaRef.current;
    if (!el) { setCompose(c => c + value); return; }
    const start = el.selectionStart ?? compose.length;
    const end = el.selectionEnd ?? compose.length;
    const next = compose.slice(0, start) + value + compose.slice(end);
    setCompose(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + value.length;
      el.setSelectionRange(pos, pos);
    });
  }

  const activeLabel = activeChannel ? `#${activeChannel.name}` : activeDM?.name ?? '';
  const activeIsChannel = !!activeChannel;
  const activeMembers = activeChannel?.memberCount ?? 0;

  // Group messages by day then by consecutive sender.
  const groupedByDay = useMemo(() => {
    const groups: { day: DayLabel; messages: IMMessage[] }[] = [];
    activeMessages.forEach(m => {
      const last = groups[groups.length - 1];
      if (last && last.day === m.day) last.messages.push(m);
      else groups.push({ day: m.day, messages: [m] });
    });
    return groups;
  }, [activeMessages]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex" style={{ height: '72vh', minHeight: 620 }}>
      {/* LEFT PANEL */}
      <div className="w-60 flex-shrink-0 border-r border-slate-200 flex flex-col bg-slate-50/60">
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search channels/DMs"
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-3">
          {/* Channels */}
          <div className="flex items-center justify-between px-3 mt-2 mb-1">
            <p className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold">Channels</p>
          </div>
          {filteredChannels.map(ch => (
            <button
              key={ch.id}
              type="button"
              onClick={() => { setActiveId(ch.id); setSelectedMessageId(null); }}
              className={cn(
                'w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors cursor-pointer',
                activeId === ch.id
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <Hash className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
              <span className={cn('flex-1 truncate', ch.unread && activeId !== ch.id && 'font-semibold text-slate-800')}>{ch.name}</span>
              {ch.unread && activeId !== ch.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => toast('Create channel — coming soon')}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:text-amber-600 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3 h-3" /> New Channel
          </button>

          {/* DMs */}
          <div className="flex items-center justify-between px-3 mt-4 mb-1">
            <p className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold">Direct Messages</p>
          </div>
          {filteredDMs.map(dm => (
            <button
              key={dm.id}
              type="button"
              onClick={() => { setActiveId(dm.id); setSelectedMessageId(null); }}
              className={cn(
                'w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors cursor-pointer',
                activeId === dm.id
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <div className="relative flex-shrink-0">
                <IMAvatar initials={dm.initials} color={dm.color} size={22} />
                {dm.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 ring-2 ring-slate-50" />
                )}
              </div>
              <span className="flex-1 truncate">{dm.name}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => toast('DM — coming soon')}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:text-amber-600 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3 h-3" /> New Direct Message
          </button>

          {/* Thread types */}
          <div className="flex items-center justify-between px-3 mt-4 mb-1">
            <p className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold">Thread Types</p>
          </div>
          {IM_THREAD_TYPES.map(t => (
            <button
              key={t.label}
              type="button"
              onClick={() => toast(`${t.label} threads — coming soon`)}
              className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <span className="text-sm leading-none" aria-hidden>{t.icon}</span>
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MIDDLE PANEL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-slate-200 px-5 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {activeIsChannel ? (
              <>
                <Hash className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-900 truncate">{activeChannel?.name}</span>
                <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-medium">
                  {activeMembers} members
                </span>
              </>
            ) : (
              <>
                {activeDM && (
                  <div className="relative">
                    <IMAvatar initials={activeDM.initials} color={activeDM.color} size={28} />
                    {activeDM.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                    )}
                  </div>
                )}
                <span className="font-semibold text-slate-900 truncate">{activeDM?.name}</span>
                {activeDM?.online && <span className="text-xs text-green-600">Online</span>}
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              title="Channel info"
              onClick={() => toast('Channel info — coming soon')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Search in channel"
              onClick={() => toast('Search in channel — coming soon')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesRef} className="flex-1 overflow-y-auto px-5 py-4 bg-white">
          {activeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <MessageSquare className="w-8 h-8" />
              <p className="text-sm">No messages in {activeLabel} yet.</p>
            </div>
          ) : (
            groupedByDay.map((group, gi) => (
              <div key={gi}>
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5">
                    {group.day}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <div className="space-y-0.5">
                  {group.messages.map((m, i) => {
                    const prev = group.messages[i - 1];
                    const grouped = prev && prev.senderId === m.senderId;
                    const isOwn = m.senderId === CURRENT_USER.id;
                    const isSelected = selectedMessageId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMessageId(m.id)}
                        className={cn(
                          'group flex items-start gap-3 px-2 py-1 rounded-md cursor-pointer transition-colors',
                          isSelected ? 'bg-amber-50' : 'hover:bg-slate-50',
                        )}
                      >
                        <div className="w-8 flex-shrink-0">
                          {!grouped ? (
                            <IMAvatar initials={m.initials} color={m.color} size={32} />
                          ) : (
                            <span className="text-[10px] text-slate-400 invisible group-hover:visible block text-right pr-1 pt-1">{m.time}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {!grouped && (
                            <div className="flex items-baseline gap-2">
                              <span className={cn('font-semibold text-sm', isOwn ? 'text-amber-600' : 'text-slate-900')}>
                                {m.senderName}
                              </span>
                              <span className="text-xs text-slate-400">{m.time}</span>
                            </div>
                          )}
                          <MessageBody body={m.body} />

                          {m.chips && m.chips.length > 0 && (
                            <div className="flex flex-wrap -mt-0.5">
                              {m.chips.map((c, ci) => (
                                <span
                                  key={ci}
                                  onClick={e => { e.stopPropagation(); handleChipNavigate(c); }}
                                >
                                  <RecordChipInline chip={c} onNavigate={handleChipNavigate} />
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Reactions */}
                          <div className="flex flex-wrap gap-1 mt-1 items-center">
                            {(m.reactions ?? []).map((r, ri) => (
                              <button
                                key={ri}
                                type="button"
                                onClick={e => { e.stopPropagation(); toggleReaction(m.id, r.emoji); }}
                                className="bg-slate-100 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded-full px-2 py-0.5 text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>{r.emoji}</span>
                                <span className="text-slate-600 font-medium">{r.count}</span>
                              </button>
                            ))}
                            <ReactionAdder
                              onPick={emoji => toggleReaction(m.id, emoji)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-slate-200 px-5 py-3 flex-shrink-0 bg-white">
          {/* Toolbar */}
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            <ToolbarButton label="Attach file"        onClick={() => toast('File attachment — coming soon')}><Paperclip className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton label="Image"              onClick={() => toast('Image — coming soon')}><ImageIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton label="Mention"            onClick={() => insertAtCursor('@')}><AtSign className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton label="Link record"        onClick={() => setRecordPickerOpen(true)}><Link2 className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton label="Create task"        onClick={() => setTaskDialogOpen(true)}><CheckSquare className="w-4 h-4" /></ToolbarButton>
            <div className="relative">
              <ToolbarButton label="Emoji" onClick={() => setShowEmoji(s => !s)}>
                <Smile className="w-4 h-4" />
              </ToolbarButton>
              {showEmoji && (
                <div className="absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 flex gap-1 z-20">
                  {EMOJI_PALETTE.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { insertAtCursor(e); setShowEmoji(false); }}
                      className="text-lg hover:bg-amber-50 rounded w-8 h-8 flex items-center justify-center cursor-pointer"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending chips */}
          {pendingChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {pendingChips.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-slate-100 rounded-lg pl-2 pr-1 py-1 border-l-2 border-amber-400 text-xs text-slate-700"
                >
                  {chipIcon(c.type)}
                  <span className="font-medium">{c.type}:</span>
                  <span>{c.name}</span>
                  <button
                    type="button"
                    onClick={() => setPendingChips(p => p.filter((_, idx) => idx !== i))}
                    className="ml-1 p-0.5 rounded hover:bg-slate-200 cursor-pointer"
                    aria-label="Remove link"
                  >
                    <X className="w-3 h-3 text-slate-500" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Textarea + send */}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={compose}
              onChange={e => setCompose(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={2}
              placeholder={`Message ${activeLabel}`}
              className="flex-1 resize-none border border-slate-200 rounded-xl text-sm px-3 py-2 max-h-40 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
              style={{ minHeight: 52 }}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!compose.trim() && pendingChips.length === 0}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0',
                (compose.trim() || pendingChips.length)
                  ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed',
              )}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — THREAD */}
      <div className="w-72 flex-shrink-0 border-l border-slate-200 flex flex-col bg-slate-50/40">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 flex-shrink-0">
          <span className="text-sm font-semibold text-slate-800">Thread</span>
          {selectedMessage && (
            <button
              type="button"
              onClick={() => setSelectedMessageId(null)}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
              aria-label="Close thread"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {selectedMessage ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* Parent */}
              <div className="flex items-start gap-2 pb-3 border-b border-slate-200">
                <IMAvatar initials={selectedMessage.initials} color={selectedMessage.color} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn('text-sm font-semibold', selectedMessage.senderId === CURRENT_USER.id ? 'text-amber-600' : 'text-slate-900')}>
                      {selectedMessage.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400">{selectedMessage.time}</span>
                  </div>
                  <MessageBody body={selectedMessage.body} />
                  {selectedMessage.chips?.map((c, i) => (
                    <RecordChipInline key={i} chip={c} onNavigate={handleChipNavigate} />
                  ))}
                </div>
              </div>

              {/* Replies */}
              {(threadReplies[selectedMessage.id] ?? []).map(r => (
                <div key={r.id} className="flex items-start gap-2">
                  <IMAvatar initials={r.initials} color={r.color} size={26} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className={cn('text-xs font-semibold', r.senderId === CURRENT_USER.id ? 'text-amber-600' : 'text-slate-900')}>
                        {r.senderName}
                      </span>
                      <span className="text-[10px] text-slate-400">{r.time}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{r.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 px-3 py-3 flex-shrink-0">
              <textarea
                value={threadDraft}
                onChange={e => setThreadDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendThreadReply();
                  }
                }}
                rows={2}
                placeholder="Reply in thread..."
                className="w-full resize-none border border-slate-200 rounded-lg text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  disabled={!threadDraft.trim()}
                  onClick={sendThreadReply}
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    threadDraft.trim()
                      ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                  )}
                >
                  <Send className="w-3 h-3" /> Reply
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center text-slate-400">
            <MessageSquare className="w-7 h-7" />
            <p className="text-xs leading-relaxed">Click on a message to view thread or reply</p>
          </div>
        )}
      </div>

      <RecordPickerDialog
        open={recordPickerOpen}
        onOpenChange={setRecordPickerOpen}
        onPick={chip => {
          setPendingChips(p => [...p, chip]);
          setRecordPickerOpen(false);
        }}
      />
      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onCreate={chip => setPendingChips(p => [...p, chip])}
      />
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
    >
      {children}
    </button>
  );
}

function ReactionAdder({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 hover:border-amber-300 rounded-full px-2 py-0.5 text-xs inline-flex items-center gap-1 cursor-pointer text-slate-500"
        aria-label="Add reaction"
      >
        <Smile className="w-3 h-3" /> +
      </button>
      {open && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg p-1 flex gap-0.5 z-20"
        >
          {EMOJI_PALETTE.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => { onPick(e); setOpen(false); }}
              className="text-base hover:bg-amber-50 rounded w-7 h-7 flex items-center justify-center cursor-pointer"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Marketing Tab ────────────────────────────────────────────────────────────

const DAYS_IN_WEEK = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function MarketingTab() {
  const [calYear]  = useState(2025);
  const [calMonth] = useState(3); // April 2025
  const [selectedMoment, setSelectedMoment] = useState<MarketingMoment | null>(null);
  const [newMomentOpen, setNewMomentOpen] = useState(false);
  const [nmName, setNmName] = useState('');
  const [nmAudience, setNmAudience] = useState('');
  const [nmTemplate, setNmTemplate] = useState('');
  const [nmChannel, setNmChannel] = useState<'Message'|'Email'|'Both'>('Message');
  const [nmDate, setNmDate] = useState('');
  const [nmTime, setNmTime] = useState('');
  const [nmPolicy, setNmPolicy] = useState<'Single-shot'|'Drip'>('Single-shot');
  const [nmInterval, setNmInterval] = useState('');

  const cells = getCalendarDays(calYear, calMonth);

  const momentColorMap: Record<MarketingMoment['status'], string> = {
    Sent: 'bg-green-100 text-green-700',
    Scheduled: 'bg-amber-100 text-amber-700',
    Draft: 'bg-slate-100 text-slate-600',
    Cancelled: 'bg-slate-100 text-slate-400 line-through',
  };

  const statusBadgeMap: Record<MarketingMoment['status'], string> = {
    Sent: 'bg-green-100 text-green-700',
    Scheduled: 'bg-amber-100 text-amber-700',
    Draft: 'bg-slate-100 text-slate-600',
    Cancelled: 'bg-slate-100 text-slate-500',
  };

  const campaignStatusMap: Record<MarketingCampaign['status'], string> = {
    Sent: 'bg-green-100 text-green-700',
    Scheduled: 'bg-amber-100 text-amber-700',
    Cancelled: 'bg-slate-100 text-slate-500',
    Draft: 'bg-slate-200 text-slate-400',
  };

  return (
    <div>
      {/* Section A */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Marketing Moments Calendar</h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded">BETA</span>
          </div>
          <button
            type="button"
            onClick={() => setNewMomentOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Marketing Moment
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button type="button" className="p-1 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-medium text-slate-700">April 2025</span>
          <button type="button" className="p-1 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
          {DAYS_IN_WEEK.map(d => (
            <div key={d} className="bg-slate-50 text-center text-xs text-slate-400 py-2 font-medium">{d}</div>
          ))}
          {cells.map((day, i) => {
            const dayMoments = day ? marketingMoments.filter(m => m.calendarDate === day) : [];
            return (
              <div key={i} className="bg-white min-h-20 p-1.5 border-t border-slate-100">
                {day && <span className="text-xs text-slate-400 block mb-1">{day}</span>}
                {dayMoments.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMoment(m)}
                    className={cn('w-full rounded p-1 text-xs truncate text-left mb-0.5 cursor-pointer transition-opacity hover:opacity-80', momentColorMap[m.status])}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section B */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Campaigns</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Campaign','Audience','Template','Sent','Delivered','Failed','Scheduled At','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marketingCampaigns.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{c.campaign}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{c.audience}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{c.template}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">{c.sent > 0 ? c.sent : '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-green-600 font-medium">{c.delivered > 0 ? c.delivered : '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-red-500">{c.failed > 0 ? c.failed : '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{c.scheduledAt}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', campaignStatusMap[c.status])}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Moment Detail Sheet */}
      <Sheet open={!!selectedMoment} onOpenChange={o => { if (!o) setSelectedMoment(null); }}>
        <SheetContent side="right" style={{ maxWidth: 480 }} className="flex flex-col gap-0 p-0 overflow-y-auto">
          {selectedMoment && (
            <>
              <SheetHeader className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-slate-900 text-base font-semibold mr-auto">{selectedMoment.name}</SheetTitle>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusBadgeMap[selectedMoment.status])}>{selectedMoment.status}</span>
                </div>
              </SheetHeader>
              <div className="flex-1 px-6 py-5 space-y-4">
                <div><p className="text-xs text-slate-400 mb-0.5">Audience</p><p className="text-sm text-slate-800">{selectedMoment.audience}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Template</p><p className="text-sm text-slate-800">{selectedMoment.template}</p></div>
                <div><p className="text-xs text-slate-400 mb-0.5">Scheduled For</p><p className="text-sm text-slate-800">{selectedMoment.scheduledFor}</p></div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Dispatched: {selectedMoment.dispatched} / {selectedMoment.total}</p>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${selectedMoment.total > 0 ? (selectedMoment.dispatched / selectedMoment.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <SheetFooter className="px-6 py-4 border-t border-slate-100 flex-row gap-2">
                <button onClick={() => setSelectedMoment(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer">Edit</button>
                <button onClick={() => setSelectedMoment(null)} className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors cursor-pointer">Cancel Moment</button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Moment Sheet */}
      <Sheet open={newMomentOpen} onOpenChange={o => { if (!o) setNewMomentOpen(false); }}>
        <SheetContent side="right" style={{ maxWidth: 560 }} className="flex flex-col gap-0 p-0 overflow-y-auto">
          <SheetHeader className="px-6 py-5 border-b border-slate-100">
            <SheetTitle className="text-slate-900 text-base font-semibold">New Marketing Moment</SheetTitle>
          </SheetHeader>
          <div className="flex-1 px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Name</label>
              <input type="text" value={nmName} onChange={e => setNmName(e.target.value)} placeholder="Moment name"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Audience</label>
              <select value={nmAudience} onChange={e => setNmAudience(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                <option value="">Select segment…</option>
                {segments.slice(0, 4).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Template</label>
              <select value={nmTemplate} onChange={e => setNmTemplate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                <option value="">Select template…</option>
                {automationTemplates.filter(t => t.status === 'Active').map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Channel</label>
              <div className="flex gap-3">
                {(['Message','Email','Both'] as const).map(ch => (
                  <label key={ch} className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600">
                    <input type="radio" name="channel" value={ch} checked={nmChannel === ch} onChange={() => setNmChannel(ch)} className="accent-amber-500" />
                    {ch}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Date</label>
                <input type="date" value={nmDate} onChange={e => setNmDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Time</label>
                <input type="time" value={nmTime} onChange={e => setNmTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Dispatch Policy</label>
              <div className="flex gap-3 mb-2">
                {(['Single-shot','Drip'] as const).map(p => (
                  <label key={p} className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600">
                    <input type="radio" name="policy" value={p} checked={nmPolicy === p} onChange={() => setNmPolicy(p)} className="accent-amber-500" />
                    {p}
                  </label>
                ))}
              </div>
              {nmPolicy === 'Drip' && (
                <input type="text" value={nmInterval} onChange={e => setNmInterval(e.target.value)}
                  placeholder="e.g. 2 days between each"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              )}
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t border-slate-100 flex-row gap-2">
            <button onClick={() => setNewMomentOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer">Save as Draft</button>
            <button onClick={() => setNewMomentOpen(false)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">Schedule</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Execution Log Tab ────────────────────────────────────────────────────────

function ExecutionLogTab() {
  const [search, setSearch] = useState('');
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const [triggerSel, setTriggerSel] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<ExecutionLog | null>(null);
  const [routingOpen, setRoutingOpen] = useState(false);

  const filtered = useMemo(() => executionLogs.filter(l => {
    if (search && !l.rule.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusSel.length > 0 && !statusSel.includes(l.status)) return false;
    if (triggerSel.length > 0 && !triggerSel.includes(l.triggerType)) return false;
    return true;
  }), [search, statusSel, triggerSel]);

  const statusColors: Record<string, string> = {
    Success: 'bg-green-100 text-green-700',
    Failed:  'bg-red-100 text-red-700',
    Skipped: 'bg-slate-100 text-slate-600',
  };

  const totalExec = executionLogs.length * 83;
  const successCount = executionLogs.filter(l => l.status === 'Success').length;

  return (
    <>
      <div className="flex gap-3 mb-4">
        {[
          { label: 'Total Executions', value: '1,247', color: 'slate' as const },
          { label: 'Success Rate',     value: '94.2%', color: 'green' as const },
          { label: 'Failed (last 24h)',value: '3',      color: 'amber' as const },
        ].map(s => <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />)}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by rule name..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
        </div>
        <MultiSelectFilter label="Status"  options={['Success','Failed','Skipped']} selected={statusSel}  onChange={setStatusSel} />
        <MultiSelectFilter label="Trigger" options={['Status Change','Time-based','Threshold','Form Submission','Manual']} selected={triggerSel} onChange={setTriggerSel} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Activity} title="No executions found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Rule','Trigger Type','Fired At','Recipients','Live','Queued','Status','Duration','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-48 truncate">{log.rule}</td>
                    <td className="px-4 py-3">{triggerBadge(log.triggerType as AutomationRuleTrigger)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{log.firedAt}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">{log.recipients}</td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className={log.live > 0 ? 'text-green-600 font-medium' : 'text-slate-400'}>{log.live}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className={log.queued > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'}>{log.queued}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColors[log.status])}>{log.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{log.duration}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => { setSelectedLog(log); setRoutingOpen(false); }}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={!!selectedLog} onOpenChange={o => { if (!o) { setSelectedLog(null); setRoutingOpen(false); } }}>
        <SheetContent side="right" style={{ maxWidth: 640 }} className="flex flex-col gap-0 p-0 overflow-y-auto">
          {selectedLog && (
            <>
              <SheetHeader className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-slate-900 text-base font-semibold mr-auto">{selectedLog.rule}</SheetTitle>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColors[selectedLog.status])}>{selectedLog.status}</span>
                </div>
              </SheetHeader>

              <div className="flex-1 px-6 py-5 space-y-6">
                {/* Execution Summary */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Execution Summary</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Fired At',          value: selectedLog.firedAt },
                      { label: 'Recipients',         value: selectedLog.recipients },
                      { label: 'Live Dispatched',    value: selectedLog.live },
                      { label: 'Queued',             value: selectedLog.queued },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-0.5">{s.label}</p>
                        <p className="text-sm font-semibold text-slate-900">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trigger Event */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Trigger Event</p>
                  <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      {triggerBadge(selectedLog.triggerType as AutomationRuleTrigger)}
                    </div>
                    {selectedLog.payload.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-slate-500 w-36">{p.key}</span>
                        <span className="text-slate-800">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Condition Results */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Condition Results</p>
                  <div className="space-y-2">
                    {selectedLog.conditionResults.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {c.result === 'pass'
                          ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        }
                        <span className="text-sm text-slate-700 font-mono">{c.condition}</span>
                        <span className={cn('ml-auto text-xs font-medium px-2 py-0.5 rounded-full', c.result === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                          {c.result === 'pass' ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className={cn('text-xs mt-2', selectedLog.status === 'Skipped' ? 'text-red-500' : 'text-green-600')}>
                    {selectedLog.status === 'Skipped' ? 'Rule skipped — condition failed' : 'All conditions passed'}
                  </p>
                </div>

                {/* Action Results */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Action Results</p>
                  <div className="space-y-2">
                    {selectedLog.actionResults.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 flex-wrap">
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{a.type}</span>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                          a.outcome === 'Success' ? 'bg-green-100 text-green-700' :
                          a.outcome === 'Failed'  ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        )}>{a.outcome}</span>
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{a.target}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Per-Recipient Routing (collapsible) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setRoutingOpen(o => !o)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    {routingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    Per-Recipient Routing
                  </button>
                  {routingOpen && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            {['Recipient','Channel','Route','Outcome'].map(h => (
                              <th key={h} className="px-3 py-2 text-left text-slate-500 font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedLog.recipientRouting.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-700">{r.recipient}</td>
                              <td className="px-3 py-2 text-slate-500">{r.channel}</td>
                              <td className="px-3 py-2">
                                <span className={cn('px-2 py-0.5 rounded-full font-medium', r.route === 'Live' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{r.route}</span>
                              </td>
                              <td className="px-3 py-2 text-slate-600">{r.outcome}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <SheetFooter className="px-6 py-4 border-t border-slate-100">
                <button onClick={() => { setSelectedLog(null); setRoutingOpen(false); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer">
                  Close
                </button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Preview Sheet ────────────────────────────────────────────────────────────

function TemplatePreviewSheet({
  template,
  onClose,
  onEdit,
}: {
  template: AutomationTemplate | null;
  onClose: () => void;
  onEdit: (t: AutomationTemplate) => void;
}) {
  return (
    <Sheet open={!!template} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="right" style={{ maxWidth: 560 }} className="overflow-y-auto flex flex-col gap-0 p-0">
        {template && (
          <>
            <SheetHeader className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-slate-900 text-base font-semibold mr-auto">{template.name}</SheetTitle>
                {typeBadge(template.type)}
                {templateStatusBadge(template.status)}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Body */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Template Body</p>
                <div className="bg-white rounded-lg p-4 border border-slate-200 text-sm text-slate-700 leading-relaxed">
                  <BodyWithFields body={template.body} />
                </div>
              </div>

              {/* Merge fields */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Merge Fields Used</p>
                <div className="flex flex-wrap gap-1.5">
                  {template.mergeFields.map(f => (
                    <span key={f} className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 text-xs font-mono">[{f}]</span>
                  ))}
                </div>
              </div>

              {/* Usage */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Usage</p>
                {template.usedInRules.length === 0 ? (
                  <p className="text-slate-500 text-sm">Not used in any automation rules.</p>
                ) : (
                  <>
                    <p className="text-slate-500 text-sm mb-2">Used in {template.usedInRules.length} automation {template.usedInRules.length === 1 ? 'rule' : 'rules'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {template.usedInRules.map(r => (
                        <span key={r} className="bg-slate-100 text-slate-700 rounded-lg px-2.5 py-1 text-xs">{r}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <SheetFooter className="px-6 py-4 border-t border-slate-100 flex-row gap-2">
              <button
                onClick={() => { onClose(); onEdit(template); }}
                disabled={template.locked}
                className={cn(
                  'px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer',
                  template.locked && 'opacity-40 cursor-not-allowed'
                )}
              >
                Edit Template
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Edit Template Sheet ──────────────────────────────────────────────────────

function TemplateEditSheet({
  open,
  template,
  onClose,
}: {
  open: boolean;
  template: AutomationTemplate | null;
  onClose: () => void;
}) {
  const { can } = usePermission();
  const isNew = template === null;
  const [name,     setName]     = useState(template?.name     ?? '');
  const [type,     setType]     = useState<AutomationTemplateType>(template?.type ?? 'Message');
  const [owner,    setOwner]    = useState<AutomationTemplateOwner>(template?.owner ?? 'Personal');
  const [body,     setBody]     = useState(template?.body     ?? '');
  const [status,   setStatus]   = useState<'Draft' | 'Active'>(
    template?.status === 'Active' ? 'Active' : 'Draft'
  );
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function insertField(field: string) {
    const ta = bodyRef.current;
    if (!ta) { setBody(b => b + field); return; }
    const start = ta.selectionStart ?? body.length;
    const end   = ta.selectionEnd   ?? body.length;
    const next  = body.slice(0, start) + field + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.selectionStart = start + field.length;
      ta.selectionEnd   = start + field.length;
      ta.focus();
    });
  }

  const typeOptions: AutomationTemplateType[] = ['Message', 'Email', 'Task', 'Announcement'];
  const ownerOptions: AutomationTemplateOwner[] = ['Personal', 'Org-Wide'];

  return (
    <Sheet open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <SheetContent side="right" style={{ maxWidth: 640 }} className="overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-slate-100">
          <SheetTitle className="text-slate-900 text-base font-semibold">
            {isNew ? 'New Template' : 'Edit Template'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Template name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Type</label>
            <div className="flex gap-2 flex-wrap">
              {typeOptions.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer',
                    type === t
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Owner</label>
            <div className="flex gap-2">
              {ownerOptions.map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => { if (o === 'Org-Wide' && !can('automations.createOrgTemplate')) return; setOwner(o); }}
                  disabled={o === 'Org-Wide' && !can('automations.createOrgTemplate')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer',
                    owner === o
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300',
                    o === 'Org-Wide' && !can('automations.createOrgTemplate') && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
            {owner === 'Org-Wide' && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Requires Admin Head approval before publishing.
              </p>
            )}
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Body</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {MERGE_FIELDS.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => insertField(f)}
                  className="bg-slate-100 hover:bg-amber-100 hover:text-amber-700 text-slate-600 rounded px-1.5 py-0.5 text-xs font-mono transition-colors cursor-pointer"
                >
                  {f}
                </button>
              ))}
            </div>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your template body here. Click chips above to insert merge fields."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y"
              style={{ minHeight: 200 }}
            />
          </div>

          {/* Status toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Status</label>
            <div className="flex gap-2">
              {(['Draft', 'Active'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer',
                    status === s
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-slate-100 flex-row gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Save as Draft
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Save & Publish
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Rule Builder Sheet ───────────────────────────────────────────────────────

type Condition = { id: number; field: string; operator: string; value: string; logic: 'AND' | 'OR' };
type RuleAction = { id: number; type: string; config: Record<string, string> };

function RuleBuilderSheet({
  open,
  rule,
  onClose,
}: {
  open: boolean;
  rule: AutomationRule | null;
  onClose: () => void;
}) {
  const isNew    = rule === null;
  const isLocked = rule?.locked ?? false;
  const [rbName,        setRbName]        = useState(rule?.name ?? '');
  const [rbDesc,        setRbDesc]        = useState('');
  const [rbTrigger,     setRbTrigger]     = useState('Status Change');
  const [rbConditions,  setRbConditions]  = useState<Condition[]>([]);
  const [rbActions,     setRbActions]     = useState<RuleAction[]>([]);
  const [rbRateLimit,   setRbRateLimit]   = useState('1');
  const [rbPeriod,      setRbPeriod]      = useState('day');
  const [rbIdempotency, setRbIdempotency] = useState('');
  const [rbEnabled,     setRbEnabled]     = useState(true);
  const nextId = useRef(1);

  function addCondition() {
    setRbConditions(c => [...c, { id: nextId.current++, field: '', operator: '=', value: '', logic: 'AND' }]);
  }
  function removeCondition(id: number) {
    setRbConditions(c => c.filter(x => x.id !== id));
  }
  function updateCondition(id: number, patch: Partial<Condition>) {
    setRbConditions(c => c.map(x => x.id === id ? { ...x, ...patch } : x));
  }
  function addAction() {
    setRbActions(a => [...a, { id: nextId.current++, type: 'Send Message', config: {} }]);
  }
  function removeAction(id: number) {
    setRbActions(a => a.filter(x => x.id !== id));
  }
  function updateAction(id: number, patch: Partial<RuleAction>) {
    setRbActions(a => a.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  const triggerLabels = ['Status Change', 'Time-based Absolute', 'Time-based Relative', 'Threshold Breach', 'Form Submission', 'Manual', 'Recurring Schedule'];
  const triggerIcons  = [RefreshCw, Calendar, Clock, AlertTriangle, ClipboardList, MousePointer, Repeat];

  const sectionNum = (n: number) => (
    <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</div>
  );

  return (
    <Sheet open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <SheetContent side="right" style={{ maxWidth: 720 }} className="overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="text-slate-900 text-base font-semibold mr-auto">
              {isNew ? 'New Rule' : rule.name}
            </SheetTitle>
            {rule && ruleStatusBadge(rule.status)}
          </div>
          {isLocked && (
            <div className="flex items-center gap-2 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="text-xs text-amber-700 font-medium">System-locked — read only</span>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* ① Name & Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {sectionNum(1)}
              <span className="text-sm font-semibold text-slate-700">Name &amp; Description</span>
            </div>
            <input
              disabled={isLocked}
              type="text"
              value={rbName}
              onChange={e => setRbName(e.target.value)}
              placeholder="Rule name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50"
            />
            <textarea
              disabled={isLocked}
              value={rbDesc}
              onChange={e => setRbDesc(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none disabled:opacity-50"
            />
          </div>

          {/* ② Trigger */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {sectionNum(2)}
              <span className="text-sm font-semibold text-slate-700">Trigger</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {triggerLabels.map((label, i) => {
                const Icon = triggerIcons[i];
                const isSelected = rbTrigger === label;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setRbTrigger(label)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all cursor-pointer',
                      isSelected
                        ? 'bg-amber-50 border-amber-400 text-amber-800 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-amber-200',
                      isLocked && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </button>
                );
              })}
            </div>
            {/* Trigger config hint */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-500">
              {rbTrigger === 'Status Change' && 'Entity → Field → changes to → Value'}
              {rbTrigger === 'Time-based Absolute' && 'Select a specific date and time for the trigger.'}
              {rbTrigger === 'Time-based Relative' && 'Offset (days/hours) before/after an anchor field.'}
              {rbTrigger === 'Threshold Breach' && 'Field → operator ( > < = ≥ ≤ ) → Value'}
              {rbTrigger === 'Form Submission' && 'Select the form that triggers this rule.'}
              {rbTrigger === 'Manual' && 'No configuration required — triggered manually.'}
              {rbTrigger === 'Recurring Schedule' && 'Frequency (Daily / Weekly / Monthly) + time.'}
            </div>
          </div>

          {/* ③ Conditions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {sectionNum(3)}
              <span className="text-sm font-semibold text-slate-700">Conditions <span className="font-normal text-slate-400">(optional)</span></span>
            </div>
            {rbConditions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No conditions — rule fires on all matching trigger events.</p>
            ) : (
              <div className="space-y-2">
                {rbConditions.map((cond, idx) => (
                  <div key={cond.id} className="flex items-center gap-2 flex-wrap">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => updateCondition(cond.id, { logic: cond.logic === 'AND' ? 'OR' : 'AND' })}
                        className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 cursor-pointer"
                      >
                        {cond.logic}
                      </button>
                    )}
                    <input
                      type="text"
                      value={cond.field}
                      onChange={e => updateCondition(cond.id, { field: e.target.value })}
                      placeholder="Field"
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    />
                    <select
                      value={cond.operator}
                      onChange={e => updateCondition(cond.id, { operator: e.target.value })}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                    >
                      {['=', '!=', '>', '<', '>=', '<='].map(op => <option key={op}>{op}</option>)}
                    </select>
                    <input
                      type="text"
                      value={cond.value}
                      onChange={e => updateCondition(cond.id, { value: e.target.value })}
                      placeholder="Value"
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeCondition(cond.id)}
                      className="text-red-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {!isLocked && (
              <button
                type="button"
                onClick={addCondition}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
              >
                + Add Condition
              </button>
            )}
          </div>

          {/* ④ Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {sectionNum(4)}
              <span className="text-sm font-semibold text-slate-700">Actions</span>
            </div>
            {rbActions.map(action => (
              <div key={action.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-start gap-3">
                <select
                  value={action.type}
                  onChange={e => updateAction(action.id, { type: e.target.value, config: {} })}
                  disabled={isLocked}
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-44 focus:outline-none focus:ring-1 focus:ring-amber-300 disabled:opacity-50"
                >
                  {['Send Message', 'Create Task', 'Update Field', 'Assign Owner', 'Create Concern'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <div className="flex-1 flex gap-2 flex-wrap">
                  {action.type === 'Send Message' && (
                    <select
                      value={action.config.template ?? ''}
                      onChange={e => updateAction(action.id, { config: { template: e.target.value } })}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs flex-1 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    >
                      <option value="">Select template…</option>
                      {automationTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                  {action.type === 'Create Task' && (
                    <>
                      <input
                        type="text"
                        placeholder="Task title"
                        value={action.config.title ?? ''}
                        onChange={e => updateAction(action.id, { config: { ...action.config, title: e.target.value } })}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-amber-300"
                      />
                      <select
                        value={action.config.priority ?? 'Medium'}
                        onChange={e => updateAction(action.id, { config: { ...action.config, priority: e.target.value } })}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                      >
                        {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </>
                  )}
                  {action.type === 'Update Field' && (
                    <>
                      <input
                        type="text"
                        placeholder="Field"
                        value={action.config.field ?? ''}
                        onChange={e => updateAction(action.id, { config: { ...action.config, field: e.target.value } })}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-300"
                      />
                      <input
                        type="text"
                        placeholder="New value"
                        value={action.config.value ?? ''}
                        onChange={e => updateAction(action.id, { config: { ...action.config, value: e.target.value } })}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-300"
                      />
                    </>
                  )}
                  {action.type === 'Assign Owner' && (
                    <input
                      type="text"
                      placeholder="Assignee"
                      value={action.config.assignee ?? ''}
                      onChange={e => updateAction(action.id, { config: { assignee: e.target.value } })}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs flex-1 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    />
                  )}
                  {action.type === 'Create Concern' && (
                    <select
                      value={action.config.level ?? 'L1'}
                      onChange={e => updateAction(action.id, { config: { ...action.config, level: e.target.value } })}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                    >
                      {['L1', 'L2', 'L3'].map(l => <option key={l}>{l}</option>)}
                    </select>
                  )}
                </div>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => removeAction(action.id)}
                    className="text-red-400 hover:text-red-600 cursor-pointer mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {!isLocked && (
              <button
                type="button"
                onClick={addAction}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
              >
                + Add Action
              </button>
            )}
          </div>

          {/* ⑤ Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {sectionNum(5)}
              <span className="text-sm font-semibold text-slate-700">Settings</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-slate-600 font-medium w-24">Rate limit</label>
                <input
                  type="number"
                  min={1}
                  value={rbRateLimit}
                  onChange={e => setRbRateLimit(e.target.value)}
                  disabled={isLocked}
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-16 focus:outline-none focus:ring-1 focus:ring-amber-300 disabled:opacity-50"
                />
                <span className="text-xs text-slate-500">executions per</span>
                <select
                  value={rbPeriod}
                  onChange={e => setRbPeriod(e.target.value)}
                  disabled={isLocked}
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300 disabled:opacity-50"
                >
                  {['hour', 'day', 'week'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 font-medium w-24">Idempotency key</label>
                <input
                  type="text"
                  value={rbIdempotency}
                  onChange={e => setRbIdempotency(e.target.value)}
                  disabled={isLocked}
                  placeholder="e.g. student_id+session_id"
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs flex-1 focus:outline-none focus:ring-1 focus:ring-amber-300 disabled:opacity-50"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 font-medium w-24">Enabled</label>
                <ToggleSwitch enabled={rbEnabled} onChange={setRbEnabled} disabled={isLocked} />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-slate-100 flex-row gap-2">
          {isLocked ? (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Save Rule
              </button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Templates Tab ────────────────────────────────────────────────────────────

function TemplatesTab() {
  const { can } = usePermission();
  const [search,   setSearch]   = useState('');
  const [typeF,    setTypeF]    = useState('All');
  const [statusF,  setStatusF]  = useState('All');
  const [ownerF,   setOwnerF]   = useState('All');
  const [preview,  setPreview]  = useState<AutomationTemplate | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTpl,  setEditTpl]  = useState<AutomationTemplate | null>(null);

  const filtered = useMemo(() => automationTemplates.filter(t => {
    if (search  && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.body.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeF   !== 'All' && t.type   !== typeF)   return false;
    if (statusF !== 'All' && t.status !== statusF) return false;
    if (ownerF  !== 'All' && t.owner  !== ownerF)  return false;
    return true;
  }), [search, typeF, statusF, ownerF]);

  function openEdit(tpl: AutomationTemplate | null) {
    setEditTpl(tpl);
    setEditOpen(true);
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <FilterSelect value={typeF} onChange={setTypeF} options={[
          { label: 'All Types', value: 'All' },
          { label: 'Message',   value: 'Message'      },
          { label: 'Email',     value: 'Email'        },
          { label: 'Task',      value: 'Task'         },
          { label: 'Announcement', value: 'Announcement' },
        ]} />
        <FilterSelect value={statusF} onChange={setStatusF} options={[
          { label: 'All Status', value: 'All'      },
          { label: 'Active',     value: 'Active'   },
          { label: 'Draft',      value: 'Draft'    },
          { label: 'Archived',   value: 'Archived' },
        ]} />
        <FilterSelect value={ownerF} onChange={setOwnerF} options={[
          { label: 'All Owners', value: 'All'       },
          { label: 'Org-Wide',   value: 'Org-Wide'  },
          { label: 'Personal',   value: 'Personal'  },
        ]} />
        {can('automations.createRule') && (
        <div className="ml-auto">
          <button
            onClick={() => openEdit(null)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates found"
          description="Try adjusting your filters or create a new template."
          action={{ label: 'New Template', onClick: () => openEdit(null) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map(tpl => (
            <div key={tpl.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col shadow-sm">
              {/* Top row */}
              <div className="flex items-center justify-between">
                {typeBadge(tpl.type)}
                {templateStatusBadge(tpl.status)}
              </div>
              {/* Name */}
              <div className="flex items-center gap-1.5 mt-2">
                {tpl.locked && <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                <p className="font-semibold text-slate-900 text-sm leading-snug">{tpl.name}</p>
              </div>
              {/* Preview */}
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tpl.body.slice(0, 80)}</p>
              {/* Merge field chips */}
              <div className="flex flex-wrap gap-1 mt-2">
                {tpl.mergeFields.map(f => (
                  <span key={f} className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 text-xs font-mono">[{f}]</span>
                ))}
              </div>
              {/* Bottom row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-xs font-medium', tpl.owner === 'Org-Wide' ? 'text-blue-600' : 'text-slate-500')}>
                    {tpl.owner}
                  </span>
                  <span className="text-xs text-slate-400">· v{tpl.version}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    aria-label="Preview template"
                    onClick={() => setPreview(tpl)}
                    className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {can('automations.editRule') && (
                  <button
                    aria-label="Edit template"
                    disabled={tpl.locked}
                    onClick={() => openEdit(tpl)}
                    className={cn(
                      'w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer',
                      tpl.locked && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  )}
                  <button
                    aria-label="Duplicate template"
                    className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplatePreviewSheet
        template={preview}
        onClose={() => setPreview(null)}
        onEdit={tpl => { setPreview(null); openEdit(tpl); }}
      />
      <TemplateEditSheet
        open={editOpen}
        template={editTpl}
        onClose={() => { setEditOpen(false); setEditTpl(null); }}
      />
    </>
  );
}

// ─── Rules Tab ────────────────────────────────────────────────────────────────

function RulesTab() {
  const { can } = usePermission();
  const [search,      setSearch]      = useState('');
  const [statusF,     setStatusF]     = useState('All');
  const [triggerSel,  setTriggerSel]  = useState<string[]>([]);
  const [moduleSel,   setModuleSel]   = useState<string[]>([]);
  const [ruleOpen,    setRuleOpen]    = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const { sortField, sortDir, toggleSort, sortData } = useSortState('name');

  const TRIGGER_OPTIONS = ['Status Change', 'Time-based', 'Threshold', 'Form Submission', 'Manual'];
  const MODULE_OPTIONS  = ['M02', 'M03', 'M04', 'M05', 'M07', 'M08', 'M09', 'M12'];

  const filtered = useMemo(() => {
    const base = automationRules.filter(r => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusF !== 'All' && r.status !== statusF) return false;
      if (triggerSel.length > 0 && !triggerSel.includes(r.triggerType)) return false;
      if (moduleSel.length  > 0 && !moduleSel.includes(r.module))       return false;
      return true;
    });
    return sortData(base as unknown as Record<string, unknown>[]) as unknown as AutomationRule[];
  }, [search, statusF, triggerSel, moduleSel, sortField, sortDir, sortData]);

  function openBuilder(rule: AutomationRule | null) {
    setSelectedRule(rule);
    setRuleOpen(true);
  }

  const statusPills = ['All', 'Enabled', 'Disabled', 'Locked'] as const;

  return (
    <>
      {/* Mini stat row */}
      <div className="flex gap-3 mb-4">
        {[
          { label: 'Enabled',       value: 16, color: 'text-green-600 bg-green-50' },
          { label: 'Disabled',      value: 5,  color: 'text-slate-600 bg-slate-100' },
          { label: 'System-Locked', value: 8,  color: 'text-amber-600 bg-amber-50', icon: true },
        ].map(s => (
          <div key={s.label} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white shadow-sm text-sm font-medium')}>
            {s.icon && <Lock className="w-3.5 h-3.5 text-amber-500" />}
            <span className="text-slate-500">{s.label}:</span>
            <span className={cn('font-bold px-1.5 py-0.5 rounded text-sm', s.color)}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rules…"
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        {/* Status pill toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {statusPills.map(pill => (
            <button
              key={pill}
              type="button"
              onClick={() => setStatusF(pill)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                statusF === pill
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {pill}
            </button>
          ))}
        </div>
        <MultiSelectFilter label="Trigger" options={TRIGGER_OPTIONS} selected={triggerSel} onChange={setTriggerSel} />
        <MultiSelectFilter label="Module"  options={MODULE_OPTIONS}  selected={moduleSel}  onChange={setModuleSel}  />
        {can('automations.createRule') && (
        <div className="ml-auto">
          <button
            onClick={() => openBuilder(null)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Rule
          </button>
        </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No rules found"
            description="Try adjusting your filters or create a new automation rule."
            action={{ label: 'New Rule', onClick: () => openBuilder(null) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <SortableHeader label="Rule Name"  field="name"        sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Trigger"    field="triggerType" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Module"     field="module"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Status"     field="status"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Last Fired" field="lastFired"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Fires"      field="fireCount"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="right" />
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(rule => (
                  <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openBuilder(rule)}
                        className="flex items-center gap-1.5 text-left cursor-pointer hover:text-amber-700 transition-colors"
                      >
                        {rule.locked && <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                        <span className="font-semibold text-slate-800">{rule.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">{triggerBadge(rule.triggerType)}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded">{rule.module}</span>
                    </td>
                    <td className="px-4 py-3">{ruleStatusBadge(rule.status)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{rule.lastFired}</td>
                    <td className="px-4 py-3 text-right text-slate-700 font-medium tabular-nums">{rule.fireCount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <ToggleSwitch
                          enabled={rule.status === 'Enabled'}
                          onChange={() => {}}
                          disabled={rule.locked || !can('automations.toggleRule')}
                        />
                        {can('automations.editRule') && (
                        <button
                          type="button"
                          disabled={rule.locked}
                          onClick={() => openBuilder(rule)}
                          className={cn(
                            'px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer',
                            rule.locked && 'opacity-40 cursor-not-allowed'
                          )}
                        >
                          Edit
                        </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openBuilder(rule)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          View Log
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RuleBuilderSheet
        open={ruleOpen}
        rule={selectedRule}
        onClose={() => { setRuleOpen(false); setSelectedRule(null); }}
      />
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function AutomationsPageContent() {
  const { can } = usePermission();
  const searchParams = useSearchParams();
  const initialTab = useMemo<Tab>(() => {
    const raw = searchParams.get('tab');
    return (raw && (TABS as readonly string[]).includes(raw)) ? (raw as Tab) : 'Templates';
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  if (!can('automations.view')) return <AccessDenied />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Automation rules, templates, and communications</p>
        </div>
        {can('automations.createRule') && (
        <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer flex-shrink-0">
          <Plus className="w-4 h-4" />
          New Rule
        </button>
        )}
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Rules"       value={24} color="green" />
        <StatCard label="Triggered Today"    value={47} color="blue"  />
        <StatCard label="Pending in Queue"   value={12} color="amber" />
        <StatCard label="System-Locked"      value={8}  color="slate" />
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-0 border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer -mb-px',
              activeTab === tab
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Templates'        && <TemplatesTab />}
      {activeTab === 'Rules'            && <RulesTab />}
      {activeTab === 'Trigger Library'  && <TriggerLibraryTab />}
      {activeTab === 'Dispatch Queue'   && <DispatchQueueTab />}
      {activeTab === 'Internal Messages'&& <InternalMessagesTab />}
      {activeTab === 'Marketing'        && <MarketingTab />}
      {activeTab === 'Execution Log'    && <ExecutionLogTab />}
    </div>
  );
}

export default function AutomationsPage() {
  return (
    <Suspense>
      <AutomationsPageContent />
    </Suspense>
  );
}
