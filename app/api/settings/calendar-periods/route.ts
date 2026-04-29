import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth, requireRole } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  const yearId = searchParams.get('yearId')

  let query = supabase
    .from('calendar_periods')
    .select(`
      id, academic_year_id, type, name, start_date, end_date, sort_order,
      calendar_period_dept_pauses ( id, department_id, paused,
        departments ( id, name, colour )
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('sort_order', { ascending: true })

  if (yearId) query = query.eq('academic_year_id', yearId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (data ?? []).map((p) => ({
    id: p.id,
    academicYearId: p.academic_year_id,
    type: p.type,
    name: p.name,
    startDate: p.start_date,
    endDate: p.end_date,
    sortOrder: p.sort_order,
    departmentPauses: (p.calendar_period_dept_pauses ?? []).map((dp: {
      department_id: string;
      paused: boolean;
      departments: unknown;
    }) => ({
      departmentId: dp.department_id,
      departmentName: (dp.departments as { name: string } | null)?.name ?? '',
      paused: dp.paused,
    })),
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(['super_admin', 'admin_head'])
  if (!auth.ok) return auth.response
  const body = await request.json()
  const { academicYearId, type, name, startDate, endDate, sortOrder, departmentPauses = [] } = body

  if (!academicYearId || !type || !name?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: 'academicYearId, type, name, startDate, endDate required' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('calendar_periods')
    .select('sort_order')
    .eq('tenant_id', TENANT_ID)
    .eq('academic_year_id', academicYearId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSort = sortOrder ?? ((existing?.[0]?.sort_order ?? 0) + 1)

  const { data, error } = await supabase
    .from('calendar_periods')
    .insert({
      tenant_id: TENANT_ID,
      academic_year_id: academicYearId,
      type,
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      sort_order: nextSort,
    })
    .select('id, academic_year_id, type, name, start_date, end_date, sort_order')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (departmentPauses.length > 0) {
    await supabase.from('calendar_period_dept_pauses').insert(
      departmentPauses.map((dp: { departmentId: string; paused: boolean }) => ({
        tenant_id: TENANT_ID,
        calendar_period_id: data.id,
        department_id: dp.departmentId,
        paused: dp.paused,
      }))
    )
  }

  return NextResponse.json({
    id: data.id,
    academicYearId: data.academic_year_id,
    type: data.type,
    name: data.name,
    startDate: data.start_date,
    endDate: data.end_date,
    sortOrder: data.sort_order,
    departmentPauses,
  }, { status: 201 })
}
