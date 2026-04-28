import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/route-auth'
import { TENANT_ID } from '@/lib/api-constants'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data } = await admin
    .from('staff')
    .select('role, first_name, last_name, email')
    .eq('user_id', auth.user.id)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  const dbRole = data?.role ?? 'admin'
  const name = data
    ? `${data.first_name} ${data.last_name}`.trim()
    : auth.user.email ?? ''

  return NextResponse.json({
    email: data?.email ?? auth.user.email,
    role:  DB_ROLE_TO_FRONTEND[dbRole] ?? dbRole,
    name,
  })
}
