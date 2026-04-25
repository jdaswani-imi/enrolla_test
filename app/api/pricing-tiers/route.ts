import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('id, name, sessions_per_week_min, sessions_per_week_max, rate_per_session, created_at')
    .eq('tenant_id', TENANT_ID)
    .order('sessions_per_week_min')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    sessionsPerWeekMin: t.sessions_per_week_min,
    sessionsPerWeekMax: t.sessions_per_week_max ?? null,
    ratePerSession: Number(t.rate_per_session),
    createdAt: t.created_at,
  }))

  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { name, sessionsPerWeekMin, sessionsPerWeekMax, ratePerSession } = body

  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (sessionsPerWeekMin == null) return NextResponse.json({ error: 'sessionsPerWeekMin is required' }, { status: 400 })
  if (ratePerSession == null) return NextResponse.json({ error: 'ratePerSession is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('pricing_tiers')
    .insert({
      tenant_id: TENANT_ID,
      name: name.trim(),
      sessions_per_week_min: sessionsPerWeekMin,
      sessions_per_week_max: sessionsPerWeekMax ?? null,
      rate_per_session: ratePerSession,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
