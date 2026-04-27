import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STATUS_MAP: Record<string, 'Completed' | 'Pending' | 'Confirmed' | 'Expired'> = {
  booked: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Expired',
  pending: 'Pending',
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  // makeup_sessions → makeup_allowances → enrolments → students
  const { data: makeups, error } = await supabase
    .from('makeup_sessions')
    .select(`
      id, status, created_at, original_session_id, makeup_session_id,
      makeup_allowances (
        enrolments (
          student_id,
          students (id, first_name, last_name)
        )
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!makeups?.length) return NextResponse.json({ data: [] })

  const originalSessionIds = makeups.map(m => m.original_session_id).filter(Boolean)
  const replacementSessionIds = makeups.map(m => m.makeup_session_id).filter(Boolean)

  const [{ data: origSessions }, { data: replacementSessions }] = await Promise.all([
    originalSessionIds.length
      ? supabase
          .from('sessions')
          .select('id, session_date, subjects (name, departments (name)), staff (id)')
          .in('id', originalSessionIds)
      : Promise.resolve({ data: [] }),
    replacementSessionIds.length
      ? supabase
          .from('sessions')
          .select('id, session_date')
          .in('id', replacementSessionIds)
      : Promise.resolve({ data: [] }),
  ])

  const origSessionMap = new Map((origSessions ?? []).map(s => [s.id, s]))
  const replacementSessionMap = new Map((replacementSessions ?? []).map(s => [s.id, s]))

  const data = makeups.map(m => {
    const allowance = m.makeup_allowances as unknown as {
      enrolments: { student_id: string; students: { id: string; first_name: string; last_name: string } | null } | null
    } | null
    const studentRow = allowance?.enrolments?.students
    const origSession = origSessionMap.get(m.original_session_id)
    const replSession = m.makeup_session_id ? replacementSessionMap.get(m.makeup_session_id) : null
    const subj = origSession?.subjects as unknown as { name: string; departments: { name: string } | null } | null
    const staff = origSession?.staff as unknown as { id: string } | null

    return {
      id: m.id,
      originalSession: origSession?.session_date
        ? new Date(origSession.session_date as string + 'T00:00:00').toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        : '—',
      subject: subj?.name ?? '—',
      student: studentRow ? `${studentRow.first_name} ${studentRow.last_name}` : '—',
      makeupDate: replSession?.session_date
        ? new Date(replSession.session_date as string + 'T00:00:00').toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        : 'TBC',
      status: STATUS_MAP[m.status] ?? 'Pending',
      teacherId: staff?.id ?? '',
      dept: subj?.departments?.name ?? '',
    }
  })

  return NextResponse.json({ data })
}
