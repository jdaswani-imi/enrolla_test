import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { data, error } = await supabase
    .from('withdrawal_records')
    .select(`
      id,
      student_id,
      enrolment_id,
      scope,
      reason,
      notes,
      record_status,
      invoice_status,
      sessions_remaining,
      subjects,
      created_at,
      students (
        id,
        first_name,
        last_name,
        student_ref,
        year_group,
        departments (
          name
        )
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((w: any) => ({
    id: w.id,
    studentUuid: w.students?.id ?? '',
    studentId: w.students?.student_ref ?? '',
    student: w.students
      ? `${w.students.first_name} ${w.students.last_name}`.trim()
      : '',
    enrolmentId: w.enrolment_id ?? undefined,
    yearGroup: w.students?.year_group ?? '',
    department: w.students?.departments?.name ?? '',
    subjects: w.subjects ?? [],
    withdrawalDate: w.created_at
      ? new Date(w.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Pending',
    reason: w.reason ?? '',
    invoiceStatus: (w.invoice_status ?? 'Pending') as string,
    notes: w.notes ?? undefined,
    sessionsRemaining: w.sessions_remaining ?? undefined,
    recordStatus: (w.record_status ?? 'Active') as string,
  }))

  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()
  // body: { enrolments: EnrolmentRow[], studentUuid: string, reason, notes, retention, fullWithdrawal }

  const today = new Date().toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withdrawalInserts = body.enrolments.map((e: any) => ({
    tenant_id: TENANT_ID,
    student_id: e.studentUuid,
    enrolment_id: e.id,
    scope: body.fullWithdrawal ? 'full' : 'subject',
    reason: body.reason,
    notes: body.notes || null,
    retention_outcome: body.retention?.length ? body.retention.join(', ') : null,
    record_status: 'Active',
    invoice_status: e.invoiceStatus,
    sessions_remaining: e.sessionsRemaining,
    subjects: [e.subject],
  }))

  const { error: wrErr } = await supabase
    .from('withdrawal_records')
    .insert(withdrawalInserts)

  if (wrErr) return NextResponse.json({ error: wrErr.message }, { status: 500 })

  // Mark each enrolment as Withdrawn
  for (const e of body.enrolments) {
    await supabase
      .from('enrolments')
      .update({
        status: 'Withdrawn',
        withdrawn_at: today,
        updated_at: new Date().toISOString(),
      })
      .eq('id', e.id)
      .eq('tenant_id', TENANT_ID)
  }

  // Full withdrawal: also update student status
  if (body.fullWithdrawal && body.studentUuid) {
    await supabase
      .from('students')
      .update({
        status: 'Withdrawn',
        withdrawn_at: today,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.studentUuid)
      .eq('tenant_id', TENANT_ID)
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
