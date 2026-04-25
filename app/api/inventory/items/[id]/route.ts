import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if (body.name             !== undefined) updates.name                    = body.name
  if (body.category         !== undefined) updates.category                = body.category
  if (body.unit             !== undefined) updates.unit                    = body.unit
  if (body.currentStock     !== undefined) updates.current_stock           = body.currentStock
  if (body.minStock         !== undefined) updates.min_stock               = body.minStock
  if (body.maxStock         !== undefined) updates.max_stock               = body.maxStock
  if (body.reorderQty       !== undefined) updates.reorder_qty             = body.reorderQty
  if (body.autoDeduct       !== undefined) updates.auto_deduct_on_enrol    = body.autoDeduct
  if (body.departmentScope  !== undefined) updates.department_scope        = body.departmentScope
  if (body.enrolTrigger     !== undefined) updates.enrol_trigger_condition = body.enrolTrigger
  if (body.supplierId       !== undefined) updates.supplier_id             = body.supplierId
  if (body.amazonLink       !== undefined) updates.amazon_link             = body.amazonLink
  if (body.notes            !== undefined) updates.notes                   = body.notes
  if (body.responsibleStaffId !== undefined) updates.responsible_staff_id  = body.responsibleStaffId
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select('*, suppliers(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error } = await supabase
    .from('inventory_items')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
