import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data: caller } = await admin
    .from('staff')
    .select('role')
    .eq('user_id', auth.user.id)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  const ALLOWED = ['super_admin', 'admin_head', 'hr_finance']
  if (!caller?.role || !ALLOWED.includes(caller.role)) {
    return NextResponse.json(
      { error: 'Only Super Admin, Admin Head, or HR/Finance can send password resets' },
      { status: 403 }
    )
  }

  const { staffId } = await request.json()
  if (!staffId) return NextResponse.json({ error: 'staffId required' }, { status: 400 })

  const { data: staff, error: fetchErr } = await admin
    .from('staff')
    .select('email, status')
    .eq('id', staffId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchErr || !staff) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
  }

  if (staff.status === 'invited') {
    return NextResponse.json(
      { error: 'This staff member has not yet accepted their invitation. Use "Resend invite" instead.' },
      { status: 400 }
    )
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/+$/, '')
  const redirectTo = `${appUrl}/auth/callback?next=/reset-password`

  const { error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: staff.email,
    options: { redirectTo },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
