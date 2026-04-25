import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function toAlert(row: Record<string, unknown>) {
  return {
    id:                 row.id,
    inventoryItemId:    row.inventory_item_id,
    itemName:           row.item_name,
    category:           row.category ?? '',
    currentStock:       row.current_stock,
    minStock:           row.min_stock,
    reorderQty:         row.reorder_qty,
    supplierName:       row.supplier_name ?? '',
    supplierPhone:      row.supplier_phone ?? null,
    supplierEmail:      row.supplier_email ?? null,
    amazonLink:         row.amazon_link ?? null,
    status:             row.status,
    openedAt:           row.opened_at,
    responsibleStaffId: row.responsible_staff_id ?? undefined,
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from('reorder_alerts')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('opened_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: (data ?? []).map(toAlert) })
}
