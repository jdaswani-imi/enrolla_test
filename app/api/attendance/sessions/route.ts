import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID, BRANCH_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)

  const weekStart = searchParams.get('week_start')
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  let query = supabase
    .from('sessions')
    .select(`
      id, session_date, start_time, end_time, status, subject_id,
      subjects (
        id, name,
        departments (id, name)
      ),
      rooms (id, name),
      staff (id, first_name, last_name)
    `)
    .eq('tenant_id', TENANT_ID)
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true })

  if (weekStart) {
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 5)
    const weekEnd = end.toISOString().split('T')[0]
    query = query.gte('session_date', weekStart).lte('session_date', weekEnd)
  } else {
    query = query.eq('session_date', date)
  }

  const { data: sessions, error: sessErr } = await query

  if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 })
  if (!sessions?.length) return NextResponse.json({ data: [] })

  const sessionIds = sessions.map(s => s.id)
  const subjectIds = [...new Set(sessions.map(s => s.subject_id).filter(Boolean))]

  const [{ data: enrolments }, { data: records }] = await Promise.all([
    supabase
      .from('enrolments')
      .select('subject_id, students (id, first_name, last_name)')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'active')
      .in('subject_id', subjectIds),
    supabase
      .from('attendance_records')
      .select('session_id, student_id, status')
      .eq('tenant_id', TENANT_ID)
      .in('session_id', sessionIds),
  ])

  // Group students by subject (deduplicated)
  const studentsBySubject: Record<string, Array<{ id: string; name: string; yearGroup: string }>> = {}
  for (const row of (enrolments ?? [])) {
    const st = row.students as unknown as { id: string; first_name: string; last_name: string } | null
    if (!st) continue
    if (!studentsBySubject[row.subject_id]) studentsBySubject[row.subject_id] = []
    if (!studentsBySubject[row.subject_id].some(s => s.id === st.id)) {
      studentsBySubject[row.subject_id].push({
        id: st.id,
        name: `${st.first_name} ${st.last_name}`,
        yearGroup: '',
      })
    }
  }

  // Map attendance records by session → student
  const recordsBySession: Record<string, Record<string, string>> = {}
  for (const rec of (records ?? [])) {
    if (!recordsBySession[rec.session_id]) recordsBySession[rec.session_id] = {}
    recordsBySession[rec.session_id][rec.student_id] = rec.status
  }

  const data = sessions.map(s => {
    const subject = s.subjects as unknown as { id: string; name: string; departments: { name: string } | null } | null
    const room = s.rooms as unknown as { name: string } | null
    const staffMember = s.staff as unknown as { id: string; first_name: string; last_name: string } | null
    const students = (studentsBySubject[s.subject_id] ?? []).sort((a, b) => a.name.localeCompare(b.name))
    const existingRecords = recordsBySession[s.id] ?? {}
    const attendanceMarked = students.length > 0 && students.every(st => existingRecords[st.id])
    const startStr = (s.start_time as string)?.substring(0, 5) ?? ''
    const endStr = (s.end_time as string)?.substring(0, 5) ?? ''

    // Compute duration from start/end times
    let duration = 0
    if (startStr && endStr) {
      const [sh, sm] = startStr.split(':').map(Number)
      const [eh, em] = endStr.split(':').map(Number)
      duration = (eh * 60 + em) - (sh * 60 + sm)
    }

    const teacherName = staffMember
      ? `${staffMember.first_name} ${staffMember.last_name}`.trim()
      : ''

    return {
      id: s.id,
      date: s.session_date,
      day: DAY_NAMES[new Date(s.session_date + 'T00:00:00').getDay()],
      subject: subject?.name ?? 'Unknown',
      department: subject?.departments?.name ?? '',
      teacher: teacherName,
      teacherId: staffMember?.id ?? '',
      room: room?.name ?? '',
      startTime: startStr,
      endTime: endStr,
      duration,
      type: 'Regular',
      status: s.status,
      students,
      studentCount: students.length,
      existingRecords,
      attendanceMarked,
      assignedTAs: [],
    }
  })

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { subject, teacher, room, date, startTime, endTime, repeat, repeatUntil } = body

  if (!date || !startTime || !endTime) {
    return NextResponse.json({ error: 'date, startTime and endTime required' }, { status: 400 })
  }

  // Use IDs directly if provided by the client; otherwise fall back to name lookups
  let subjectId: string | null = body.subjectId ?? null
  let staffId:   string | null = body.teacherId ?? null
  let roomId:    string | null = body.roomId    ?? null

  if (!subjectId || !staffId || !roomId) {
    const [subjectRes, staffRes, roomRes] = await Promise.all([
      (!subjectId && subject)
        ? supabase.from('subjects').select('id').eq('tenant_id', TENANT_ID).eq('name', subject).maybeSingle()
        : Promise.resolve({ data: null }),
      (!staffId && teacher)
        ? supabase.from('staff').select('id').eq('tenant_id', TENANT_ID)
            .ilike('first_name', `%${teacher.split(' ')[0]}%`)
            .ilike('last_name', `%${teacher.split(' ').slice(1).join(' ') || teacher.split(' ')[0]}%`)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      (!roomId && room)
        ? supabase.from('rooms').select('id').eq('tenant_id', TENANT_ID).eq('name', room).maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    if (!subjectId) subjectId = (subjectRes.data as { id: string } | null)?.id ?? null
    if (!staffId)   staffId   = (staffRes.data   as { id: string } | null)?.id ?? null
    if (!roomId)    roomId    = (roomRes.data     as { id: string } | null)?.id ?? null
  }

  // Build list of dates (handle repeat)
  const dates: string[] = [date]
  if (repeat && repeat !== 'None' && repeatUntil) {
    const step = repeat === 'Weekly' ? 7 : 14
    const cur = new Date(date)
    cur.setDate(cur.getDate() + step)
    while (cur.toISOString().split('T')[0] <= repeatUntil) {
      dates.push(cur.toISOString().split('T')[0])
      cur.setDate(cur.getDate() + step)
    }
  }

  const rows = dates.map((d) => ({
    tenant_id:    TENANT_ID,
    branch_id:    BRANCH_ID,
    session_date: d,
    start_time:   startTime,
    end_time:     endTime,
    status:       'scheduled',
    subject_id:   subjectId,
    staff_id:     staffId,
    room_id:      roomId,
  }))

  const { data, error } = await supabase.from('sessions').insert(rows).select('id, session_date')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
