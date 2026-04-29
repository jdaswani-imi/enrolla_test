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

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  // Read current stage before update so we can write accurate history
  let previousStage: string | null = null
  if (body.stage !== undefined) {
    const { data } = await supabase
      .from('leads')
      .select('stage')
      .eq('id', id)
      .eq('tenant_id', TENANT_ID)
      .maybeSingle()
    previousStage = data?.stage ?? null
  }

  if (body.stage !== undefined)           patch.stage          = body.stage
  if (body.status !== undefined)          patch.status         = body.status
  if (body.lostReason !== undefined)      patch.lost_reason    = body.lostReason
  if (body.lostNotes !== undefined)       patch.lost_notes     = body.lostNotes
  if (body.reEngage !== undefined)        patch.re_engage      = body.reEngage
  if (body.reEngageAfter !== undefined)   patch.re_engage_after = body.reEngageAfter

  const { error } = await supabase
    .from('leads')
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Write stage history only when stage actually changed
  if (body.stage !== undefined && previousStage !== null && previousStage !== body.stage) {
    const { data: staff } = await supabase
      .from('staff')
      .select('first_name, last_name')
      .eq('user_id', auth.user.id)
      .maybeSingle()
    const changedByName = staff
      ? `${staff.first_name} ${staff.last_name}`.trim()
      : (auth.user.email ?? 'Unknown')

    await supabase.from('status_history').insert({
      entity_type:     'lead',
      entity_id:       id,
      changed_by:      auth.user.id,
      changed_by_name: changedByName,
      previous_status: previousStage,
      new_status:      body.stage,
    })
  }

  return NextResponse.json({ ok: true })
}
