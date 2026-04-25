import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
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
    .from('trial_classes')
    .select(`
      id,
      student_name,
      year_group,
      subject_name,
      teacher_name,
      trial_date,
      invoice_status,
      outcome,
      notes,
      follow_up_date,
      cancellation_reason,
      student_id,
      students (
        id,
        first_name,
        last_name,
        student_ref,
        year_group
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((t: any) => {
    const studentName =
      t.student_name ||
      (t.students
        ? `${t.students.first_name} ${t.students.last_name}`.trim()
        : '')

    const yearGroup = t.year_group || t.students?.year_group || ''

    return {
      id: t.id,
      student: studentName,
      yearGroup,
      subject: t.subject_name ?? '',
      teacher: t.teacher_name ?? '—',
      trialDate: t.trial_date
        ? new Date(t.trial_date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '—',
      invoiceStatus: (t.invoice_status ?? 'Pending') as 'Paid' | 'Pending',
      outcome: (t.outcome ?? 'Pending') as string,
      notes: t.notes ?? undefined,
      followUpDate: t.follow_up_date ?? undefined,
      cancellationReason: t.cancellation_reason ?? undefined,
    }
  })

  return NextResponse.json(rows)
}
