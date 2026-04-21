'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Plus, Search, ClipboardList, Package, ChevronDown, ChevronRight,
  Zap, ExternalLink, Trash2, X, AlertTriangle,
  Phone, Mail, Copy, Pencil, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  inventoryItems, inventorySuppliers, reorderAlerts, stockLedgerEntries,
  currentUser,
  type InventoryItem, type AutoDeductRule, type LedgerEntry,
  type ReorderAlert, type StockLedgerEntry, type InventorySupplier,
} from '@/lib/mock-data';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { SortableHeader, useSortState } from '@/components/ui/sortable-header';
import { usePermission } from '@/lib/use-permission';
import { DateRangePicker, DATE_PRESETS, type DateRange } from '@/components/ui/date-range-picker';
import { PaginationBar } from '@/components/ui/pagination-bar';

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABS = ['Catalogue', 'Reorder Alerts', 'Stock Ledger', 'Suppliers'] as const;
type Tab = typeof TABS[number];

const ALL_CATEGORIES = [
  'Folders & Files', 'Plastic Folders', 'Stickers & Labels', 'Lanyards',
  'Bags', 'Writing Instruments', 'Erasers & Correction', 'Paper Products',
  'Cleaning & Hygiene', 'Filing & Organisation', 'Printing & Lamination',
  'Electronics & Tech', 'Arts & Crafts', 'Branded Materials', 'Health & Safety',
  'Miscellaneous',
];

const ALL_DEPARTMENTS = ['Primary', 'Lower Secondary', 'All'];

const YEAR_GROUPS = ['KG1','KG2','Y1','Y2','Y3','Y4','Y5','Y6','Y7','Y8','Y9'];

const CHANGE_TYPE_LABELS: Record<LedgerEntry['changeType'], string> = {
  auto_deduct:          'Auto deduct',
  manual_add:           'Stock added',
  reorder_received:     'Reorder received',
  manual_deduct:        'Manual deduct',
  waste:                'Waste',
  stock_take_correction:'Stock-take',
};

const CHANGE_TYPE_COLORS: Record<LedgerEntry['changeType'], string> = {
  auto_deduct:          'bg-blue-100 text-blue-700',
  manual_add:           'bg-green-100 text-green-700',
  reorder_received:     'bg-green-100 text-green-700',
  manual_deduct:        'bg-amber-100 text-amber-700',
  waste:                'bg-red-100 text-red-700',
  stock_take_correction:'bg-slate-100 text-slate-600',
};

const LEDGER_TYPE_LABELS: Record<StockLedgerEntry['changeType'], string> = {
  auto_deduct:          'Auto deduct',
  manual_add:           'Stock added',
  reorder_received:     'Reorder received',
  manual_deduct:        'Manual deduct',
  waste:                'Waste',
  stock_take_correction:'Stock-take',
  auto_deduct_failed:   'Deduct failed',
};

const LEDGER_TYPE_COLORS: Record<StockLedgerEntry['changeType'], string> = {
  auto_deduct:          'bg-blue-100 text-blue-700',
  manual_add:           'bg-green-100 text-green-700',
  reorder_received:     'bg-green-100 text-green-700',
  manual_deduct:        'bg-amber-100 text-amber-700',
  waste:                'bg-red-100 text-red-700',
  stock_take_correction:'bg-slate-100 text-slate-600',
  auto_deduct_failed:   'bg-red-100 text-red-700',
};

function parseTimestamp(ts: string): Date {
  return new Date(ts.replace(',', ''));
}

function isThisMonth(ts: string): boolean {
  const d = parseTimestamp(ts);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function healthStockColor(health: InventoryItem['health']) {
  if (health === 'below')      return 'text-red-600';
  if (health === 'approaching') return 'text-amber-600';
  return 'text-green-700';
}

function HealthBadge({ health, className }: { health: InventoryItem['health']; className?: string }) {
  const map = {
    below:      'bg-red-100 text-red-700',
    approaching:'bg-amber-100 text-amber-700',
    healthy:    'bg-green-100 text-green-700',
  };
  const label = { below: '⚠ Reorder', approaching: '↓ Low', healthy: '✓ OK' };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs w-fit', map[health], className)}>
      {label[health]}
    </span>
  );
}

function AutoDeductBadge({ active, className }: { active: boolean; className?: string }) {
  if (active) {
    return (
      <span className={cn('bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 w-fit', className)}>
        <Zap className="w-2.5 h-2.5" />Auto
      </span>
    );
  }
  return (
    <span className={cn('bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 text-xs w-fit', className)}>
      Manual
    </span>
  );
}

// ─── FilterSelect ──────────────────────────────────────────────────────────────

function FilterSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg pl-3 pr-8 py-1.5 cursor-pointer hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── ToggleSwitch ──────────────────────────────────────────────────────────────

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300',
        enabled ? 'bg-green-500' : 'bg-slate-200',
      )}
    >
      <span className={cn(
        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
        enabled ? 'translate-x-4' : 'translate-x-0.5',
      )} />
    </button>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string | number; color: 'slate' | 'red' | 'amber' | 'blue' }) {
  const valueColors = { slate: 'text-slate-900', red: 'text-red-600', amber: 'text-amber-600', blue: 'text-blue-600' };
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex-1 min-w-0">
      <div className={cn('text-2xl font-bold', valueColors[color])}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

// ─── AdjustStockSheet ──────────────────────────────────────────────────────────

function AdjustStockSheet({
  item,
  onClose,
}: {
  item: InventoryItem;
  onClose: () => void;
}) {
  const [adjustType, setAdjustType] = useState<'add' | 'remove' | 'stocktake'>('add');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');

  const newStock =
    adjustType === 'add'       ? item.currentStock + qty
    : adjustType === 'remove'  ? item.currentStock - qty
    : qty;

  function resultHealth(s: number): InventoryItem['health'] {
    if (s <= item.minStock) return 'below';
    if (s <= Math.floor(item.minStock * 1.5)) return 'approaching';
    return 'healthy';
  }

  const resultH = resultHealth(newStock);

  const typeCards: { key: 'add' | 'remove' | 'stocktake'; label: string; border: string; bg: string }[] = [
    { key: 'add',       label: '+ Add Stock',  border: 'border-green-400', bg: 'bg-green-50'  },
    { key: 'remove',    label: '− Remove Stock',border: 'border-amber-400', bg: 'bg-amber-50'  },
    { key: 'stocktake', label: 'Stock-take',    border: 'border-slate-400', bg: 'bg-slate-50'  },
  ];

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[560px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-semibold text-base">Adjust Stock</DialogTitle>
          <p className="text-sm text-slate-500">{item.name}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
          {/* Current stock */}
          <div className="text-center py-4">
            <div className={cn('text-5xl font-bold', healthStockColor(item.health))}>{item.currentStock}</div>
            <div className="text-sm text-slate-400 mt-1">{item.unit}</div>
          </div>

          {/* Adjustment type */}
          <div className="grid grid-cols-3 gap-3">
            {typeCards.map(card => (
              <button
                key={card.key}
                type="button"
                onClick={() => setAdjustType(card.key)}
                className={cn(
                  'rounded-xl p-3 text-center text-sm font-medium cursor-pointer border-2 transition-all duration-150',
                  adjustType === card.key ? `${card.border} ${card.bg}` : 'border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600',
                )}
              >
                {card.label}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Quantity</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="text-center text-2xl h-14 rounded-xl border border-slate-200 w-full focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Reason</label>
            {adjustType === 'add' ? (
              <input
                type="text"
                placeholder="e.g. Reorder received from Farook"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            ) : (
              <FilterSelect
                value={reason || 'Waste'}
                onChange={setReason}
                options={['Waste', 'Damaged', 'Transfer', 'Stock-take correction', 'Other']}
              />
            )}
          </div>

          {/* Reference */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Reference <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="text"
              placeholder="PO number or delivery note (optional)"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          {/* Preview */}
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-sm text-slate-600">
              Stock will change:{' '}
              <span className="font-semibold">{item.currentStock}</span>
              {' → '}
              <span className={cn('font-bold', healthStockColor(resultH))}>{newStock}</span>
            </p>
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2">
          <button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors cursor-pointer">
            Apply Adjustment
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors cursor-pointer">
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── StockTakeDialog ───────────────────────────────────────────────────────────

function computeHealth(stock: number, minStock: number): InventoryItem['health'] {
  if (stock <= minStock) return 'below';
  if (stock <= Math.floor(minStock * 1.5)) return 'approaching';
  return 'healthy';
}

function formatStockTakeDate(d: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatLedgerTimestamp(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatStockTakeDate(d)}, ${hh}:${mm}`;
}

function StockTakeDialog({ onClose }: { onClose: () => void }) {
  const [counted, setCounted] = useState<Record<string, string>>({});
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const today = useMemo(() => new Date(), []);
  const todayLabel = formatStockTakeDate(today);

  const presentCategories = useMemo(
    () => ALL_CATEGORIES.filter(c => inventoryItems.some(i => i.category === c)),
    [],
  );

  const visibleItems = useMemo(() => {
    const items = selectedCats.length
      ? inventoryItems.filter(i => selectedCats.includes(i.category))
      : inventoryItems;
    return [...items].sort((a, b) => {
      const ca = a.category.localeCompare(b.category);
      return ca !== 0 ? ca : a.name.localeCompare(b.name);
    });
  }, [selectedCats]);

  const itemsCounted = Object.values(counted).filter(v => v !== '' && v !== undefined).length;
  const totalItems = inventoryItems.length;
  const canComplete = itemsCounted >= 1;

  function toggleCategory(cat: string) {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  function fillAllWithSystem() {
    const next: Record<string, string> = {};
    for (const item of inventoryItems) next[item.id] = String(item.currentStock);
    setCounted(next);
  }

  function handleSaveProgress() {
    toast.success(`Progress saved — ${itemsCounted} of ${totalItems} items counted`);
  }

  function handleComplete() {
    let variances = 0;
    let checked = 0;
    for (const item of inventoryItems) {
      const raw = counted[item.id];
      if (raw === undefined || raw === '') continue;
      const countedQty = Math.max(0, parseInt(raw, 10));
      if (Number.isNaN(countedQty)) continue;
      checked += 1;
      if (countedQty !== item.currentStock) variances += 1;
      item.currentStock = countedQty;
      item.health = computeHealth(countedQty, item.minStock);
    }

    const now = new Date();
    stockLedgerEntries.unshift({
      id: `sl-stkt-${now.getTime()}`,
      itemName: 'Stock-take',
      category: 'Stock-take',
      changeType: 'stock_take_correction',
      quantityChange: 0,
      actor: currentUser.name,
      reference: `${checked} items checked, ${variances} variance${variances === 1 ? '' : 's'} found`,
      timestamp: formatLedgerTimestamp(now),
    });

    toast.success(`Stock-take completed — ${variances} variance${variances === 1 ? '' : 's'} recorded`);
    onClose();
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <DialogTitle className="font-semibold text-base">Stock-take</DialogTitle>
              <p className="text-sm text-slate-500 mt-0.5">{todayLabel}</p>
            </div>
            <button
              onClick={handleSaveProgress}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
            >
              Save progress
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
          {/* Category filter pills */}
          <div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCats([])}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors',
                  selectedCats.length === 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                All
              </button>
              {presentCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors',
                    selectedCats.includes(cat) ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Fill all shortcut */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <p className="text-xs text-slate-500">Tip: leave counted blank for items you didn&apos;t physically count.</p>
            <button
              onClick={fillAllWithSystem}
              className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer font-medium whitespace-nowrap"
            >
              Fill all with system quantities
            </button>
          </div>

          {/* Items table */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="text-left font-semibold px-3 py-2">Item</th>
                  <th className="text-left font-semibold px-3 py-2">Category</th>
                  <th className="text-right font-semibold px-3 py-2">System</th>
                  <th className="text-right font-semibold px-3 py-2">Counted</th>
                  <th className="text-right font-semibold px-3 py-2">Variance</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, idx) => {
                  const raw = counted[item.id] ?? '';
                  const hasValue = raw !== '';
                  const parsed = hasValue ? parseInt(raw, 10) : NaN;
                  const variance = hasValue && !Number.isNaN(parsed) ? parsed - item.currentStock : null;
                  const varianceColor =
                    variance === null || variance === 0 ? 'text-slate-400'
                    : variance > 0 ? 'text-green-600'
                    : 'text-red-600';
                  return (
                    <tr key={item.id} className={cn(idx > 0 && 'border-t border-slate-100')}>
                      <td className="px-3 py-2 text-slate-800">{item.name}</td>
                      <td className="px-3 py-2">
                        <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600 tabular-nums">{item.currentStock}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          value={raw}
                          onChange={e => {
                            const v = e.target.value;
                            setCounted(prev => {
                              const next = { ...prev };
                              if (v === '') delete next[item.id];
                              else next[item.id] = v;
                              return next;
                            });
                          }}
                          className="w-20 text-right tabular-nums border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                      </td>
                      <td className={cn('px-3 py-2 text-right tabular-nums font-medium', varianceColor)}>
                        {variance === null ? '—' : variance > 0 ? `+${variance}` : variance}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Items counted: <span className="font-semibold text-slate-700">{itemsCounted}</span> of {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={!canComplete}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                canComplete
                  ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed',
              )}
            >
              Complete stock-take
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ItemDetailSheet ───────────────────────────────────────────────────────────

function ItemDetailSheet({
  item,
  onClose,
}: {
  item: InventoryItem;
  onClose: () => void;
}) {
  const [sheetTab, setSheetTab] = useState<'Details' | 'Auto-Deduct Rules' | 'Stock History'>('Details');
  const [autoDeductEnabled, setAutoDeductEnabled] = useState(item.autoDeduct);
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleTrigger, setRuleTrigger] = useState('Enrolment Confirmed');
  const [ruleDepts, setRuleDepts] = useState<string[]>([]);
  const [ruleYears, setRuleYears] = useState<string[]>([]);
  const [ruleQty, setRuleQty] = useState(1);
  const [ruleCondition, setRuleCondition] = useState('First enrolment only');

  const supplierNames = inventorySuppliers.map(s => s.name);

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[560px] max-h-[80vh]">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="font-semibold text-lg leading-tight">{item.name}</DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <HealthBadge health={item.health} />
            <AutoDeductBadge active={item.autoDeduct} />
          </div>
        </DialogHeader>

        {/* Inner tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white flex-shrink-0">
          {(['Details', 'Auto-Deduct Rules', 'Stock History'] as const).map(t => (
            <button
              key={t}
              onClick={() => setSheetTab(t)}
              className={cn(
                'text-sm py-3 mr-5 border-b-2 transition-colors cursor-pointer whitespace-nowrap',
                sheetTab === t ? 'border-amber-500 text-amber-600 font-medium' : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {/* ── Details tab ── */}
          {sheetTab === 'Details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Category</label>
                  <FilterSelect value={item.category} onChange={() => {}} options={ALL_CATEGORIES} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Unit</label>
                  <input defaultValue={item.unit} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Supplier</label>
                  <FilterSelect value={item.supplier} onChange={() => {}} options={supplierNames} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Notes</label>
                  <textarea defaultValue={item.notes} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
                </div>
              </div>

              {/* Amazon link */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Amazon Link</label>
                <input
                  type="text"
                  defaultValue={item.amazonLink ?? ''}
                  placeholder="https://amazon.ae/..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                {item.amazonLink && (
                  <a
                    href={item.amazonLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-amber-600 hover:underline mt-1"
                  >
                    View on Amazon <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Stock thresholds */}
              <div className="bg-slate-50 rounded-lg p-4 mt-2">
                <p className="text-xs uppercase text-slate-400 tracking-wide mb-3 font-semibold">Stock Thresholds</p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Min Stock', defaultValue: item.minStock, helper: 'Triggers reorder alert' },
                    { label: 'Max Stock', defaultValue: item.maxStock, helper: 'Informational cap' },
                    { label: 'Reorder Qty', defaultValue: item.reorderQty, helper: 'Suggested order quantity' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">{f.label}</label>
                      <input
                        type="number"
                        defaultValue={f.defaultValue}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">{f.helper}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Auto-Deduct Rules tab ── */}
          {sheetTab === 'Auto-Deduct Rules' && (
            <div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-4">
                <span className="text-sm font-medium text-slate-900">Auto-deduct on enrolment</span>
                <ToggleSwitch enabled={autoDeductEnabled} onChange={setAutoDeductEnabled} />
              </div>

              {autoDeductEnabled && (
                <>
                  {item.autoDeductRules.map(rule => (
                    <RuleCard key={rule.id} rule={rule} />
                  ))}

                  {!showAddRule && (
                    <button
                      onClick={() => setShowAddRule(true)}
                      className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 mt-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />Add Rule
                    </button>
                  )}

                  {showAddRule && (
                    <div className="bg-slate-50 rounded-lg p-4 mt-2 border border-amber-200 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Trigger</label>
                        <FilterSelect
                          value={ruleTrigger}
                          onChange={setRuleTrigger}
                          options={['Enrolment Confirmed', '2nd Subject', 'Manual']}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Department</label>
                        <div className="flex flex-wrap gap-1.5">
                          {['Primary', 'Lower Secondary', 'All'].map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setRuleDepts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                              className={cn(
                                'px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors',
                                ruleDepts.includes(d) ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                              )}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Year Groups</label>
                        <div className="flex flex-wrap gap-1.5">
                          {YEAR_GROUPS.map(yg => (
                            <button
                              key={yg}
                              type="button"
                              onClick={() => setRuleYears(prev => prev.includes(yg) ? prev.filter(x => x !== yg) : [...prev, yg])}
                              className={cn(
                                'px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors',
                                ruleYears.includes(yg) ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                              )}
                            >
                              {yg}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Quantity</label>
                          <input
                            type="number"
                            min={1}
                            value={ruleQty}
                            onChange={e => setRuleQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-300"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Condition</label>
                          <FilterSelect
                            value={ruleCondition}
                            onChange={setRuleCondition}
                            options={['First enrolment only', 'Every enrolment']}
                          />
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-1">
                        <p className="text-xs text-amber-800">
                          Will deduct <strong>{ruleQty}</strong> × <strong>{item.name}</strong> when:{' '}
                          <em>{ruleCondition}</em> for{' '}
                          {ruleDepts.length ? ruleDepts.join(', ') : '—'}{' '}
                          ({ruleYears.length ? ruleYears.join(', ') : '—'})
                        </p>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg px-4 py-1.5 transition-colors cursor-pointer">
                          Save Rule
                        </button>
                        <button
                          onClick={() => setShowAddRule(false)}
                          className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!autoDeductEnabled && (
                <p className="text-sm text-slate-400 text-center py-8">Enable auto-deduct to configure rules.</p>
              )}
            </div>
          )}

          {/* ── Stock History tab ── */}
          {sheetTab === 'Stock History' && (
            <div>
              <div className="divide-y divide-slate-100">
                {item.recentLedger.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 py-2.5">
                    <span className={cn('text-xs rounded px-2 py-0.5 w-fit whitespace-nowrap', CHANGE_TYPE_COLORS[entry.changeType])}>
                      {CHANGE_TYPE_LABELS[entry.changeType]}
                    </span>
                    <span className={cn('font-mono text-sm font-medium', entry.quantityChange > 0 ? 'text-green-600' : 'text-red-600')}>
                      {entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange}
                    </span>
                    <span className="text-xs text-slate-500 truncate">{entry.actor}</span>
                    <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">{entry.timestamp}</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 text-sm text-amber-600 hover:underline cursor-pointer">
                View full ledger →
              </button>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center gap-2 flex-wrap">
          <button className="flex-1 min-w-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl px-5 py-2.5 transition-colors cursor-pointer">
            Save Changes
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors cursor-pointer">
            <Trash2 className="w-4 h-4" />Deactivate
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors cursor-pointer">
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RuleCard({ rule }: { rule: AutoDeductRule }) {
  const [active, setActive] = useState(rule.active);
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="bg-amber-100 text-amber-700 text-xs rounded px-2 py-0.5">{rule.trigger}</span>
        <span className="bg-slate-100 text-slate-600 text-xs rounded px-2 py-0.5">× {rule.quantity}</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-1">
        {rule.departments.map(d => (
          <span key={d} className="bg-blue-100 text-blue-700 text-xs rounded px-2 py-0.5">{d}</span>
        ))}
        {rule.yearGroups.map(yg => (
          <span key={yg} className="bg-slate-100 text-slate-600 text-xs rounded px-2 py-0.5">{yg}</span>
        ))}
      </div>
      <p className="text-xs text-slate-400 italic mb-1.5">{rule.condition}</p>
      <div className="flex justify-end">
        <ToggleSwitch enabled={active} onChange={setActive} />
      </div>
    </div>
  );
}

// ─── ReorderAlertsTab ─────────────────────────────────────────────────────────

function ReorderStatusBadge({ status }: { status: ReorderAlert['status'] }) {
  if (status === 'open')    return <span className="bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs">Open</span>;
  if (status === 'ordered') return <span className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-xs">Ordered</span>;
  return <span className="bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 text-xs">Ignored</span>;
}

function ReorderAlertsTab() {
  const [alerts, setAlerts] = useState<ReorderAlert[]>(reorderAlerts);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [receivedAlert, setReceivedAlert] = useState<ReorderAlert | null>(null);
  const [receivedQty, setReceivedQty] = useState(0);
  const [receivedNote, setReceivedNote] = useState('');
  const [toast, setToast] = useState('');

  const { sortField, sortDir, toggleSort, sortData } = useSortState(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }

  function markOrdered(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ordered' as const } : a));
    showToast('Marked as ordered — stock will update when received');
  }

  function markIgnored(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ignored' as const } : a));
  }

  function reopen(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'open' as const } : a));
  }

  function openReceived(alert: ReorderAlert) {
    setReceivedAlert(alert);
    setReceivedQty(alert.reorderQty);
    setReceivedNote('');
  }

  function confirmReceived() {
    if (!receivedAlert) return;
    setAlerts(prev => prev.filter(a => a.id !== receivedAlert.id));
    setReceivedAlert(null);
    showToast('Stock updated — reorder alert resolved');
  }

  const categories = Array.from(new Set(reorderAlerts.map(a => a.category)));

  const filtered = useMemo(() => {
    let items = alerts;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(a =>
        a.itemName.toLowerCase().includes(q) ||
        a.supplierName.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q),
      );
    }
    if (selectedCategories.length) items = items.filter(a => selectedCategories.includes(a.category));
    if (statusFilter !== 'All') items = items.filter(a => a.status === statusFilter.toLowerCase());
    return sortData(items as unknown as Record<string, unknown>[]) as unknown as ReorderAlert[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, search, selectedCategories, statusFilter, sortField, sortDir]);

  const openCount    = alerts.filter(a => a.status === 'open').length;
  const orderedCount = alerts.filter(a => a.status === 'ordered').length;
  const ignoredCount = alerts.filter(a => a.status === 'ignored').length;

  return (
    <div>
      {/* Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span className="text-sm text-amber-700">
          7 items are currently at or below their reorder point. Contact the supplier directly to place an order.
        </span>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4">
        <StatCard label="Open"    value={openCount}    color="red"   />
        <StatCard label="Ordered" value={orderedCount} color="amber" />
        <StatCard label="Ignored" value={ignoredCount} color="slate" />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-48 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-amber-400 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <MultiSelectFilter label="Category" options={categories} selected={selectedCategories} onChange={setSelectedCategories} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={['All', 'Open', 'Ordered', 'Ignored']} />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No alerts found" description="Try adjusting your filters." />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <SortableHeader label="Item"          field="itemName"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Category"      field="category"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Current Stock" field="currentStock" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                  <SortableHeader label="Reorder Point" field="minStock"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                  <SortableHeader label="Reorder Qty"   field="reorderQty"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                  <SortableHeader label="Supplier"      field="supplierName" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Status"        field="status"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(alert => (
                  <tr key={alert.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors" style={{ height: 56 }}>
                    <td className="px-4 py-2">
                      <span className="font-medium text-slate-900 text-sm">{alert.itemName}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs text-slate-500">{alert.category}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-red-600 font-bold text-sm">{alert.currentStock}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-slate-500 text-sm">{alert.minStock}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-slate-500 text-sm">{alert.reorderQty}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm text-slate-700">{alert.supplierName}</div>
                      {alert.supplierPhone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          <span className="text-xs text-slate-400">{alert.supplierPhone}</span>
                        </div>
                      )}
                      {alert.supplierEmail && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="w-2.5 h-2.5 text-slate-400" />
                          <span className="text-xs text-slate-400">{alert.supplierEmail}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <ReorderStatusBadge status={alert.status} />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {alert.status === 'open' && (
                          <>
                            <button
                              onClick={() => markOrdered(alert.id)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Mark Ordered
                            </button>
                            <button
                              onClick={() => markIgnored(alert.id)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Ignore
                            </button>
                          </>
                        )}
                        {alert.status === 'ordered' && (
                          <button
                            onClick={() => openReceived(alert)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Mark Received
                          </button>
                        )}
                        {alert.status === 'ignored' && (
                          <button
                            onClick={() => reopen(alert.id)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Reopen
                          </button>
                        )}
                        {alert.amazonLink && (
                          <a
                            href={alert.amazonLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:underline cursor-pointer"
                          >
                            Amazon <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mark Received Dialog */}
      {receivedAlert && (
        <Dialog open onOpenChange={open => !open && setReceivedAlert(null)}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-[560px] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="font-semibold text-base">Stock Received — {receivedAlert.itemName}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Quantity received:</label>
                <input
                  type="number"
                  min={1}
                  value={receivedQty}
                  onChange={e => setReceivedQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Delivery note / reference:{' '}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={receivedNote}
                  onChange={e => setReceivedNote(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            </div>
            <DialogFooter className="flex items-center gap-2">
              <button
                onClick={confirmReceived}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors cursor-pointer"
              >
                Update Stock
              </button>
              <button
                onClick={() => setReceivedAlert(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── StockLedgerTab ────────────────────────────────────────────────────────────

function StockLedgerTab() {
  const [search, setSearch] = useState('');
  const [selectedChangeTypes, setSelectedChangeTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { sortField, sortDir, toggleSort, sortData } = useSortState(null);

  const CHANGE_TYPE_OPTIONS = ['Auto Deduct', 'Stock Added', 'Reorder Received', 'Manual Deduct', 'Waste', 'Stock-take', 'Deduct Failed'];
  const changeTypeLookup: Record<string, StockLedgerEntry['changeType']> = {
    'Auto Deduct':      'auto_deduct',
    'Stock Added':      'manual_add',
    'Reorder Received': 'reorder_received',
    'Manual Deduct':    'manual_deduct',
    'Waste':            'waste',
    'Stock-take':       'stock_take_correction',
    'Deduct Failed':    'auto_deduct_failed',
  };

  const allItemNames = useMemo(() =>
    Array.from(new Set(stockLedgerEntries.map(e => e.itemName))).sort(),
  []);

  const filtered = useMemo(() => {
    let entries = stockLedgerEntries;
    if (search.trim()) {
      const q = search.toLowerCase();
      entries = entries.filter(e =>
        e.itemName.toLowerCase().includes(q) || e.actor.toLowerCase().includes(q),
      );
    }
    if (selectedChangeTypes.length) {
      const types = selectedChangeTypes.map(t => changeTypeLookup[t]);
      entries = entries.filter(e => types.includes(e.changeType));
    }
    if (dateRange.from || dateRange.to) {
      entries = entries.filter(e => {
        const d = parseTimestamp(e.timestamp);
        if (dateRange.from && d < dateRange.from) return false;
        if (dateRange.to && d > dateRange.to) return false;
        return true;
      });
    }
    if (selectedItems.length) entries = entries.filter(e => selectedItems.includes(e.itemName));
    return sortData(entries as unknown as Record<string, unknown>[]) as unknown as StockLedgerEntry[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedChangeTypes, dateRange, selectedItems, sortField, sortDir]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalEntries        = stockLedgerEntries.length;
  const autoDeductThisMonth = stockLedgerEntries.filter(e => e.changeType === 'auto_deduct' && isThisMonth(e.timestamp)).length;
  const manualAdjustments   = stockLedgerEntries.filter(e =>
    ['manual_add', 'manual_deduct', 'waste', 'stock_take_correction'].includes(e.changeType),
  ).length;

  return (
    <div>
      {/* Subtitle bar */}
      <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-200 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="text-sm text-slate-600">
          Complete audit trail of all stock movements. Entries cannot be edited or deleted.
        </span>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4">
        <StatCard label="Total Entries"               value={totalEntries}        color="slate" />
        <StatCard label="Auto-Deductions This Month"  value={autoDeductThisMonth} color="blue"  />
        <StatCard label="Manual Adjustments"          value={manualAdjustments}   color="amber" />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-48 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-amber-400 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by item or actor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <MultiSelectFilter label="Change Type" options={CHANGE_TYPE_OPTIONS} selected={selectedChangeTypes} onChange={v => { setSelectedChangeTypes(v); setPage(1); }} />
          <DateRangePicker value={dateRange} onChange={v => { setDateRange(v); setPage(1); }} presets={DATE_PRESETS} />
          <MultiSelectFilter label="Item" options={allItemNames} selected={selectedItems} onChange={v => { setSelectedItems(v); setPage(1); }} />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No entries found" description="Try adjusting your filters." />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <SortableHeader label="Timestamp"    field="timestamp"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Item"         field="itemName"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Category"     field="category"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Change Type"  field="changeType"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Qty Change"   field="quantityChange" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                  <SortableHeader label="Stock Before" field="stockBefore"    sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                  <SortableHeader label="Stock After"  field="stockAfter"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                  <SortableHeader label="Actor"        field="actor"          sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Reference"    field="reference"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {paginated.map(entry => {
                  const item = inventoryItems.find(i => i.name === entry.itemName);
                  const afterColor = entry.stockAfter !== undefined && item
                    ? entry.stockAfter <= item.minStock
                      ? 'text-red-600'
                      : entry.stockAfter <= Math.floor(item.minStock * 1.5)
                      ? 'text-amber-600'
                      : 'text-green-700'
                    : 'text-slate-700';
                  const isSystem = entry.actor.startsWith('System');
                  return (
                    <tr key={entry.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="text-sm text-slate-700">{entry.timestamp}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-slate-900 text-sm">{entry.itemName}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-slate-500">{entry.category}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn('text-xs rounded px-2 py-0.5 whitespace-nowrap', LEDGER_TYPE_COLORS[entry.changeType])}>
                          {LEDGER_TYPE_LABELS[entry.changeType]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn('font-mono font-medium text-sm',
                          entry.quantityChange > 0 ? 'text-green-600' :
                          entry.quantityChange < 0 ? 'text-red-600' : 'text-slate-400',
                        )}>
                          {entry.quantityChange > 0
                            ? `+${entry.quantityChange}`
                            : entry.quantityChange === 0
                            ? '0'
                            : `−${Math.abs(entry.quantityChange)}`}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-sm text-slate-500 font-mono">
                          {entry.stockBefore !== undefined ? entry.stockBefore : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn('text-sm font-mono font-medium', afterColor)}>
                          {entry.stockAfter !== undefined ? entry.stockAfter : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn('text-sm', isSystem ? 'text-slate-400 italic' : 'text-slate-600')}>
                          {entry.actor}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-slate-400">{entry.reference ?? '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationBar
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={size => { setPageSize(size); setPage(1); }}
          />
        </div>
      )}
    </div>
  );
}

// ─── SuppliersTab ──────────────────────────────────────────────────────────────

function SuppliersTab({ onSwitchToCatalogue }: { onSwitchToCatalogue: () => void }) {
  const [search, setSearch] = useState('');
  const [supplierSheet, setSupplierSheet] = useState<null | 'add' | InventorySupplier>(null);
  const [editForm, setEditForm] = useState({ name: '', contactName: '', phone: '', email: '', notes: '' });
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 1500);
  }

  function openAdd() {
    setEditForm({ name: '', contactName: '', phone: '', email: '', notes: '' });
    setSupplierSheet('add');
  }

  function openEdit(s: InventorySupplier) {
    setEditForm({ name: s.name, contactName: '', phone: s.phone ?? '', email: s.email ?? '', notes: s.notes ?? '' });
    setSupplierSheet(s);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    showToast('Copied!');
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return inventorySuppliers;
    const q = search.toLowerCase();
    return inventorySuppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)),
    );
  }, [search]);

  function getSupplierItems(supplierName: string) {
    return inventoryItems.filter(i => i.supplier === supplierName);
  }

  const isEdit = supplierSheet !== null && supplierSheet !== 'add';
  const editedSupplier = isEdit ? (supplierSheet as InventorySupplier) : null;
  const editedItems = editedSupplier ? getSupplierItems(editedSupplier.name) : [];

  const amazonSupplierCount = new Set(
    inventoryItems.filter(i => i.amazonLink).map(i => i.supplier),
  ).size;

  return (
    <div>
      {/* Stat row + Add button */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex gap-4 flex-1">
          <StatCard label="Total Suppliers"  value={inventorySuppliers.length} color="slate" />
          <StatCard label="Active Items"     value={113}                       color="blue"  />
          <StatCard label="Have Amazon Link" value={amazonSupplierCount}       color="amber" />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer flex-shrink-0 mt-1"
        >
          <Plus className="w-4 h-4" />Add Supplier
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-amber-400 focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No suppliers found" description="Try adjusting your search." />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {filtered.map(supplier => {
            const items = getSupplierItems(supplier.name);
            const preview = items.slice(0, 3);
            const extra = items.length - 3;
            return (
              <div key={supplier.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{supplier.name}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <Package className="w-2.5 h-2.5" />
                      {items.length || supplier.itemCount} items
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(supplier)}
                    aria-label={`Edit ${supplier.name}`}
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 -mr-1 -mt-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                {/* Contact */}
                <div className="mt-3 space-y-1.5">
                  {supplier.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-700 flex-1 truncate">{supplier.phone}</span>
                      <button
                        onClick={() => copyToClipboard(supplier.phone!)}
                        aria-label="Copy phone"
                        className="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer flex-shrink-0"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : null}
                  {supplier.email ? (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-700 flex-1 truncate">{supplier.email}</span>
                      <button
                        onClick={() => copyToClipboard(supplier.email!)}
                        aria-label="Copy email"
                        className="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer flex-shrink-0"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : null}
                  {!supplier.phone && !supplier.email && (
                    <p className="text-xs text-slate-300 italic">No contact info</p>
                  )}
                </div>

                {/* Notes */}
                {supplier.notes && (
                  <p className="mt-3 text-xs text-slate-400 italic line-clamp-2">{supplier.notes}</p>
                )}

                {/* Bottom row */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {preview.map(item => (
                      <span key={item.id} className="bg-slate-100 text-slate-600 text-[10px] rounded px-1.5 py-0.5 truncate max-w-[80px]">
                        {item.name.split(' — ')[0].split(' ').slice(0, 2).join(' ')}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="bg-slate-100 text-slate-600 text-[10px] rounded px-1.5 py-0.5">+{extra} more</span>
                    )}
                  </div>
                  <button
                    onClick={onSwitchToCatalogue}
                    className="text-xs text-amber-600 hover:underline whitespace-nowrap cursor-pointer flex-shrink-0"
                  >
                    View Items →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      {supplierSheet !== null && (
        <Dialog open onOpenChange={open => !open && setSupplierSheet(null)}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-[560px] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="font-semibold text-base">
                {isEdit ? 'Edit Supplier' : 'Add Supplier'}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
              {[
                { field: 'name',        label: 'Name',         required: true,  type: 'text' },
                { field: 'contactName', label: 'Contact Name', required: false, type: 'text' },
                { field: 'phone',       label: 'Phone',        required: false, type: 'text' },
                { field: 'email',       label: 'Email',        required: false, type: 'email' },
              ].map(({ field, label, required, type }) => (
                <div key={field}>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    {label}{' '}
                    {required
                      ? <span className="text-red-400">*</span>
                      : <span className="text-slate-400 font-normal">(optional)</span>
                    }
                  </label>
                  <input
                    type={type}
                    value={editForm[field as keyof typeof editForm]}
                    onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                />
              </div>
              {isEdit && editedItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Updating contact info here will update all {editedItems.length} items that reference this supplier.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex items-center gap-2 flex-wrap">
              <button className="flex-1 min-w-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors cursor-pointer">
                Save
              </button>
              {isEdit && editedItems.length === 0 && (
                <button className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap">
                  Remove Supplier
                </button>
              )}
              <button
                onClick={() => setSupplierSheet(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── CatalogueTab ──────────────────────────────────────────────────────────────

function CatalogueTab({
  onEdit,
  onAdjust,
}: {
  onEdit: (item: InventoryItem) => void;
  onAdjust: (item: InventoryItem) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [autoDeductFilter, setAutoDeductFilter] = useState('All');
  const [healthFilter, setHealthFilter] = useState('All');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    () => Object.fromEntries(ALL_CATEGORIES.map(c => [c, true])),
  );

  const { sortField, sortDir, toggleSort, sortData } = useSortState(null);

  const filtered = useMemo(() => {
    let items = inventoryItems;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.supplier.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q),
      );
    }
    if (selectedCategories.length) {
      items = items.filter(i => selectedCategories.includes(i.category));
    }
    if (selectedDepts.length) {
      items = items.filter(i =>
        selectedDepts.some(d => i.departmentScope.includes(d)),
      );
    }
    if (autoDeductFilter === 'Active') items = items.filter(i => i.autoDeduct);
    if (autoDeductFilter === 'Off')    items = items.filter(i => !i.autoDeduct);
    if (healthFilter === 'Healthy')           items = items.filter(i => i.health === 'healthy');
    if (healthFilter === 'Approaching')       items = items.filter(i => i.health === 'approaching');
    if (healthFilter === 'Below Reorder')     items = items.filter(i => i.health === 'below');
    return sortData(items as unknown as Record<string, unknown>[]) as unknown as InventoryItem[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategories, selectedDepts, autoDeductFilter, healthFilter, sortField, sortDir]);

  const grouped = useMemo(() => {
    const map: Record<string, InventoryItem[]> = {};
    for (const item of filtered) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [filtered]);

  const presentCategories = ALL_CATEGORIES.filter(c => grouped[c]?.length);

  function toggleCategory(cat: string) {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-48 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-amber-400 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <MultiSelectFilter
            label="Category"
            options={ALL_CATEGORIES}
            selected={selectedCategories}
            onChange={setSelectedCategories}
          />
          <MultiSelectFilter
            label="Department"
            options={ALL_DEPARTMENTS}
            selected={selectedDepts}
            onChange={setSelectedDepts}
          />
          <FilterSelect
            value={autoDeductFilter}
            onChange={setAutoDeductFilter}
            options={['All', 'Active', 'Off']}
          />
          <FilterSelect
            value={healthFilter}
            onChange={setHealthFilter}
            options={['All', 'Healthy', 'Approaching', 'Below Reorder']}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 pl-1">Showing {filtered.length} of 113 items</p>
      </div>

      {/* Category groups */}
      {presentCategories.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No items found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          {presentCategories.map((cat, ci) => {
            const items = grouped[cat]!;
            const isOpen = openCategories[cat] ?? true;
            return (
              <div key={cat} className={cn(ci > 0 && 'border-t border-slate-200')}>
                {/* Category header */}
                <div
                  className="bg-slate-50 border-y border-slate-200 px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleCategory(cat)}
                >
                  <div className="flex items-center gap-2">
                    {isOpen
                      ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform" />
                      : <ChevronRight className="w-3.5 h-3.5 text-slate-400 transition-transform" />
                    }
                    <span className="text-sm font-semibold text-slate-700">{cat}</span>
                    <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 ml-1">{items.length}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); }}
                    className="flex items-center gap-0.5 text-xs text-amber-600 hover:text-amber-700 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />Add Item
                  </button>
                </div>

                {/* Items table */}
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white border-b border-slate-100">
                          <SortableHeader label="Item Name"    field="name"           sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                          <SortableHeader label="Unit"         field="unit"           sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                          <SortableHeader label="Stock"        field="currentStock"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                          <SortableHeader label="Min"          field="minStock"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                          <SortableHeader label="Max"          field="maxStock"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                          <SortableHeader label="Auto-Deduct"  field="autoDeduct"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                          <SortableHeader label="Department"   field="departmentScope" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                          <SortableHeader label="Supplier"     field="supplier"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                          <SortableHeader label="Health"       field="health"         sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                            style={{ height: 48 }}
                            onClick={() => onEdit(item)}
                          >
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-slate-900">{item.name}</span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className="text-xs text-slate-500">{item.unit}</span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={cn('font-bold text-sm', healthStockColor(item.health))}>{item.currentStock}</span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className="text-xs text-slate-500">{item.minStock}</span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className="text-xs text-slate-500">{item.maxStock}</span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex justify-center">
                                <AutoDeductBadge active={item.autoDeduct} />
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-xs text-slate-500">{item.departmentScope}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-xs text-slate-500">{item.supplier.split(' ')[0]}</span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex justify-center">
                                <HealthBadge health={item.health} />
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div
                                className="flex items-center justify-end gap-1.5"
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => onEdit(item)}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => onAdjust(item)}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                >
                                  Adjust
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
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { can } = usePermission();
  const [activeTab, setActiveTab] = useState<Tab>('Catalogue');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [stockTakeOpen, setStockTakeOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-bold text-slate-900 text-2xl">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">113 items across 16 categories — IMI reference catalogue</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {can('stock.take') && (
            <button
              onClick={() => setStockTakeOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />Stock-take
            </button>
          )}
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors cursor-pointer">
            <Plus className="w-4 h-4" />Add Item
          </button>
        </div>
      </div>

      {/* Stat bar */}
      <div className="flex gap-4">
        <StatCard label="Total Items"          value={113} color="slate" />
        <StatCard label="Below Reorder Point"  value={7}   color="red"   />
        <StatCard label="Auto-Deduct Active"   value={34}  color="amber" />
        <StatCard label="Suppliers"            value={14}  color="blue"  />
      </div>

      {/* Tab strip */}
      <div className="flex border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'text-sm py-3 px-1 mr-6 border-b-2 transition-colors cursor-pointer font-medium whitespace-nowrap',
              activeTab === tab
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Catalogue' && (
        <CatalogueTab
          onEdit={item => setSelectedItem(item)}
          onAdjust={item => setAdjustItem(item)}
        />
      )}

      {activeTab === 'Reorder Alerts' && <ReorderAlertsTab />}

      {activeTab === 'Stock Ledger' && <StockLedgerTab />}

      {activeTab === 'Suppliers' && (
        <SuppliersTab onSwitchToCatalogue={() => setActiveTab('Catalogue')} />
      )}

      {/* Item detail sheet */}
      {selectedItem && (
        <ItemDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* Adjust stock sheet */}
      {adjustItem && (
        <AdjustStockSheet item={adjustItem} onClose={() => setAdjustItem(null)} />
      )}

      {/* Stock-take dialog */}
      {stockTakeOpen && (
        <StockTakeDialog onClose={() => setStockTakeOpen(false)} />
      )}
    </div>
  );
}
