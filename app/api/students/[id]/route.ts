import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const { data, error } = await supabase
    .from('students')
    .select(
      `*,
      departments (id, name, colour),
      guardians!students_primary_guardian_id_fkey (
        id, first_name, last_name, phone, email, whatsapp_number,
        is_dnc, is_unsubscribed
      ),
      enrolments (
        id, status, enrolled_at, withdrawn_at, frequency_tier,
        sessions_per_week,
        courses (id, name, rate_per_session,
          subjects (id, name)
        )
      )`
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await request.json()

  delete body.id
  delete body.tenant_id
  delete body.branch_id
  delete body.student_ref
  delete body.created_at

  // Set archived_at when archiving
  if (body.status === 'Archived') {
    body.archived_at = new Date().toISOString()
  }
  // Clear archived_at when unarchiving
  if (body.status && body.status !== 'Archived') {
    body.archived_at = null
  }

  const { data, error } = await supabase
    .from('students')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params

  // Guard: must be Archived first
  const { data: student, error: fetchErr } = await supabase
    .from('students')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchErr || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }
  if (student.status !== 'Archived') {
    return NextResponse.json(
      { error: 'Student must be Archived before deletion.' },
      { status: 422 }
    )
  }

  // Guard: no enrolments (including historical)
  const { count: enrolCount } = await supabase
    .from('enrolments')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', id)

  if (enrolCount && enrolCount > 0) {
    return NextResponse.json(
      { error: 'Cannot delete: student has enrolment records.' },
      { status: 422 }
    )
  }

  // Guard: no attendance records
  const { count: attCount } = await supabase
    .from('attendance_records')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', id)

  if (attCount && attCount > 0) {
    return NextResponse.json(
      { error: 'Cannot delete: student has attendance records.' },
      { status: 422 }
    )
  }

  // Guard: no invoices
  const { count: invCount } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', id)

  if (invCount && invCount > 0) {
    return NextResponse.json(
      { error: 'Cannot delete: student has financial records.' },
      { status: 422 }
    )
  }

  const { error: delErr } = await supabase
    .from('students')
    .delete()
    .eq('id', id)

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
