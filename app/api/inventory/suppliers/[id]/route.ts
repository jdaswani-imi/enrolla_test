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
  if (body.name        !== undefined) updates.name    = body.name
  if (body.contactName !== undefined) updates.contact = body.contactName
  if (body.phone       !== undefined) updates.phone   = body.phone || null
  if (body.email       !== undefined) updates.email   = body.email || null
  if (body.notes       !== undefined) updates.notes   = body.notes || null

  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select('*, inventory_items!inventory_items_supplier_id_fkey(id)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Check no items still reference this supplier
  const { count } = await supabase
    .from('inventory_items')
    .select('id', { count: 'exact', head: true })
    .eq('supplier_id', id)
    .eq('is_active', true)

  if (count && count > 0) {
    return NextResponse.json(
      { error: 'Cannot delete supplier with active items' },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
