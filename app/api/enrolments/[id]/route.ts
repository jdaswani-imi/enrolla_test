import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (body.status !== undefined)            patch.status = body.status
  if (body.sessionsTotal !== undefined)     patch.sessions_total = body.sessionsTotal
  if (body.sessionsRemaining !== undefined) patch.sessions_remaining = body.sessionsRemaining
  if (body.invoiceStatus !== undefined)     patch.invoice_status = body.invoiceStatus
  if (body.packageName !== undefined)       patch.package_name = body.packageName
  if (body.withdrawnAt !== undefined)       patch.withdrawn_at = body.withdrawnAt

  const { error } = await supabase
    .from('enrolments')
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
