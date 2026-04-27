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
  { params }: { params: Promise<{ jobId: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { jobId } = await params

  const { data, error } = await supabase
    .from('report_jobs')
    .select('id, status, report_type, error_message, started_at, completed_at, created_at')
    .eq('tenant_id', TENANT_ID)
    .eq('id', jobId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  return NextResponse.json({
    data: {
      jobId: data.id,
      status: data.status,
      reportType: data.report_type,
      errorMessage: data.error_message ?? null,
      startedAt: data.started_at ?? null,
      completedAt: data.completed_at ?? null,
      createdAt: data.created_at,
    },
  })
}
