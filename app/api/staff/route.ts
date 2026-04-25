import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID, BRANCH_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// frontend "HR-Finance" ↔ DB "HR/Finance"
function toDbRole(role: string) {
  return role === 'HR-Finance' ? 'HR/Finance' : role
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${months[m - 1]} ${y}`
}

function toFrontend(row: Record<string, unknown>) {
  const user     = row.users as Record<string, unknown>
  const dept     = row.departments as Record<string, unknown> | null
  const cpds     = (row.cpd_records as { hours: number; activity_date: string }[]) ?? []
  const yearStart = `${new Date().getFullYear()}-01-01`
  const cpdHours  = cpds
    .filter(c => c.activity_date >= yearStart)
    .reduce((sum, c) => sum + Number(c.hours ?? 0), 0)

  const dbRole        = String(user.role ?? '')
  const frontendRole  = dbRole === 'HR/Finance' ? 'HR-Finance' : dbRole
  const sessionsThisWeek = 0
  const workloadLevel = sessionsThisWeek >= 10 ? 'High' : sessionsThisWeek >= 5 ? 'Moderate' : 'Low'

  return {
    id:                row.id,
    name:              user.full_name,
    email:             user.email,
    role:              frontendRole,
    department:        dept?.name ?? '—',
    subjects:          (row.subjects_taught as string[]) ?? [],
    sessionsThisWeek,
    cpdHours:          Math.round(cpdHours * 10) / 10,
    cpdTarget:         (row.cpd_annual_target as number) ?? 20,
    status:            row.status,
    hireDate:          formatDate(row.start_date as string | null),
    contractType:      (row.employment_type as string) ?? 'Full-time',
    lineManager:       (row.line_manager_name as string) ?? '—',
    workloadLevel,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const role   = searchParams.get('role')

  let query = supabase
    .from('staff_profiles')
    .select(`
      id,
      employment_type,
      start_date,
      subjects_taught,
      cpd_annual_target,
      status,
      line_manager_name,
      users!inner (
        id,
        full_name,
        email,
        role,
        is_active
      ),
      departments (
        id,
        name
      ),
      cpd_records (
        hours,
        activity_date
      )
    `)
    .eq('tenant_id', TENANT_ID)

  if (status) query = (query as typeof query).eq('status', status)
  if (role)   query = (query as typeof query).eq('users.role', toDbRole(role))

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: (data ?? []).map(toFrontend) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()
  const { firstName, lastName, role, department, email, phone, startDate, subjects } = body

  // Resolve department → id
  let department_id: string | null = null
  if (department) {
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('name', department)
      .maybeSingle()
    department_id = dept?.id ?? null
  }

  // Create user record
  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({
      tenant_id:  TENANT_ID,
      branch_id:  BRANCH_ID,
      full_name:  `${firstName} ${lastName}`.trim(),
      email,
      role:       toDbRole(role),
      phone:      phone || null,
      is_active:  true,
    })
    .select('id')
    .single()

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

  // Create staff profile
  const { data: profile, error: profErr } = await supabase
    .from('staff_profiles')
    .insert({
      tenant_id:       TENANT_ID,
      user_id:         user.id,
      department_id,
      subjects_taught: subjects ?? [],
      start_date:      startDate || null,
      employment_type: 'Full-time',
      cpd_annual_target: 20,
      status:          'Active',
    })
    .select(`
      id,
      employment_type,
      start_date,
      subjects_taught,
      cpd_annual_target,
      status,
      line_manager_name,
      users!inner ( id, full_name, email, role, is_active ),
      departments ( id, name ),
      cpd_records ( hours, activity_date )
    `)
    .single()

  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })

  return NextResponse.json({ data: toFrontend(profile as Record<string, unknown>) }, { status: 201 })
}
