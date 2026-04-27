import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { data, error } = await supabase
    .from('credits')
    .select(`
      id,
      amount,
      credit_type,
      reason,
      is_used,
      used_on_invoice_id,
      created_at,
      students ( id, first_name, last_name ),
      guardians ( first_name, last_name )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mapped = (data ?? []).map((c) => {
    const s = c.students as unknown as { id: string; first_name: string; last_name: string } | null
    const g = c.guardians as unknown as { first_name: string; last_name: string } | null
    const name = s
      ? `${s.first_name} ${s.last_name}`
      : g ? `${g.first_name} ${g.last_name}` : '—'

    return {
      date: fmtDate(c.created_at),
      studentId: s?.id ?? '',
      student: name,
      amount: Number(c.amount),
      reason: c.reason ?? '—',
      issuedBy: '—',
      status: c.is_used ? 'Applied' : 'Unused',
      department: '—',
      type: c.credit_type as string,
    }
  })

  return NextResponse.json(mapped)
}
