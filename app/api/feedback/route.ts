import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? ''
  const subject = searchParams.get('subject') ?? ''
  const teacher = searchParams.get('teacher') ?? ''
  const dept = searchParams.get('department') ?? ''

  let query = supabase
    .from('feedback_items')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (subject) query = query.eq('subject', subject)
  if (teacher) query = query.eq('teacher', teacher)
  if (dept) query = query.eq('department', dept)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: (data ?? []).map(r => ({
      id: r.id,
      studentName: r.student_name ?? '',
      subject: r.subject ?? '',
      teacher: r.teacher ?? '',
      department: r.department ?? '',
      sessionDate: r.session_date ?? '',
      status: r.status ?? 'Draft',
      score: r.score ?? 0,
      aiSummary: r.ai_summary ?? null,
      selectors: r.selectors ?? [],
      teacherNotes: r.teacher_notes ?? '',
    })),
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await req.json()
  const {
    studentName, studentId, subject, teacher, teacherId,
    department, sessionDate, sessionId, score, teacherNotes, aiSummary, selectors,
  } = body

  if (!studentName || !subject || !teacher || !sessionDate || !score) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('feedback_items')
    .insert({
      tenant_id: TENANT_ID,
      student_name: studentName,
      student_id: studentId ?? null,
      subject,
      teacher,
      teacher_id: teacherId ?? null,
      department: department ?? null,
      session_date: sessionDate,
      session_id: sessionId ?? null,
      status: 'Draft',
      score,
      ai_summary: aiSummary ?? null,
      selectors: selectors ?? [],
      teacher_notes: teacherNotes ?? '',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
