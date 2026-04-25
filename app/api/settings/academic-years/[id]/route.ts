import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.startDate !== undefined) updates.start_date = body.startDate
  if (body.endDate !== undefined) updates.end_date = body.endDate
  if (body.financialYearStartMonth !== undefined) updates.financial_year_start_month = body.financialYearStartMonth

  if (body.isCurrent === true) {
    await supabase
      .from('academic_years')
      .update({ is_current: false })
      .eq('tenant_id', TENANT_ID)
      .neq('id', id)
    updates.is_current = true
  } else if (body.isCurrent === false) {
    updates.is_current = false
  }

  const { data, error } = await supabase
    .from('academic_years')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select('id, name, start_date, end_date, is_current, financial_year_start_month')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })

  return NextResponse.json({
    id: data.id,
    name: data.name,
    startDate: data.start_date,
    endDate: data.end_date,
    isCurrent: data.is_current,
    financialYearStartMonth: data.financial_year_start_month ?? 1,
  })
}
