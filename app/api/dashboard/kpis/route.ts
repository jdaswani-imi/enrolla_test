import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function fmtAED(n: number): string {
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}k`
  return `AED ${n.toFixed(0)}`
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  // Run all queries in parallel
  const [
    { count: activeStudents },
    { count: newEnrolments },
    { count: reEnrolments },
    { count: churn },
    invoiceAgg,
    { count: overdueCount },
    { count: unbilledCount },
    { count: openConcerns },
    { count: activeStaff },
    atRiskResult,
  ] = await Promise.all([
    // 1. Active students
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'active'),

    // 2. New enrolments — created in the last 90 days (current term proxy)
    supabase
      .from('enrolments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'active')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),

    // 3. Re-enrolments
    supabase
      .from('enrolments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('status', 're_enrolled'),

    // 4. Churn (withdrawn this year)
    supabase
      .from('enrolments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'withdrawn')
      .gte('updated_at', `${new Date().getFullYear()}-01-01`),

    // 5. Invoice aggregates (revenue + collected)
    supabase
      .from('invoices')
      .select('total, total_paid, status')
      .eq('tenant_id', TENANT_ID),

    // 6. Overdue invoices
    supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'overdue'),

    // 7. Unbilled sessions
    supabase
      .from('unbilled_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'pending'),

    // 8. Open concerns
    supabase
      .from('concerns')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'open'),

    // 9. Active staff
    supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'active'),

    // 10. At-risk students — attendance below 70%
    supabase
      .from('attendance_records')
      .select('student_id, status')
      .eq('tenant_id', TENANT_ID),
  ])

  // Compute revenue/collected from invoice rows
  const invoiceRows = invoiceAgg.data ?? []
  const revenue  = invoiceRows.reduce((s, r) => s + Number(r.total      ?? 0), 0)
  const collected = invoiceRows.reduce((s, r) => s + Number(r.total_paid ?? 0), 0)

  // Compute at-risk: students whose attendance rate < 70%
  const attByStudent: Record<string, { total: number; present: number }> = {}
  for (const row of atRiskResult.data ?? []) {
    const sid = row.student_id as string
    if (!attByStudent[sid]) attByStudent[sid] = { total: 0, present: 0 }
    attByStudent[sid].total++
    if (row.status === 'present') attByStudent[sid].present++
  }
  const atRisk = Object.values(attByStudent).filter(
    ({ total, present }) => total > 0 && (present / total) < 0.7
  ).length

  return NextResponse.json({
    data: {
      'active-students':   { value: String(activeStudents ?? 0) },
      'new-enrolments':    { value: String(newEnrolments  ?? 0) },
      're-enrolments':     { value: String(reEnrolments   ?? 0) },
      'churn':             { value: String(churn          ?? 0) },
      'revenue':           { value: fmtAED(revenue)            },
      'collected':         { value: fmtAED(collected)          },
      'overdue':           { value: String(overdueCount   ?? 0) },
      'unbilled-sessions': { value: String(unbilledCount  ?? 0) },
      'at-risk':           { value: String(atRisk)              },
      'concerns':          { value: String(openConcerns   ?? 0) },
      'active-staff':      { value: String(activeStaff    ?? 0) },
    },
  })
}
