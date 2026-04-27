import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PIPELINE_STAGES = [
  'New',
  'Contacted',
  'Assessment Booked',
  'Assessment Done',
  'Trial Booked',
  'Trial Done',
  'Schedule Offered',
  'Schedule Confirmed',
  'Invoice Sent',
  'Won',
  'Lost',
]

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, stage, days_in_stage, days_in_pipeline, created_at, converted_on')
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = leads ?? []
  const total = rows.length
  const won = rows.filter(l => l.stage === 'Won').length
  const lost = rows.filter(l => l.stage === 'Lost').length
  const active = total - won - lost

  // Count per stage
  const byStageCounts: Record<string, number> = {}
  for (const l of rows) {
    byStageCounts[l.stage] = (byStageCounts[l.stage] ?? 0) + 1
  }

  const byStage = PIPELINE_STAGES.map(stage => ({
    stage,
    count: byStageCounts[stage] ?? 0,
  }))

  // Conversion rate: Won / (Won + Lost) ignoring still-active
  const concluded = won + lost
  const conversionRate = concluded > 0 ? Math.round((won / concluded) * 100) : 0

  // Average days in pipeline for won leads
  const wonLeads = rows.filter(l => l.stage === 'Won' && l.days_in_pipeline)
  const avgDaysToWin =
    wonLeads.length > 0
      ? Math.round(wonLeads.reduce((s, l) => s + (l.days_in_pipeline ?? 0), 0) / wonLeads.length)
      : null

  // Avg days in current stage
  const avgDaysInStage =
    rows.length > 0
      ? Math.round(rows.reduce((s, l) => s + (l.days_in_stage ?? 0), 0) / rows.length)
      : null

  return NextResponse.json({
    data: {
      total,
      active,
      won,
      lost,
      conversionRate,
      avgDaysToWin,
      avgDaysInStage,
      byStage,
    },
  })
}
