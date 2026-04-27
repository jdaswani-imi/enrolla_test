import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
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
    .from('payments')
    .select(`
      id,
      amount,
      payment_method,
      reference,
      payment_date,
      notes,
      students ( id, first_name, last_name ),
      invoices ( invoice_number ),
      recorder:staff!payments_recorded_by_fkey ( first_name, last_name )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('payment_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mapped = (data ?? []).map((p) => {
    const s = p.students as unknown as { id: string; first_name: string; last_name: string } | null
    const inv = p.invoices as unknown as { invoice_number: string } | null
    const rec = p.recorder as unknown as { first_name: string; last_name: string } | null

    return {
      date: fmtDate(p.payment_date),
      studentId: s?.id ?? '',
      student: s ? `${s.first_name} ${s.last_name}` : '—',
      invoice: inv?.invoice_number ?? '—',
      amount: Number(p.amount),
      method: p.payment_method as string,
      reference: p.reference ?? '',
      recordedBy: rec ? `${rec.first_name} ${rec.last_name}`.trim() : '—',
      department: '—',
    }
  })

  return NextResponse.json(mapped)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()
  const { invoiceId, studentId, amount, method, reference, payment_date } = body

  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      tenant_id: TENANT_ID,
      invoice_id: invoiceId,
      student_id: studentId,
      amount,
      payment_method: method,
      reference: reference || null,
      payment_date,
    })
    .select()
    .single()

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 })

  // Update invoice total_paid and recalculate status
  const { data: inv } = await supabase
    .from('invoices')
    .select('total, total_paid')
    .eq('id', invoiceId)
    .single()

  if (inv) {
    const newPaid = Number(inv.total_paid) + Number(amount)
    const total = Number(inv.total)
    const status = newPaid >= total ? 'paid' : 'partially_paid'
    await supabase
      .from('invoices')
      .update({ total_paid: newPaid, amount_due: Math.max(0, total - newPaid), status, updated_at: new Date().toISOString() })
      .eq('id', invoiceId)
  }

  return NextResponse.json(payment, { status: 201 })
}
