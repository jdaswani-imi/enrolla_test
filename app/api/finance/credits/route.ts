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

const SOURCE_TO_TYPE: Record<string, string> = {
  manual: 'manual',
  overpayment: 'overpayment',
  refund: 'refund',
  promotional: 'promotional',
}

export async function GET() {
  const { data, error } = await supabase
    .from('credit_ledger')
    .select(`
      id,
      amount,
      source,
      applied_to_invoice_id,
      reason,
      created_at,
      guardians (
        first_name,
        last_name
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mapped = (data ?? []).map((c) => {
    const g = c.guardians as unknown as { first_name: string; last_name: string } | null
    return {
      date: fmtDate(c.created_at),
      studentId: '',
      student: g ? `${g.first_name} ${g.last_name}` : '—',
      amount: Number(c.amount),
      reason: c.reason ?? '—',
      issuedBy: '—',
      status: c.applied_to_invoice_id ? 'Applied' : 'Unused',
      department: '—',
      type: SOURCE_TO_TYPE[c.source] ?? 'manual',
    }
  })

  return NextResponse.json(mapped)
}
