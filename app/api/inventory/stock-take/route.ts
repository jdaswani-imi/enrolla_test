import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function computeHealth(current: number, min: number): 'healthy' | 'approaching' | 'below' {
  if (current <= min) return 'below'
  if (current <= Math.floor(min * 1.5)) return 'approaching'
  return 'healthy'
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { counts, actorName }: { counts: { itemId: string; counted: number }[]; actorName: string } = body

  if (!Array.isArray(counts) || counts.length === 0) {
    return NextResponse.json({ error: 'counts array required' }, { status: 400 })
  }

  const itemIds = counts.map(c => c.itemId)

  // Fetch all items being counted
  const { data: items, error: fetchErr } = await supabase
    .from('inventory_items')
    .select('*, suppliers(name)')
    .in('id', itemIds)
    .eq('tenant_id', TENANT_ID)

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const itemMap = new Map(
    (items ?? []).map(i => [i.id as string, i as Record<string, unknown>])
  )

  let checked = 0
  let variances = 0
  const adjustments: Record<string, unknown>[] = []
  const stockUpdates: { id: string; newStock: number; minStock: number }[] = []

  for (const { itemId, counted } of counts) {
    const item = itemMap.get(itemId)
    if (!item) continue

    const stockBefore = item.current_stock as number
    const newStock = Math.max(0, counted)
    checked++
    if (newStock !== stockBefore) variances++

    adjustments.push({
      tenant_id:         TENANT_ID,
      inventory_item_id: itemId,
      adjustment_type:   'Manual Adjustment',
      change_type:       'stock_take_correction',
      quantity:          Math.abs(newStock - stockBefore),
      stock_before:      stockBefore,
      stock_after:       newStock,
      notes:             'Stock-take',
      actor_name:        actorName ?? null,
    })

    stockUpdates.push({ id: itemId, newStock, minStock: item.min_stock as number })
  }

  // Insert all adjustment rows
  if (adjustments.length > 0) {
    const { error: adjErr } = await supabase
      .from('stock_adjustments')
      .insert(adjustments)
    if (adjErr) return NextResponse.json({ error: adjErr.message }, { status: 500 })
  }

  // Update each item's stock level
  await Promise.all(
    stockUpdates.map(({ id, newStock }) =>
      supabase
        .from('inventory_items')
        .update({ current_stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', id)
    )
  )

  // Sync reorder alerts based on new stock levels
  await Promise.all(
    stockUpdates.map(async ({ id, newStock, minStock }) => {
      if (newStock <= minStock) {
        const item = itemMap.get(id)!
        const supplierRow = item.suppliers as Record<string, unknown> | null
        const { data: existing } = await supabase
          .from('reorder_alerts')
          .select('id')
          .eq('tenant_id', TENANT_ID)
          .eq('inventory_item_id', id)
          .eq('status', 'open')
          .maybeSingle()

        if (!existing) {
          await supabase.from('reorder_alerts').insert({
            tenant_id:         TENANT_ID,
            inventory_item_id: id,
            item_name:         item.name,
            category:          item.category ?? null,
            current_stock:     newStock,
            min_stock:         minStock,
            reorder_qty:       item.reorder_qty ?? 0,
            supplier_name:     supplierRow?.name ?? null,
            amazon_link:       item.amazon_link ?? null,
            status:            'open',
          })
        } else {
          await supabase
            .from('reorder_alerts')
            .update({ current_stock: newStock })
            .eq('id', existing.id)
        }
      } else {
        await supabase
          .from('reorder_alerts')
          .update({ status: 'ignored' })
          .eq('tenant_id', TENANT_ID)
          .eq('inventory_item_id', id)
          .eq('status', 'open')
      }
    })
  )

  return NextResponse.json({ data: { checked, variances } })
}
