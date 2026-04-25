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
  // body: { action: 'reinstate' | 'resolve', enrolmentId?: string }

  if (body.action === 'reinstate') {
    const { error: delErr } = await supabase
      .from('withdrawal_records')
      .delete()
      .eq('id', id)
      .eq('tenant_id', TENANT_ID)

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

    if (body.enrolmentId) {
      await supabase
        .from('enrolments')
        .update({
          status: 'Active',
          withdrawn_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.enrolmentId)
        .eq('tenant_id', TENANT_ID)
    }
  } else if (body.action === 'resolve') {
    const { error } = await supabase
      .from('withdrawal_records')
      .update({ record_status: 'Resolved' })
      .eq('id', id)
      .eq('tenant_id', TENANT_ID)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
