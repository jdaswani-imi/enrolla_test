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

  const INVITE_ALLOWED = ['super_admin', 'admin_head', 'hr_finance']
  if (!caller?.role || !INVITE_ALLOWED.includes(caller.role)) {
    return NextResponse.json({ error: 'Only Super Admin, Admin Head, or HR/Finance can resend invites' }, { status: 403 })
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

  if (staff.status !== 'invited') {
    return NextResponse.json({ error: 'Invite can only be resent for pending invitations' }, { status: 400 })
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/+$/, '')
  const redirectTo = `${appUrl}/auth/callback?next=/welcome`

  // generateLink works for both confirmed and unconfirmed users.
  // inviteUserByEmail fails if the user already confirmed their email,
  // so we use a magic link which has the same UX (click link → log in → /welcome).
  const { error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: staff.email,
    options: { redirectTo },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
