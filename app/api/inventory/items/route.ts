import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID, BRANCH_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function computeHealth(current: number, min: number): 'healthy' | 'approaching' | 'below' {
  if (current <= min) return 'below'
  if (current <= Math.floor(min * 1.5)) return 'approaching'
  return 'healthy'
}

function toItem(row: Record<string, unknown>) {
  const supplierRow = row.suppliers as Record<string, unknown> | null
  const current = row.current_stock as number
  const min = row.min_stock as number
  return {
    id:                row.id,
    name:              row.name,
    category:          row.category ?? '',
    unit:              row.unit ?? 'unit',
    currentStock:      current,
    minStock:          min,
    maxStock:          row.max_stock ?? null,
    reorderQty:        row.reorder_qty ?? 0,
    autoDeduct:        row.auto_deduct_on_enrol ?? false,
    departmentScope:   row.department_scope ?? '',
    enrolTrigger:      row.enrol_trigger_condition ?? null,
    supplier:          supplierRow?.name ?? '',
    supplierId:        row.supplier_id ?? null,
    amazonLink:        row.amazon_link ?? null,
    notes:             row.notes ?? '',
    health:            computeHealth(current, min),
    responsibleStaffId: row.responsible_staff_id ?? undefined,
    autoDeductRules:   [],
    recentLedger:      [],
  }
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, suppliers(name)')
    .eq('tenant_id', TENANT_ID)
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: (data ?? []).map(toItem) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()

  // Resolve supplier_id from name if provided as string
  let supplier_id: string | null = body.supplierId ?? null
  if (!supplier_id && body.supplier) {
    const { data: sup } = await supabase
      .from('suppliers')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('name', body.supplier)
      .maybeSingle()
    supplier_id = sup?.id ?? null
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      tenant_id:               TENANT_ID,
      branch_id:               BRANCH_ID,
      name:                    body.name,
      category:                body.category ?? null,
      unit:                    body.unit ?? 'unit',
      current_stock:           body.currentStock ?? 0,
      min_stock:               body.minStock ?? 0,
      max_stock:               body.maxStock ?? null,
      reorder_qty:             body.reorderQty ?? null,
      auto_deduct_on_enrol:    body.autoDeduct ?? false,
      department_scope:        body.departmentScope ?? null,
      enrol_trigger_condition: body.enrolTrigger ?? null,
      supplier_id,
      amazon_link:             body.amazonLink ?? null,
      notes:                   body.notes ?? null,
      responsible_staff_id:    body.responsibleStaffId ?? null,
    })
    .select('*, suppliers(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: toItem(data) }, { status: 201 })
}
