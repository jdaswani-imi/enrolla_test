import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data: records, error: recErr } = await supabase
    .from('attendance_records')
    .select('student_id, session_id, status, created_at')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'absent')
    .order('created_at', { ascending: true })

  if (recErr) return NextResponse.json({ error: recErr.message }, { status: 500 })
  if (!records?.length) return NextResponse.json({ data: [] })

  const sessionIds = [...new Set(records.map(r => r.session_id))]
  const studentIds = [...new Set(records.map(r => r.student_id))]

  const [{ data: sessions }, { data: students }, { data: allowances }] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, session_date, subject_id, subjects (name, departments (name)), staff (id)')
      .in('id', sessionIds),
    supabase
      .from('students')
      .select('id, first_name, last_name, year_group')
      .in('id', studentIds),
    // makeup_allowances joined to enrolments to get student_id
    supabase
      .from('makeup_allowances')
      .select('used_allowance, total_allowance, enrolments (student_id)')
      .eq('tenant_id', TENANT_ID)
      .in('enrolments.student_id' as string, studentIds),
  ])

  const sessionMap = new Map((sessions ?? []).map(s => [s.id, s]))
  const studentMap = new Map((students ?? []).map(s => [s.id, s]))

  // Compute remaining makeup allowance per student
  const remainingByStudent: Record<string, number> = {}
  for (const a of (allowances ?? [])) {
    const enrolment = a.enrolments as unknown as { student_id: string } | null
    if (!enrolment?.student_id) continue
    const sid = enrolment.student_id
    const remaining = (a.total_allowance ?? 0) - (a.used_allowance ?? 0)
    remainingByStudent[sid] = (remainingByStudent[sid] ?? 0) + remaining
  }

  // Aggregate absences by student + subject
  type AggKey = string
  interface Agg {
    student: string; studentId: string; year: string
    dept: string; subject: string; teacherId: string
    totalAbsences: number; dates: string[]
  }

  const map = new Map<AggKey, Agg>()

  for (const rec of records) {
    const session = sessionMap.get(rec.session_id)
    const student = studentMap.get(rec.student_id)
    if (!session || !student) continue

    const subj = session.subjects as unknown as { name: string; departments: { name: string } | null } | null
    const staff = session.staff as unknown as { id: string } | null
    const subjectId = session.subject_id
    const key: AggKey = `${rec.student_id}:${subjectId}`

    if (!map.has(key)) {
      map.set(key, {
        student: `${student.first_name} ${student.last_name}`,
        studentId: rec.student_id,
        year: student.year_group ?? '',
        dept: subj?.departments?.name ?? '',
        subject: subj?.name ?? '',
        teacherId: staff?.id ?? '',
        totalAbsences: 0,
        dates: [],
      })
    }
    const agg = map.get(key)!
    agg.totalAbsences++
    agg.dates.push(session.session_date as string)
  }

  const MAKEUP_MAX = 3

  const data = [...map.values()].map(agg => {
    const consecutive = 0 // simplified — window-function logic deferred
    const makeupAllowance = remainingByStudent[agg.studentId] ?? MAKEUP_MAX

    let status: 'Allowance Exhausted' | 'Consecutive Alert' | 'Monitor' | 'Normal'
    if (makeupAllowance === 0) status = 'Allowance Exhausted'
    else if (consecutive >= 2) status = 'Consecutive Alert'
    else if (agg.totalAbsences >= 3) status = 'Monitor'
    else status = 'Normal'

    return {
      student: agg.student,
      studentId: agg.studentId,
      year: agg.year,
      dept: agg.dept,
      subject: agg.subject,
      teacherId: agg.teacherId,
      totalAbsences: agg.totalAbsences,
      consecutive,
      makeupAllowance,
      status,
    }
  })

  return NextResponse.json({ data })
}
