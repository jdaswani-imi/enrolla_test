import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID, BRANCH_ID } from '@/lib/api-constants'
import { requireAuth, requireRole } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { data, error } = await supabase
    .from('academic_years')
    .select('id, name, start_date, end_date, is_current, financial_year_start_month')
    .eq('tenant_id', TENANT_ID)
    .order('start_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json((data ?? []).map((y) => ({
    id: y.id,
    name: y.name,
    startDate: y.start_date,
    endDate: y.end_date,
    isCurrent: y.is_current,
    financialYearStartMonth: y.financial_year_start_month ?? 1,
  })))
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(['super_admin', 'admin_head'])
  if (!auth.ok) return auth.response
  const body = await request.json()
  const { name, startDate, endDate, isCurrent = false, financialYearStartMonth = 1 } = body

  if (!name?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: 'name, startDate, endDate required' }, { status: 400 })
  }

  if (isCurrent) {
    await supabase
      .from('academic_years')
      .update({ is_current: false })
      .eq('tenant_id', TENANT_ID)
      .eq('is_current', true)
  }

  const { data, error } = await supabase
    .from('academic_years')
    .insert({
      tenant_id: TENANT_ID,
      branch_id: BRANCH_ID,
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      is_current: isCurrent,
      financial_year_start_month: financialYearStartMonth,
    })
    .select('id, name, start_date, end_date, is_current, financial_year_start_month')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    id: data.id,
    name: data.name,
    startDate: data.start_date,
    endDate: data.end_date,
    isCurrent: data.is_current,
    financialYearStartMonth: data.financial_year_start_month ?? 1,
  }, { status: 201 })
}
