import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params

  const [studentRes, attRes, attemptsRes, notesRes] = await Promise.all([
    supabase
      .from('students')
      .select('id, first_name, last_name, year_group, status, notes, created_at')
      .eq('tenant_id', TENANT_ID)
      .eq('id', id)
      .maybeSingle(),

    supabase
      .from('attendance_records')
      .select('id, status, session_id, sessions(session_date, subjects(name))')
      .eq('tenant_id', TENANT_ID)
      .eq('student_id', id)
      .order('created_at', { ascending: false }),

    supabase
      .from('assessment_attempts')
      .select('id, score, absent, grade, notes, assessed_at, subjects(name)')
      .eq('tenant_id', TENANT_ID)
      .eq('student_id', id)
      .order('assessed_at', { ascending: false }),

    supabase
      .from('student_notes')
      .select('id, body, created_at, staff(first_name, last_name)')
      .eq('tenant_id', TENANT_ID)
      .eq('student_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (studentRes.error) return NextResponse.json({ error: studentRes.error.message }, { status: 500 })
  if (!studentRes.data) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const s = studentRes.data
  const attRecords = attRes.data ?? []
  const attempts = attemptsRes.data ?? []
  const notes = notesRes.data ?? []

  const total = attRecords.length
  const present = attRecords.filter(r => r.status === 'present').length
  const attRate = total > 0 ? Math.round((present / total) * 100) : null

  const scores = attempts.map(a => a.absent ? 0 : (a.score ?? 0))
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  return NextResponse.json({
    data: {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`.trim(),
      yearGroup: s.year_group,
      status: s.status,
      attendanceRate: attRate,
      avgScore,
      attendance: attRecords.map(r => ({
        id: r.id,
        status: r.status,
        sessionDate: (r.sessions as { session_date?: string } | null)?.session_date ?? null,
        subject: ((r.sessions as { subjects?: { name?: string } | null } | null)?.subjects as { name?: string } | null)?.name ?? null,
      })),
      assessmentAttempts: attempts.map(a => ({
        id: a.id,
        score: a.score,
        absent: a.absent,
        grade: a.grade,
        notes: a.notes,
        assessedAt: a.assessed_at,
        subject: (a.subjects as { name?: string } | null)?.name ?? null,
      })),
      teacherNotes: notes.map(n => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const staffRow = n.staff as any
        return {
          id: n.id,
          body: n.body,
          createdAt: n.created_at,
          author: staffRow ? `${staffRow.first_name ?? ''} ${staffRow.last_name ?? ''}`.trim() : null,
        }
      }),
    },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await req.json()
  const { note } = body as { note?: string }

  if (!note?.trim()) {
    return NextResponse.json({ error: 'note is required' }, { status: 400 })
  }

  // Resolve staff id from auth user
  const { data: staffRow } = await supabase
    .from('staff')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  const { data, error } = await supabase
    .from('student_notes')
    .insert({
      tenant_id: TENANT_ID,
      student_id: id,
      author_id: staffRow?.id ?? null,
      body: note.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
