import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  // Revenue from paid invoices, grouped by issue month
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('total, issue_date, status')
    .eq('tenant_id', TENANT_ID)
    .in('status', ['paid', 'partially_paid'])
    .order('issue_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build monthly revenue map for current year
  const now = new Date()
  const currentYear = now.getFullYear()
  const byMonth: Record<string, number> = {}

  for (const inv of invoices ?? []) {
    if (!inv.issue_date) continue
    const d = new Date(inv.issue_date)
    if (d.getFullYear() !== currentYear) continue
    const key = MONTHS[d.getMonth()]
    byMonth[key] = (byMonth[key] ?? 0) + Number(inv.total ?? 0)
  }

  const monthlyRevenue = MONTHS.slice(0, now.getMonth() + 1).map(m => ({
    month: m,
    revenue: Math.round(byMonth[m] ?? 0),
  }))

  // Revenue by department — query students + enrolments + invoices
  // Simplified: return per-department totals from invoice total_paid summed by year_group mapping
  const { data: studentRevenue } = await supabase
    .from('invoices')
    .select(`
      total,
      students(year_group)
    `)
    .eq('tenant_id', TENANT_ID)
    .in('status', ['paid', 'partially_paid'])

  const byDept: Record<string, number> = { Primary: 0, 'Lower Secondary': 0, 'Upper Secondary': 0 }
  for (const inv of studentRevenue ?? []) {
    const yg = (inv.students as { year_group?: string } | null)?.year_group ?? ''
    const n = Number(yg.replace('Y', ''))
    const dept =
      yg.startsWith('KG') || (!isNaN(n) && n <= 6)  ? 'Primary'
      : !isNaN(n) && n <= 9                           ? 'Lower Secondary'
      : !isNaN(n) && n >= 10                          ? 'Upper Secondary'
      : 'Other'
    byDept[dept] = (byDept[dept] ?? 0) + Number(inv.total ?? 0)
  }

  const bySegment = Object.entries(byDept).map(([segment, total]) => ({
    segment,
    total: Math.round(total),
  }))

  const grandTotal = monthlyRevenue.reduce((s, m) => s + m.revenue, 0)

  return NextResponse.json({ data: { monthlyRevenue, bySegment, grandTotal } })
}
