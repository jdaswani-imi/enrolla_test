import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')
  const includeWithdrawn = searchParams.get('includeWithdrawn') === 'true'

  let query = supabase
    .from('enrolments')
    .select(`
      id,
      status,
      price_at_enrolment,
      start_date,
      end_date,
      notes,
      created_at,
      students (
        id,
        student_number,
        first_name,
        last_name
      ),
      subjects (
        id,
        name,
        session_duration_minutes,
        departments ( name ),
        year_groups ( name )
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (!includeWithdrawn) {
    query = query.neq('status', 'withdrawn')
  }

  if (studentId) {
    query = query.eq('student_id', studentId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json([], { status: 200 })

  // Fetch computed sessions from the view for these enrolments
  const enrolmentIds = (data ?? []).map((e) => e.id)
  const { data: sessionRows } = enrolmentIds.length
    ? await supabase
        .from('v_enrolment_sessions')
        .select('enrolment_id, sessions_paid, sessions_attended, sessions_remaining')
        .in('enrolment_id', enrolmentIds)
    : { data: [] }

  const sessionsMap = new Map(
    (sessionRows ?? []).map((s) => [s.enrolment_id, s])
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((e: any) => {
    const s = e.students
    const subj = e.subjects
    const dept = subj?.departments
    const yg = subj?.year_groups
    const computed = sessionsMap.get(e.id)

    return {
      id: e.id,
      studentUuid: s?.id ?? '',
      studentId: s ? `IMI-${String(s.student_number).padStart(4, '0')}` : '',
      student: s ? `${s.first_name} ${s.last_name}`.trim() : '',
      yearGroup: yg?.name ?? '—',
      department: dept?.name ?? '—',
      subject: subj?.name ?? '—',
      teacher: '—',
      sessionsTotal: computed?.sessions_paid ?? 0,
      sessionsRemaining: computed?.sessions_remaining ?? 0,
      sessionsAttended: computed?.sessions_attended ?? 0,
      frequency: '—',
      package: '—',
      invoiceStatus: 'Pending',
      enrolmentStatus: e.status,
      enrolledOn: e.created_at ?? undefined,
    }
  })

  return NextResponse.json(rows)
}
