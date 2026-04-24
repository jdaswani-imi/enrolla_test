import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
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
    .from('payments')
    .select(`
      id,
      amount,
      method,
      reference,
      paid_at,
      invoices (
        invoice_ref,
        students (
          id,
          first_name,
          last_name,
          departments ( name )
        )
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('paid_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mapped = (data ?? []).map((p) => {
    const inv = p.invoices as unknown as {
      invoice_ref: string
      students: {
        id: string
        first_name: string
        last_name: string
        departments: { name: string } | null
      } | null
    } | null

    return {
      date: fmtDate(p.paid_at),
      studentId: inv?.students?.id ?? '',
      student: inv?.students ? `${inv.students.first_name} ${inv.students.last_name}` : '—',
      invoice: inv?.invoice_ref ?? '—',
      amount: Number(p.amount),
      method: p.method as string,
      reference: p.reference ?? '',
      recordedBy: '—',
      department: inv?.students?.departments?.name ?? '—',
    }
  })

  return NextResponse.json(mapped)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { invoiceId, amount, method, reference, paid_at } = body

  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      tenant_id: TENANT_ID,
      invoice_id: invoiceId,
      amount,
      method,
      reference: reference || null,
      paid_at,
    })
    .select()
    .single()

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 })

  // Update invoice amount_paid and recalculate status
  const { data: inv } = await supabase
    .from('invoices')
    .select('total, amount_paid')
    .eq('id', invoiceId)
    .single()

  if (inv) {
    const newPaid = Number(inv.amount_paid) + Number(amount)
    const total = Number(inv.total)
    const status = newPaid >= total ? 'Paid' : 'Part'
    await supabase
      .from('invoices')
      .update({ amount_paid: newPaid, status, updated_at: new Date().toISOString() })
      .eq('id', invoiceId)
  }

  return NextResponse.json(payment, { status: 201 })
}
