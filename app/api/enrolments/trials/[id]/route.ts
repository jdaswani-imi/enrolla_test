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

  const patch: Record<string, unknown> = {}
  if (body.outcome !== undefined)            patch.outcome = body.outcome
  if (body.notes !== undefined)              patch.notes = body.notes
  if (body.followUpDate !== undefined)       patch.follow_up_date = body.followUpDate
  if (body.cancellationReason !== undefined) patch.cancellation_reason = body.cancellationReason

  const { error } = await supabase
    .from('trial_classes')
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
