import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`
}

function toLedger(row: Record<string, unknown>) {
  const item = row.inventory_items as Record<string, unknown> | null
  return {
    id:           row.id,
    itemName:     item?.name ?? 'Unknown',
    category:     item?.category ?? '',
    changeType:   (row.change_type ?? 'manual_add') as string,
    quantityChange: row.quantity,
    stockBefore:  row.stock_before ?? undefined,
    stockAfter:   row.stock_after,
    actor:        row.actor_name ?? '',
    reference:    row.notes ?? undefined,
    timestamp:    formatTimestamp(row.created_at as string),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page       = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize   = parseInt(searchParams.get('pageSize') ?? '10', 10)
  const changeType = searchParams.get('changeType')
  const itemId     = searchParams.get('itemId')
  const from       = searchParams.get('from')
  const to         = searchParams.get('to')

  const offset = (page - 1) * pageSize

  let query = supabase
    .from('stock_adjustments')
    .select('*, inventory_items!stock_adjustments_inventory_item_id_fkey(name, category)', { count: 'exact' })
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (changeType && changeType !== 'All') query = query.eq('change_type', changeType)
  if (itemId)     query = query.eq('inventory_item_id', itemId)
  if (from)       query = query.gte('created_at', from)
  if (to)         query = query.lte('created_at', to)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data:  (data ?? []).map(toLedger),
    total: count ?? 0,
  })
}
