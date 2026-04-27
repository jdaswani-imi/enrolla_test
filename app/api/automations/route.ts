import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: (data ?? []).map(r => ({
      id: r.id,
      name: r.name,
      triggerType: r.trigger_type ?? 'Manual',
      trigger: r.trigger_type ?? 'Manual',
      module: r.module ?? '',
      status: r.status ?? 'Disabled',
      lastFired: r.last_fired_at ?? null,
      lastRun: r.last_fired_at ?? null,
      fireCount: r.fire_count ?? 0,
      runsThisMonth: r.runs_this_month ?? 0,
      templateId: r.template_id ?? null,
      locked: r.locked ?? false,
    })),
  })
}
