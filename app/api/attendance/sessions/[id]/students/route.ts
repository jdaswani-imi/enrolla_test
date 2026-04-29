import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id: sessionId } = await params
  const { studentId } = await request.json() as { studentId: string }

  if (!studentId) {
    return NextResponse.json({ error: 'studentId required' }, { status: 400 })
  }

  // Verify session exists and get subject_id
  const { data: session, error: sessErr } = await supabase
    .from('sessions')
    .select('id, subject_id')
    .eq('id', sessionId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (sessErr || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Verify student exists and get their name
  const { data: student, error: stuErr } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .eq('id', studentId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (stuErr || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Check if already added (via enrolment or session_students)
  const { data: existing } = await supabase
    .from('session_students')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('session_id', sessionId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Student already in session' }, { status: 409 })
  }

  // Find existing enrolment for this student in this subject (optional link)
  const { data: enrolment } = await supabase
    .from('enrolments')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('student_id', studentId)
    .eq('subject_id', session.subject_id)
    .eq('status', 'enrolled')
    .maybeSingle()

  const { error: insertErr } = await supabase
    .from('session_students')
    .insert({
      tenant_id: TENANT_ID,
      session_id: sessionId,
      student_id: studentId,
      enrolment_id: enrolment?.id ?? null,
    })

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({
    student: {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
    },
  }, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id: sessionId } = await params
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')

  if (!studentId) {
    return NextResponse.json({ error: 'studentId required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('session_students')
    .delete()
    .eq('tenant_id', TENANT_ID)
    .eq('session_id', sessionId)
    .eq('student_id', studentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
