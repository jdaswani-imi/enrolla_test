import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const SESSION_TYPE_MAP: Record<string, string> = {
  'Class': 'Regular',
  'Trial': 'Trial',
  'Assessment Slot': 'Assessment',
  'Cover Session': 'Cover Required',
  'Meeting': 'Meeting',
  'Blocked Time': 'Blocked',
  'Event Session': 'Regular',
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  const { data: sessions, error: sessErr } = await supabase
    .from('sessions')
    .select(`
      id, date, start_time, end_time, duration_mins, session_type, status, notes, course_id,
      courses (
        id, name,
        subjects (id, name),
        departments (id, name, colour)
      ),
      rooms (id, name),
      users!sessions_teacher_id_fkey (id, full_name)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('date', date)
    .neq('status', 'Cancelled')
    .order('start_time', { ascending: true })

  if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 })
  if (!sessions?.length) return NextResponse.json({ data: [] })

  const sessionIds = sessions.map(s => s.id)
  const courseIds = [...new Set(sessions.map(s => s.course_id).filter(Boolean))]

  const [{ data: enrolments }, { data: records }, { data: tas }] = await Promise.all([
    supabase
      .from('enrolments')
      .select('course_id, students (id, first_name, last_name, year_group)')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'Active')
      .in('course_id', courseIds),
    supabase
      .from('attendance_records')
      .select('session_id, student_id, status')
      .eq('tenant_id', TENANT_ID)
      .in('session_id', sessionIds),
    supabase
      .from('session_tas')
      .select('session_id, user_id')
      .in('session_id', sessionIds),
  ])

  // Group students by course (deduplicated)
  const studentsByCourse: Record<string, Array<{ id: string; name: string; yearGroup: string }>> = {}
  for (const row of (enrolments ?? [])) {
    const st = row.students as unknown as { id: string; first_name: string; last_name: string; year_group: string } | null
    if (!st) continue
    if (!studentsByCourse[row.course_id]) studentsByCourse[row.course_id] = []
    if (!studentsByCourse[row.course_id].some(s => s.id === st.id)) {
      studentsByCourse[row.course_id].push({
        id: st.id,
        name: `${st.first_name} ${st.last_name}`,
        yearGroup: st.year_group ?? '',
      })
    }
  }

  // Map attendance records by session → student
  const recordsBySession: Record<string, Record<string, string>> = {}
  for (const rec of (records ?? [])) {
    if (!recordsBySession[rec.session_id]) recordsBySession[rec.session_id] = {}
    recordsBySession[rec.session_id][rec.student_id] = rec.status
  }

  // Map TAs by session
  const tasBySession: Record<string, string[]> = {}
  for (const ta of (tas ?? [])) {
    if (!tasBySession[ta.session_id]) tasBySession[ta.session_id] = []
    tasBySession[ta.session_id].push(ta.user_id)
  }

  const data = sessions.map(s => {
    const course = s.courses as unknown as { id: string; name: string; subjects: { name: string }; departments: { name: string } } | null
    const room = s.rooms as unknown as { name: string } | null
    const teacher = s.users as unknown as { id: string; full_name: string } | null
    const students = (studentsByCourse[s.course_id] ?? []).sort((a, b) => a.name.localeCompare(b.name))
    const existingRecords = recordsBySession[s.id] ?? {}
    const attendanceMarked = students.length > 0 && students.every(st => existingRecords[st.id])

    return {
      id: s.id,
      date: s.date,
      day: DAY_NAMES[new Date(s.date + 'T00:00:00').getDay()],
      subject: course?.subjects?.name ?? course?.name ?? 'Unknown',
      department: course?.departments?.name ?? '',
      teacher: teacher?.full_name ?? '',
      teacherId: teacher?.id ?? '',
      room: room?.name ?? '',
      startTime: (s.start_time as string)?.substring(0, 5) ?? '',
      endTime: (s.end_time as string)?.substring(0, 5) ?? '',
      duration: s.duration_mins,
      type: SESSION_TYPE_MAP[s.session_type] ?? 'Regular',
      status: s.status,
      students,
      studentCount: students.length,
      existingRecords,
      attendanceMarked,
      assignedTAs: tasBySession[s.id] ?? [],
    }
  })

  return NextResponse.json({ data })
}
