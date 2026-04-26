import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Band 1 role enum → frontend display label
const DB_ROLE_TO_FRONTEND: Record<string, string> = {
  super_admin:   'Super Admin',
  admin_head:    'Admin Head',
  admin:         'Admin',
  academic_head: 'Academic Head',
  hod:           'HOD',
  teacher:       'Teacher',
  ta:            'TA',
  hr_finance:    'HR-Finance',
}

// Frontend label → Band 1 role enum
const FRONTEND_TO_DB_ROLE: Record<string, string> = {
  'Super Admin':   'super_admin',
  'Admin Head':    'admin_head',
  'Admin':         'admin',
  'Academic Head': 'academic_head',
  'HOD':           'hod',
  'Teacher':       'teacher',
  'TA':            'ta',
  'HR-Finance':    'hr_finance',
}

function toDbRole(role: string) {
  return FRONTEND_TO_DB_ROLE[role] ?? role.toLowerCase().replace(/[/ ]/g, '_')
}

function toFrontend(row: Record<string, unknown>) {
  const dbRole = String(row.role ?? '')
  return {
    id:            row.id,
    name:          `${row.first_name} ${row.last_name}`.trim(),
    email:         row.email,
    phone:         row.phone ?? '',
    role:          DB_ROLE_TO_FRONTEND[dbRole] ?? dbRole,
    department:    '—',
    subjects:      [],
    sessionsThisWeek: 0,
    cpdHours:      0,
    cpdTarget:     20,
    status:        row.status,
    hireDate:      '—',
    contractType:  'Full-time',
    lineManager:   '—',
    workloadLevel: 'Low',
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const role   = searchParams.get('role')

  let query = supabase
    .from('staff')
    .select('id, first_name, last_name, email, phone, role, status, created_at')
    .eq('tenant_id', TENANT_ID)

  if (status) query = (query as typeof query).eq('status', status)
  if (role)   query = (query as typeof query).eq('role', toDbRole(role))

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: (data ?? []).map(r => toFrontend(r as Record<string, unknown>)) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()
  const { firstName, lastName, role, email, phone, startDate } = body

  const { data, error } = await supabase
    .from('staff')
    .insert({
      tenant_id:  TENANT_ID,
      first_name: firstName,
      last_name:  lastName,
      email,
      phone:      phone || null,
      role:       toDbRole(role),
      status:     'active',
    })
    .select('id, first_name, last_name, email, phone, role, status, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: toFrontend(data as Record<string, unknown>) }, { status: 201 })
}
