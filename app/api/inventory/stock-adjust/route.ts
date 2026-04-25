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
  const { itemId, adjustType, qty, reason, reference, actorName } = body

  if (!itemId || !adjustType || qty == null) {
    return NextResponse.json({ error: 'itemId, adjustType, qty required' }, { status: 400 })
  }

  // Fetch current item
  const { data: item, error: fetchErr } = await supabase
    .from('inventory_items')
    .select('*, suppliers(name)')
    .eq('id', itemId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchErr || !item) {
    return NextResponse.json({ error: fetchErr?.message ?? 'Item not found' }, { status: 404 })
  }

  const stockBefore = item.current_stock as number
  let newStock: number
  let changeType: string
  let dbAdjustmentType: string

  if (adjustType === 'add') {
    newStock = stockBefore + qty
    changeType = 'manual_add'
    dbAdjustmentType = 'Receipt'
  } else if (adjustType === 'reorder_received') {
    newStock = stockBefore + qty
    changeType = 'reorder_received'
    dbAdjustmentType = 'Receipt'
  } else if (adjustType === 'remove') {
    newStock = Math.max(0, stockBefore - qty)
    changeType = reason === 'Waste' || reason === 'Damaged' ? 'waste' : 'manual_deduct'
    dbAdjustmentType = reason === 'Waste' || reason === 'Damaged' ? 'Write-off' : 'Deduction'
  } else if (adjustType === 'stocktake') {
    newStock = Math.max(0, qty)
    changeType = 'stock_take_correction'
    dbAdjustmentType = 'Manual Adjustment'
  } else {
    return NextResponse.json({ error: 'Invalid adjustType' }, { status: 400 })
  }

  // Insert adjustment record
  const { error: adjErr } = await supabase
    .from('stock_adjustments')
    .insert({
      tenant_id:        TENANT_ID,
      inventory_item_id: itemId,
      adjustment_type:  dbAdjustmentType,
      change_type:      changeType,
      quantity:         Math.abs(newStock - stockBefore) || qty,
      stock_before:     stockBefore,
      stock_after:      newStock,
      notes:            reference ? `${reason ?? ''}${reference ? ` — ${reference}` : ''}`.trim() : reason || null,
      actor_name:       actorName ?? null,
    })

  if (adjErr) return NextResponse.json({ error: adjErr.message }, { status: 500 })

  // Update item stock
  const { data: updated, error: updateErr } = await supabase
    .from('inventory_items')
    .update({
      current_stock: newStock,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', itemId)
    .select('*, suppliers(name)')
    .single()

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  const minStock = updated.min_stock as number

  // Auto-upsert reorder alert if stock dropped to/below min
  if (newStock <= minStock) {
    const supplierRow = updated.suppliers as Record<string, unknown> | null

    // Check if open alert already exists for this item
    const { data: existing } = await supabase
      .from('reorder_alerts')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('inventory_item_id', itemId)
      .eq('status', 'open')
      .maybeSingle()

    if (!existing) {
      await supabase.from('reorder_alerts').insert({
        tenant_id:         TENANT_ID,
        inventory_item_id: itemId,
        item_name:         updated.name,
        category:          updated.category ?? null,
        current_stock:     newStock,
        min_stock:         minStock,
        reorder_qty:       updated.reorder_qty ?? 0,
        supplier_name:     supplierRow?.name ?? null,
        amazon_link:       updated.amazon_link ?? null,
        status:            'open',
      })
    } else {
      // Update stock level on existing alert
      await supabase
        .from('reorder_alerts')
        .update({ current_stock: newStock })
        .eq('id', existing.id)
    }
  } else if (newStock > minStock) {
    // Resolve any open alert for this item if stock is now healthy
    await supabase
      .from('reorder_alerts')
      .update({ status: 'ignored' })
      .eq('tenant_id', TENANT_ID)
      .eq('inventory_item_id', itemId)
      .eq('status', 'open')
  }

  return NextResponse.json({
    data: {
      ...updated,
      health: computeHealth(newStock, minStock),
    },
  })
}
