import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FRONTEND_TO_DB_ROLE: Record<string, string> = {
  'Super Admin':   'super_admin',
  'Admin Head':    'admin_head',
  'Admin':         'admin',
  'Academic Head': 'academic_head',
  'HOD':           'hod',
  'Teacher':       'teacher',
  'TA':            'ta',
  'HR/Finance':    'hr_finance',
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  // Only Super Admin may create new users
  const { data: caller } = await admin
    .from('staff')
    .select('role')
    .eq('user_id', auth.user.id)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  const INVITE_ALLOWED = ['super_admin', 'admin_head', 'hr_finance']
  if (!caller?.role || !INVITE_ALLOWED.includes(caller.role)) {
    return NextResponse.json({ error: 'Only Super Admin, Admin Head, or HR/Finance can invite staff members' }, { status: 403 })
  }

  const body = await request.json()
  const { firstName, lastName, role, email, phone } = body

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !role) {
    return NextResponse.json({ error: 'firstName, lastName, email and role are required' }, { status: 400 })
  }

  // Derive the app URL for the invite redirect
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/+$/, '')
  const redirectTo = `${appUrl}/auth/callback?next=/welcome`

  // Create auth user and send invite email
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    email.trim().toLowerCase(),
    { redirectTo }
  )

  if (inviteErr) {
    return NextResponse.json({ error: inviteErr.message }, { status: 400 })
  }

  const dbRole = FRONTEND_TO_DB_ROLE[role] ?? role.toLowerCase().replace(/[/ ]/g, '_')

  // Create the staff record linked to the new auth user
  const { data, error } = await admin
    .from('staff')
    .insert({
      tenant_id:  TENANT_ID,
      user_id:    invited.user.id,
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      email:      email.trim().toLowerCase(),
      phone:      phone?.trim() || null,
      role:       dbRole,
      status:     'invited',
    })
    .select('id, first_name, last_name, email, phone, role, status, created_at')
    .single()

  if (error) {
    // Clean up the orphaned auth user if DB insert fails
    await admin.auth.admin.deleteUser(invited.user.id).catch(() => {})
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const DB_ROLE_TO_FRONTEND: Record<string, string> = {
    super_admin:   'Super Admin',
    admin_head:    'Admin Head',
    admin:         'Admin',
    academic_head: 'Academic Head',
    hod:           'HOD',
    teacher:       'Teacher',
    ta:            'TA',
    hr_finance:    'HR/Finance',
  }

  return NextResponse.json({
    data: {
      id:            data.id,
      name:          `${data.first_name} ${data.last_name}`.trim(),
      email:         data.email,
      phone:         data.phone ?? '',
      role:          DB_ROLE_TO_FRONTEND[data.role] ?? data.role,
      department:    '—',
      subjects:      [],
      sessionsThisWeek: 0,
      cpdHours:      0,
      cpdTarget:     20,
      status:        'Invited',
      hireDate:      '—',
      contractType:  'Full-time',
      lineManager:   '—',
      workloadLevel: 'Low',
    },
  }, { status: 201 })
}
