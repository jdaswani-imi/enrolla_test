import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID, BRANCH_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Converts invoice UI short codes to DB year_group names ("Y4" → "Year 4", "KG1" stays "KG1")
function normaliseYearGroup(raw: string): string {
  const m = raw.match(/^Y(\d+)$/)
  return m ? `Year ${m[1]}` : raw
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  let query = supabase
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

  if (q) {
    query = query.or(`invoice_number.ilike.%${q}%`)
  }

  const { data, error } = await query

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

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      tenant_id: TENANT_ID,
      student_id: body.studentId,
      invoice_number: body.invoiceNumber,
      status: (body.status as string | undefined)?.toLowerCase() ?? 'draft',
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

  // Write invoice_lines with resolved enrolment_id so v_enrolment_sessions can compute sessions.
  // lineItems: { subject, yearGroup, sessions, rate }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems: any[] = Array.isArray(body.lineItems) ? body.lineItems : []
  if (lineItems.length > 0 && body.studentId) {
    const lineRows = await Promise.all(lineItems.map(async (item) => {
      let enrolmentId: string | null = item.enrolmentId ?? null

      if (!enrolmentId && item.subject && item.yearGroup) {
        // Normalise short year group codes ("Y4" → "Year 4", "KG1" stays "KG1")
        const ygNorm = normaliseYearGroup(item.yearGroup)

        // Look up year_group_id
        const { data: yg } = await supabase
          .from('year_groups')
          .select('id')
          .eq('tenant_id', TENANT_ID)
          .eq('name', ygNorm)
          .maybeSingle()

        if (yg) {
          // Look up subject_id by name + year_group (limit 1 handles rare name duplicates)
          const { data: subjRows } = await supabase
            .from('subjects')
            .select('id')
            .eq('tenant_id', TENANT_ID)
            .eq('year_group_id', yg.id)
            .eq('name', item.subject)
            .limit(1)
          const subj = subjRows?.[0] ?? null

          if (subj) {
            // Find existing non-withdrawn enrolment for this (student, subject)
            const { data: existingRows } = await supabase
              .from('enrolments')
              .select('id')
              .eq('tenant_id', TENANT_ID)
              .eq('student_id', body.studentId)
              .eq('subject_id', subj.id)
              .neq('status', 'withdrawn')
              .limit(1)
            const existing = existingRows?.[0] ?? null

            if (existing) {
              enrolmentId = existing.id
            } else {
              // Create a pending enrolment — activated by the invoice-paid trigger
              const { data: created } = await supabase
                .from('enrolments')
                .insert({
                  tenant_id: TENANT_ID,
                  student_id: body.studentId,
                  subject_id: subj.id,
                  branch_id: body.branchId ?? BRANCH_ID,
                  status: 'pending',
                  sessions_remaining: 0,
                  price_at_enrolment: item.rate ?? 0,
                })
                .select('id')
                .single()

              enrolmentId = created?.id ?? null
            }
          }
        }
      }

      return {
        tenant_id: TENANT_ID,
        invoice_id: invoice.id,
        enrolment_id: enrolmentId,
        line_type: item.lineType ?? 'subject',
        description: item.subject
          ? `${item.yearGroup ?? ''} ${item.subject}`.trim()
          : (item.description ?? ''),
        sessions_purchased: item.sessions ?? 0,
        quantity: item.sessions ?? 1,
        unit_price: item.rate ?? 0,
        vat_rate: 0,
        amount: (item.sessions ?? 0) * (item.rate ?? 0),
      }
    }))

    await supabase.from('invoice_lines').insert(lineRows)
  }

  return NextResponse.json({ data: invoice }, { status: 201 })
}
