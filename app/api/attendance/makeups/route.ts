import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Maps DB makeup_status to page display status
const STATUS_MAP: Record<string, 'Completed' | 'Pending' | 'Confirmed' | 'Expired'> = {
  Booked: 'Confirmed',
  Attended: 'Completed',
  'No-show': 'Expired',
  'Carry-over': 'Pending',
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { data: makeups, error } = await supabase
    .from('makeups')
    .select('id, status, booked_at, student_id, original_attendance_id, replacement_session_id')
    .eq('tenant_id', TENANT_ID)
    .order('booked_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!makeups?.length) return NextResponse.json({ data: [] })

  const studentIds = [...new Set(makeups.map(m => m.student_id))]
  const attendanceIds = makeups.map(m => m.original_attendance_id).filter(Boolean)
  const replacementSessionIds = makeups.map(m => m.replacement_session_id).filter(Boolean)

  // Fetch all related data in parallel
  const [{ data: students }, { data: origRecords }, { data: replacementSessions }] = await Promise.all([
    supabase
      .from('students')
      .select('id, first_name, last_name')
      .in('id', studentIds),
    supabase
      .from('attendance_records')
      .select('id, session_id')
      .in('id', attendanceIds),
    supabase
      .from('sessions')
      .select('id, date')
      .in('id', replacementSessionIds),
  ])

  // Get original session details
  const origSessionIds = [...new Set((origRecords ?? []).map(r => r.session_id))]
  const { data: origSessions } = origSessionIds.length
    ? await supabase
        .from('sessions')
        .select(`
          id, date,
          courses (
            subjects (name),
            departments (name)
          ),
          users!sessions_teacher_id_fkey (id)
        `)
        .in('id', origSessionIds)
    : { data: [] }

  // Build lookups
  const studentMap = new Map((students ?? []).map(s => [s.id, s]))
  const attendanceMap = new Map((origRecords ?? []).map(r => [r.id, r]))
  const origSessionMap = new Map((origSessions ?? []).map(s => [s.id, s]))
  const replacementSessionMap = new Map((replacementSessions ?? []).map(s => [s.id, s]))

  const data = makeups.map(m => {
    const student = studentMap.get(m.student_id)
    const origRecord = m.original_attendance_id ? attendanceMap.get(m.original_attendance_id) : null
    const origSession = origRecord ? origSessionMap.get(origRecord.session_id) : null
    const replacementSession = m.replacement_session_id ? replacementSessionMap.get(m.replacement_session_id) : null
    const course = origSession?.courses as unknown as { subjects: { name: string }; departments: { name: string } } | null
    const teacher = origSession?.users as unknown as { id: string } | null

    return {
      id: m.id,
      originalSession: origSession?.date
        ? new Date(origSession.date as string + 'T00:00:00').toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        : '—',
      subject: course?.subjects?.name ?? '—',
      student: student ? `${student.first_name} ${student.last_name}` : '—',
      makeupDate: replacementSession?.date
        ? new Date(replacementSession.date as string + 'T00:00:00').toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        : 'TBC',
      status: STATUS_MAP[m.status] ?? 'Pending',
      teacherId: teacher?.id ?? '',
      dept: course?.departments?.name ?? '',
    }
  })

  return NextResponse.json({ data })
}
