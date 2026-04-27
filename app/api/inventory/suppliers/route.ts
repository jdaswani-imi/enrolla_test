import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function toSupplier(row: Record<string, unknown>) {
  const items = row.inventory_items as unknown[]
  return {
    id:          row.id,
    name:        row.name,
    contactName: row.contact ?? '',
    phone:       row.phone ?? null,
    email:       row.email ?? null,
    notes:       row.notes ?? null,
    itemCount:   Array.isArray(items) ? items.length : 0,
  }
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { data, error } = await supabase
    .from('suppliers')
    .select('*, inventory_items!inventory_items_supplier_id_fkey(id)')
    .eq('tenant_id', TENANT_ID)
    .eq('is_active', true)
    .order('name', { ascending: true })

  // suppliers table not yet migrated — return empty rather than 500
  if (error) return NextResponse.json({ data: [] })

  return NextResponse.json({ data: (data ?? []).map(toSupplier) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      tenant_id: TENANT_ID,
      name:      body.name.trim(),
      contact:   body.contactName || null,
      phone:     body.phone || null,
      email:     body.email || null,
      notes:     body.notes || null,
    })
    .select('*, inventory_items!inventory_items_supplier_id_fkey(id)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: toSupplier(data) }, { status: 201 })
}
