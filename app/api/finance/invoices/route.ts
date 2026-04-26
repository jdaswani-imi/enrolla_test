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
    .from('invoices')
    .select(`
      id,
      invoice_number,
      status,
      subtotal,
      vat_amount,
      total,
      total_paid,
      amount_due,
      issue_date,
      due_date,
      notes,
      students (
        id,
        student_number,
        first_name,
        last_name
      ),
      invoice_lines (
        description,
        line_type,
        amount
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json([], { status: 200 })

  const mapped = (data ?? []).map((inv) => {
    const s = inv.students as unknown as {
      id: string; student_number: number; first_name: string; last_name: string
    } | null
    const lines = inv.invoice_lines as unknown as { description: string; line_type: string; amount: number }[] | null

    return {
      id: inv.invoice_number,
      uuid: inv.id,
      studentId: s?.id ?? '',
      studentRef: s ? `IMI-${String(s.student_number).padStart(4, '0')}` : '—',
      student: s ? `${s.first_name} ${s.last_name}` : '—',
      yearGroup: '—',
      department: '—',
      guardian: '—',
      issueDate: fmtDate(inv.issue_date),
      dueDate: inv.due_date ? fmtDate(inv.due_date) : '—',
      amount: Number(inv.total),
      amountPaid: Number(inv.total_paid),
      amountDue: Number(inv.amount_due),
      status: inv.status,
      description: lines?.[0]?.description ?? '—',
    }
  })

  return NextResponse.json(mapped)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      tenant_id: TENANT_ID,
      student_id: body.studentId,
      invoice_number: body.invoiceNumber,
      status: body.status ?? 'draft',
      issue_date: body.issueDate ?? new Date().toISOString().split('T')[0],
      due_date: body.dueDate ?? null,
      subtotal: body.subtotal ?? 0,
      vat_amount: body.vatAmount ?? 0,
      total: body.total ?? 0,
      total_paid: 0,
      amount_due: body.total ?? 0,
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
