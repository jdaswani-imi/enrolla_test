import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STATUS_MAP: Record<string, string> = {
  Present: 'present',
  Late: 'late',
  'Absent-Notified': 'absent',
  'Absent-NoNotice': 'absent',
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id: sessionId } = await params
  const { records } = await request.json() as {
    records: Array<{ student_id: string; status: string; reason?: string }>
  }

  if (!records?.length) {
    return NextResponse.json({ error: 'No records provided' }, { status: 400 })
  }

  // Fetch session to get subject_id (needed to look up enrolments)
  const { data: session, error: sessErr } = await supabase
    .from('sessions')
    .select('subject_id')
    .eq('id', sessionId)
    .single()

  if (sessErr || !session) {
    return NextResponse.json({ error: sessErr?.message ?? 'Session not found' }, { status: 404 })
  }

  // Lookup enrolment IDs for each student in this subject
  const studentIds = records.map(r => r.student_id)
  const { data: enrolments } = await supabase
    .from('enrolments')
    .select('id, student_id')
    .eq('tenant_id', TENANT_ID)
    .eq('subject_id', session.subject_id)
    .in('student_id', studentIds)

  const enrolmentMap = new Map((enrolments ?? []).map(e => [e.student_id, e.id]))

  const rows = records
    .filter(r => enrolmentMap.has(r.student_id))
    .map(r => ({
      tenant_id: TENANT_ID,
      session_id: sessionId,
      student_id: r.student_id,
      enrolment_id: enrolmentMap.get(r.student_id)!,
      status: STATUS_MAP[r.status] ?? 'present',
      notes: r.reason ?? null,
      marked_at: new Date().toISOString(),
    }))

  if (!rows.length) {
    return NextResponse.json({ error: 'No matching enrolments found for these students' }, { status: 400 })
  }

  const { error } = await supabase
    .from('attendance_records')
    .upsert(rows, { onConflict: 'session_id,student_id', ignoreDuplicates: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
