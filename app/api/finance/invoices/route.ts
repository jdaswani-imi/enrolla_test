import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export async function GET() {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_ref,
      status,
      total,
      amount_paid,
      due_date,
      issued_at,
      lead_id,
      students (
        id,
        first_name,
        last_name,
        year_group,
        departments ( name )
      ),
      guardians (
        first_name,
        last_name
      ),
      invoice_line_items ( description )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mapped = (data ?? []).map((inv) => {
    const s = inv.students as unknown as {
      id: string
      first_name: string
      last_name: string
      year_group: string | null
      departments: { name: string } | null
    } | null
    const g = inv.guardians as unknown as { first_name: string; last_name: string } | null
    const lines = inv.invoice_line_items as unknown as { description: string }[] | null

    return {
      id: inv.invoice_ref,
      uuid: inv.id,
      studentId: s?.id ?? '',
      student: s ? `${s.first_name} ${s.last_name}` : '—',
      yearGroup: s?.year_group ?? '—',
      department: s?.departments?.name ?? '—',
      guardian: g ? `${g.first_name} ${g.last_name}` : '—',
      issueDate: fmtDate(inv.issued_at),
      dueDate: inv.due_date ? fmtDate(inv.due_date) : '—',
      amount: Number(inv.total),
      amountPaid: Number(inv.amount_paid),
      status: inv.status,
      leadId: inv.lead_id ?? undefined,
      description: lines?.[0]?.description ?? '—',
    }
  })

  return NextResponse.json(mapped)
}
