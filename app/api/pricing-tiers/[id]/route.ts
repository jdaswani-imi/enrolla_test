import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()

  // Rate changes are point-forward only — no invoice rows are ever touched
  const colMap: Record<string, string> = {
    name: 'name',
    sessionsPerWeekMin: 'sessions_per_week_min',
    sessionsPerWeekMax: 'sessions_per_week_max',
    ratePerSession: 'rate_per_session',
  }

  const updates: Record<string, unknown> = {}
  for (const [key, col] of Object.entries(colMap)) {
    if (body[key] !== undefined) updates[col] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('pricing_tiers')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
