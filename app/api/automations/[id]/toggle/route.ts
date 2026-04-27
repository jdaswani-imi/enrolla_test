import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params

  const { data: existing, error: fetchErr } = await supabase
    .from('automation_rules')
    .select('id, status, locked')
    .eq('tenant_id', TENANT_ID)
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.locked) return NextResponse.json({ error: 'This rule is locked and cannot be toggled' }, { status: 403 })

  const newStatus = existing.status === 'Enabled' ? 'Disabled' : 'Enabled'

  const { data, error } = await supabase
    .from('automation_rules')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { id: data.id, status: data.status } })
}
