import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Band 1 subjects table only has these columns:
// id, tenant_id, branch_id, department_id, year_group_id, name, price,
// session_duration_minutes, is_active, created_at, updated_at

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data, error } = await supabase
    .from('subjects')
    .select(`
      id, name, department_id, year_group_id, is_active,
      session_duration_minutes, price,
      departments ( name )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjects = (data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    code: '',
    department: s.departments?.name ?? '',
    departmentId: s.department_id,
    yearGroups: [],
    sessionDurationMins: s.session_duration_minutes ?? 60,
    gradingScale: 'Percentage (0–100%)',
    isActive: s.is_active,
    description: '',
    colour: 'bg-amber-500',
    maxStudents: 6,
    allowsMakeup: true,
    requiresAssessment: false,
    billingCadenceDefault: 'Termly',
    examCountdown: false,
    conditionalRate: false,
    conditionDescription: null,
    weighting: { classwork: 10, homework: 20, test: 40, other: 30 },
    qualificationRoutes: [],
    examBoards: [],
    phase: '',
  }))

  // courses table does not exist in Band 1
  return NextResponse.json({ subjects, courses: [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await request.json()

  if (body.type === 'subject') {
    const { name, departmentId, isActive, sessionDurationMins } = body

    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('subjects')
      .insert({
        tenant_id:               TENANT_ID,
        name:                    name.trim(),
        department_id:           departmentId ?? null,
        is_active:               isActive ?? true,
        session_duration_minutes: sessionDurationMins ?? 60,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id }, { status: 201 })
  }

  // courses table does not exist in Band 1
  if (body.type === 'course') {
    return NextResponse.json({ error: 'courses table not available in Band 1' }, { status: 501 })
  }

  return NextResponse.json({ error: 'type must be "subject" or "course"' }, { status: 400 })
}
