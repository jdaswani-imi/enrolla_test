import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data, error } = await adminSupabase
    .from('staff')
    .select('id, first_name, last_name, email, phone, role, avatar_url, profile_complete, created_at')
    .eq('user_id', auth.user.id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error || !data) {
    return NextResponse.json({ email: auth.user.email ?? '', first_name: '', last_name: '', phone: '', role: '', avatar_url: null, profile_complete: false })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data: staff, error: fetchErr } = await adminSupabase
    .from('staff')
    .select('id, role, email')
    .eq('user_id', auth.user.id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchErr || !staff) {
    return NextResponse.json({ error: 'Staff record not found' }, { status: 404 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.first_name !== undefined) updates.first_name = body.first_name
  if (body.last_name !== undefined) updates.last_name = body.last_name
  if (body.phone !== undefined) updates.phone = body.phone
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url
  if (body.profile_complete !== undefined) {
    updates.profile_complete = body.profile_complete
    if (body.profile_complete === true) updates.status = 'active'
  }
  // Email is intentionally excluded — it cannot be changed via profile

  const { data, error } = await adminSupabase
    .from('staff')
    .update(updates)
    .eq('id', staff.id)
    .eq('tenant_id', TENANT_ID)
    .select('id, first_name, last_name, email, phone, role, avatar_url, profile_complete, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
