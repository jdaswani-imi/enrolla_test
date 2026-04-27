import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_TYPES = ['attendance', 'revenue', 'academic', 'staff-performance'] as const
type ReportType = (typeof VALID_TYPES)[number]

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await req.json()
  const { type, params } = body as { type?: ReportType; params?: Record<string, unknown> }

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
  }

  // Resolve staff id
  const { data: staffRow } = await supabase
    .from('staff')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  const { data: job, error } = await supabase
    .from('report_jobs')
    .insert({
      tenant_id: TENANT_ID,
      requested_by: staffRow?.id ?? null,
      report_type: type,
      params: params ?? {},
      status: 'queued',
    })
    .select('id, status, report_type, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Simulate near-instant completion for simple reports (no Inngest yet).
  // In production this would dispatch an Inngest event and return jobId immediately.
  await supabase
    .from('report_jobs')
    .update({
      status: 'complete',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      storage_path: `reports/${TENANT_ID}/${job.id}/${type}.csv`,
    })
    .eq('id', job.id)

  return NextResponse.json({ data: { jobId: job.id, status: 'complete' } }, { status: 202 })
}
