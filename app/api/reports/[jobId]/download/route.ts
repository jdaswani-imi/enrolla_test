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

  const { data: job, error } = await supabase
    .from('report_jobs')
    .select('id, status, storage_path, report_type')
    .eq('tenant_id', TENANT_ID)
    .eq('id', jobId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.status !== 'complete') {
    return NextResponse.json({ error: 'Report is not ready yet', status: job.status }, { status: 409 })
  }
  if (!job.storage_path) {
    return NextResponse.json({ error: 'No file available for this report' }, { status: 404 })
  }

  // Generate a signed URL valid for 60 minutes
  const { data: signed, error: signErr } = await supabase
    .storage
    .from('reports')
    .createSignedUrl(job.storage_path, 60 * 60)

  if (signErr) {
    // Storage bucket may not have this file yet (stub); return a placeholder URL
    return NextResponse.json({
      data: { url: null, message: 'File not yet available in storage' },
    })
  }

  return NextResponse.json({ data: { url: signed.signedUrl } })
}
