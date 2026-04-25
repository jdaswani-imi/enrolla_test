import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ABSENCE_STATUSES = ['Absent Notified', 'Absent Not Notified', 'No Show']

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  // Fetch all absence records
  const { data: records, error: recErr } = await supabase
    .from('attendance_records')
    .select('student_id, session_id, status, created_at')
    .eq('tenant_id', TENANT_ID)
    .in('status', ABSENCE_STATUSES)
    .order('created_at', { ascending: true })

  if (recErr) return NextResponse.json({ error: recErr.message }, { status: 500 })
  if (!records?.length) return NextResponse.json({ data: [] })

  const sessionIds = [...new Set(records.map(r => r.session_id))]
  const studentIds = [...new Set(records.map(r => r.student_id))]

  const [{ data: sessions }, { data: students }, { data: makeups }] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        id, date, course_id,
        courses (
          subjects (name),
          departments (name)
        ),
        users!sessions_teacher_id_fkey (id)
      `)
      .in('id', sessionIds),
    supabase
      .from('students')
      .select('id, first_name, last_name, year_group')
      .in('id', studentIds),
    supabase
      .from('makeups')
      .select('student_id, status')
      .eq('tenant_id', TENANT_ID)
      .in('student_id', studentIds),
  ])

  // Build lookups
  const sessionMap = new Map((sessions ?? []).map(s => [s.id, s]))
  const studentMap = new Map((students ?? []).map(s => [s.id, s]))

  // Count used makeups per student (Booked or Attended = used against allowance)
  const usedMakeupsByStudent: Record<string, number> = {}
  for (const m of (makeups ?? [])) {
    if (m.status === 'Booked' || m.status === 'Attended') {
      usedMakeupsByStudent[m.student_id] = (usedMakeupsByStudent[m.student_id] ?? 0) + 1
    }
  }

  // Aggregate absences by student + course
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

    const course = session.courses as unknown as { subjects: { name: string }; departments: { name: string } } | null
    const teacher = session.users as unknown as { id: string } | null
    const courseId = session.course_id
    const key: AggKey = `${rec.student_id}:${courseId}`

    if (!map.has(key)) {
      map.set(key, {
        student: `${student.first_name} ${student.last_name}`,
        studentId: rec.student_id,
        year: student.year_group ?? '',
        dept: course?.departments?.name ?? '',
        subject: course?.subjects?.name ?? '',
        teacherId: teacher?.id ?? '',
        totalAbsences: 0,
        dates: [],
      })
    }
    const agg = map.get(key)!
    agg.totalAbsences++
    agg.dates.push(session.date as string)
  }

  const MAKEUP_MAX = 3

  const data = [...map.values()].map(agg => {
    // Consecutive: count the tail run of absences (simplified — uses sorted dates)
    const sorted = [...agg.dates].sort()
    // For the initial wiring, we skip window-function logic; return 0
    const consecutive = 0
    const makeupAllowance = Math.max(0, MAKEUP_MAX - (usedMakeupsByStudent[agg.studentId] ?? 0))

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
