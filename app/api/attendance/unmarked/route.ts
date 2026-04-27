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
  const days = Math.min(parseInt(searchParams.get('days') ?? '7', 10), 30)

  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)
  const from = fromDate.toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const { data: sessions, error: sessErr } = await supabase
    .from('sessions')
    .select('id, session_date, subject_id, subjects (name, departments (name)), staff (id, first_name, last_name)')
    .eq('tenant_id', TENANT_ID)
    .neq('status', 'cancelled')
    .gte('session_date', from)
    .lte('session_date', today)
    .order('session_date', { ascending: false })

  if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 })
  if (!sessions?.length) return NextResponse.json({ data: [] })

  const sessionIds = sessions.map(s => s.id)
  const subjectIds = [...new Set(sessions.map(s => s.subject_id).filter(Boolean))]

  const [{ data: enrolCounts }, { data: recCounts }] = await Promise.all([
    supabase
      .from('enrolments')
      .select('subject_id, student_id')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'enrolled')
      .in('subject_id', subjectIds),
    supabase
      .from('attendance_records')
      .select('session_id, student_id')
      .eq('tenant_id', TENANT_ID)
      .in('session_id', sessionIds),
  ])

  const enrolledBySubject: Record<string, number> = {}
  for (const row of (enrolCounts ?? [])) {
    enrolledBySubject[row.subject_id] = (enrolledBySubject[row.subject_id] ?? 0) + 1
  }

  const markedBySession: Record<string, number> = {}
  for (const row of (recCounts ?? [])) {
    markedBySession[row.session_id] = (markedBySession[row.session_id] ?? 0) + 1
  }

  const now = Date.now()

  const data = sessions
    .filter(s => {
      const enrolled = enrolledBySubject[s.subject_id] ?? 0
      const marked = markedBySession[s.id] ?? 0
      return enrolled > 0 && marked < enrolled
    })
    .map(s => {
      const subj = s.subjects as unknown as { name: string; departments: { name: string } | null } | null
      const staff = s.staff as unknown as { id: string; first_name: string; last_name: string } | null
      const hoursElapsed = Math.floor((now - new Date(s.session_date + 'T00:00:00').getTime()) / 3600000)
      const hoursRemaining = Math.max(0, 48 - hoursElapsed)
      const overdue = hoursElapsed >= 48
      const teacherName = staff ? `${staff.first_name} ${staff.last_name}`.trim() : ''

      return {
        id: s.id,
        subject: subj?.name ?? 'Unknown',
        date: s.session_date,
        dept: subj?.departments?.name ?? '',
        teacher: teacherName,
        teacherId: staff?.id ?? '',
        hoursRemaining,
        overdue,
      }
    })

  return NextResponse.json({ data })
}
