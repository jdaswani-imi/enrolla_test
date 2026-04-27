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
  if (body.type !== undefined) updates.type = body.type
  if (body.startDate !== undefined) updates.start_date = body.startDate
  if (body.endDate !== undefined) updates.end_date = body.endDate
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('calendar_periods')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select('id, academic_year_id, type, name, start_date, end_date, sort_order')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })

  if (body.departmentPauses !== undefined) {
    await supabase.from('calendar_period_dept_pauses').delete().eq('calendar_period_id', id)
    if (body.departmentPauses.length > 0) {
      await supabase.from('calendar_period_dept_pauses').insert(
        body.departmentPauses.map((dp: { departmentId: string; paused: boolean }) => ({
          tenant_id: TENANT_ID,
          calendar_period_id: id,
          department_id: dp.departmentId,
          paused: dp.paused,
        }))
      )
    }
  }

  const { data: pauses } = await supabase
    .from('calendar_period_dept_pauses')
    .select('department_id, paused, departments(id, name)')
    .eq('calendar_period_id', id)

  return NextResponse.json({
    id: data.id,
    academicYearId: data.academic_year_id,
    type: data.type,
    name: data.name,
    startDate: data.start_date,
    endDate: data.end_date,
    sortOrder: data.sort_order,
    departmentPauses: (pauses ?? []).map((dp) => ({
      departmentId: dp.department_id,
      departmentName: (dp.departments as unknown as { name: string } | null)?.name ?? '',
      paused: dp.paused,
    })),
  })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params

  await supabase.from('calendar_period_dept_pauses').delete().eq('calendar_period_id', id)

  const { error } = await supabase
    .from('calendar_periods')
    .delete()
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
