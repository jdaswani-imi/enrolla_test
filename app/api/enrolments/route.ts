import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId') // UUID of the student
  const includeWithdrawn = searchParams.get('includeWithdrawn') === 'true'

  let query = supabase
    .from('enrolments')
    .select(`
      id,
      status,
      sessions_total,
      sessions_remaining,
      sessions_per_week,
      frequency_tier,
      package_name,
      invoice_status,
      enrolled_at,
      students!inner (
        id,
        student_ref,
        first_name,
        last_name,
        year_group
      ),
      departments (
        name
      ),
      courses (
        name
      ),
      staff_profiles!enrolments_teacher_id_fkey (
        users (
          full_name
        )
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('enrolled_at', { ascending: false })

  if (!includeWithdrawn) {
    query = query.neq('status', 'Withdrawn')
  }

  if (studentId) {
    query = query.eq('student_id', studentId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((e: any) => ({
    id: e.id,
    studentUuid: e.students?.id ?? '',
    studentId: e.students?.student_ref ?? '',
    student: `${e.students?.first_name ?? ''} ${e.students?.last_name ?? ''}`.trim(),
    yearGroup: e.students?.year_group ?? '',
    department: e.departments?.name ?? '',
    subject: e.courses?.name ?? '',
    teacher: e.staff_profiles?.users?.full_name ?? '—',
    sessionsTotal: e.sessions_total ?? 0,
    sessionsRemaining: e.sessions_remaining ?? 0,
    frequency: e.sessions_per_week
      ? `${e.sessions_per_week}×/week`
      : (e.frequency_tier ?? '—'),
    package: e.package_name ?? '—',
    invoiceStatus: (e.invoice_status ?? 'Pending') as string,
    enrolmentStatus: e.status as string,
    enrolledOn: e.enrolled_at ?? undefined,
  }))

  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('enrolments')
    .insert({
      tenant_id: TENANT_ID,
      student_id: body.studentUuid,
      course_id: body.courseId,
      department_id: body.departmentId ?? null,
      teacher_id: body.teacherId ?? null,
      sessions_per_week: body.sessionsPerWeek ?? 1,
      sessions_total: body.sessionsTotal ?? 0,
      sessions_remaining: body.sessionsTotal ?? 0,
      package_name: body.packageName ?? null,
      invoice_status: body.invoiceStatus ?? 'Pending',
      status: body.status ?? 'Pending',
      enrolled_at: body.enrolledAt ?? new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
