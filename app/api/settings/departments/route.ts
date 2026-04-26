import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID, BRANCH_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { data: depts, error } = await supabase
    .from('departments')
    .select('id, name, year_group_from, year_group_to, colour, is_active, sort_order')
    .eq('tenant_id', TENANT_ID)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Count students per department (Active + Trial + Graduated + Alumni)
  const { data: allStudents } = await supabase
    .from('students')
    .select('department_id, status')
    .eq('tenant_id', TENANT_ID)
    .in('status', ['Active', 'Trial', 'Graduated', 'Alumni'])

  // Find the highest-sort-order (last) department for Graduated/Alumni fallback
  const sortedDepts = (depts ?? []).slice().sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0))
  const fallbackDeptId = sortedDepts[0]?.id ?? null

  const countMap: Record<string, number> = {}
  for (const s of allStudents ?? []) {
    const deptId = s.department_id
      ?? ((s.status === 'Graduated' || s.status === 'Alumni') ? fallbackDeptId : null)
    if (deptId) countMap[deptId] = (countMap[deptId] ?? 0) + 1
  }

  const result = (depts ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    yearGroupFrom: d.year_group_from,
    yearGroupTo: d.year_group_to,
    colour: d.colour,
    active: d.is_active,
    sortOrder: d.sort_order,
    studentCount: countMap[d.id] ?? 0,
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()
  const { name, yearGroupFrom, yearGroupTo, colour, sortOrder } = body

  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('departments')
    .select('sort_order')
    .eq('tenant_id', TENANT_ID)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSort = sortOrder ?? ((existing?.[0]?.sort_order ?? 0) + 1)

  const { data, error } = await supabase
    .from('departments')
    .insert({
      tenant_id: TENANT_ID,
      branch_id: BRANCH_ID,
      name: name.trim(),
      year_group_from: yearGroupFrom,
      year_group_to: yearGroupTo,
      colour: colour ?? '#94A3B8',
      is_active: true,
      sort_order: nextSort,
    })
    .select('id, name, year_group_from, year_group_to, colour, is_active, sort_order')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    id: data.id,
    name: data.name,
    yearGroupFrom: data.year_group_from,
    yearGroupTo: data.year_group_to,
    colour: data.colour,
    active: data.is_active,
    sortOrder: data.sort_order,
    studentCount: 0,
  }, { status: 201 })
}
