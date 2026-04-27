import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params

  // Verify rule belongs to tenant
  const { data: rule } = await supabase
    .from('automation_rules')
    .select('id, name')
    .eq('tenant_id', TENANT_ID)
    .eq('id', id)
    .maybeSingle()

  if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('execution_logs')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('rule_id', id)
    .order('fired_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: (data ?? []).map(r => ({
      id: r.id,
      rule: r.rule ?? rule.name,
      triggerType: r.trigger_type ?? '',
      firedAt: r.fired_at ?? null,
      executedAt: r.executed_at ?? null,
      recipients: r.recipients ?? 0,
      live: r.live ?? 0,
      queued: r.queued ?? 0,
      status: r.status ?? 'Success',
      duration: r.duration ?? '0ms',
      payload: r.payload ?? [],
      conditionResults: r.condition_results ?? [],
      actionResults: r.action_results ?? [],
      recipientRouting: r.recipient_routing ?? [],
    })),
  })
}
