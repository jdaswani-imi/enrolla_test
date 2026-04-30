import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth, requireRole } from '@/lib/supabase/route-auth'

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
      schools (id, name),
      guardians!students_primary_guardian_id_fkey (
        id, first_name, last_name, phone, email
      ),
      enrolments (
        id, status, start_date, end_date,
        subjects (
          id, name,
          year_groups (id, name),
          departments (id, name, colour)
        )
      )`
    )
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Enrich enrolments with computed sessions from the view
  const enrolmentIds: string[] = (data.enrolments ?? []).map((e: { id: string }) => e.id)
  if (enrolmentIds.length > 0) {
    const { data: sessionRows } = await supabase
      .from('v_enrolment_sessions')
      .select('enrolment_id, sessions_paid, sessions_attended, sessions_remaining')
      .in('enrolment_id', enrolmentIds)

    const sessionsMap = new Map(
      (sessionRows ?? []).map((s) => [s.enrolment_id, s])
    )
    data.enrolments = data.enrolments.map((e: { id: string; [key: string]: unknown }) => ({
      ...e,
      sessions_paid: sessionsMap.get(e.id)?.sessions_paid ?? 0,
      sessions_attended: sessionsMap.get(e.id)?.sessions_attended ?? 0,
      sessions_remaining: sessionsMap.get(e.id)?.sessions_remaining ?? 0,
    }))
  }

  return NextResponse.json({ data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(['super_admin', 'admin_head', 'admin'])
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
    .eq('tenant_id', TENANT_ID)
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
  // Only Super Admin may permanently delete a student
  const auth = await requireRole(['super_admin'])
  if (!auth.ok) return auth.response
  const { id } = await params

  // Guard: must be Archived first
  const { data: student, error: fetchErr } = await supabase
    .from('students')
    .select('id, status')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
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
    .eq('tenant_id', TENANT_ID)

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
    .eq('tenant_id', TENANT_ID)

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
    .eq('tenant_id', TENANT_ID)

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
    .eq('tenant_id', TENANT_ID)

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
