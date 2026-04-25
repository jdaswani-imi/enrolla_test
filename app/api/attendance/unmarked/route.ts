import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const days = Math.min(parseInt(searchParams.get('days') ?? '7', 10), 30)

  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)
  const from = fromDate.toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const { data: sessions, error: sessErr } = await supabase
    .from('sessions')
    .select(`
      id, date, course_id,
      courses (
        subjects (name),
        departments (name)
      ),
      users!sessions_teacher_id_fkey (id, full_name)
    `)
    .eq('tenant_id', TENANT_ID)
    .neq('status', 'Cancelled')
    .gte('date', from)
    .lte('date', today)
    .order('date', { ascending: false })

  if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 })
  if (!sessions?.length) return NextResponse.json({ data: [] })

  const sessionIds = sessions.map(s => s.id)
  const courseIds = [...new Set(sessions.map(s => s.course_id).filter(Boolean))]

  const [{ data: enrolCounts }, { data: recCounts }] = await Promise.all([
    supabase
      .from('enrolments')
      .select('course_id, student_id')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'Active')
      .in('course_id', courseIds),
    supabase
      .from('attendance_records')
      .select('session_id, student_id')
      .eq('tenant_id', TENANT_ID)
      .in('session_id', sessionIds),
  ])

  const enrolledByCourse: Record<string, number> = {}
  for (const row of (enrolCounts ?? [])) {
    enrolledByCourse[row.course_id] = (enrolledByCourse[row.course_id] ?? 0) + 1
  }

  const markedBySession: Record<string, number> = {}
  for (const row of (recCounts ?? [])) {
    markedBySession[row.session_id] = (markedBySession[row.session_id] ?? 0) + 1
  }

  const now = Date.now()

  const data = sessions
    .filter(s => {
      const enrolled = enrolledByCourse[s.course_id] ?? 0
      const marked = markedBySession[s.id] ?? 0
      return enrolled > 0 && marked < enrolled
    })
    .map(s => {
      const course = s.courses as unknown as { subjects: { name: string }; departments: { name: string } } | null
      const teacher = s.users as unknown as { id: string; full_name: string } | null
      const hoursElapsed = Math.floor((now - new Date(s.date + 'T00:00:00').getTime()) / 3600000)
      const hoursRemaining = Math.max(0, 48 - hoursElapsed)
      const overdue = hoursElapsed >= 48

      return {
        id: s.id,
        subject: course?.subjects?.name ?? 'Unknown',
        date: s.date,
        dept: course?.departments?.name ?? '',
        teacher: teacher?.full_name ?? '',
        teacherId: teacher?.id ?? '',
        hoursRemaining,
        overdue,
      }
    })

  return NextResponse.json({ data })
}
