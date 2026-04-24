import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const TENANT_ID = 'b2000000-0000-0000-0000-000000000001'
const BRANCH_ID = 'c3000000-0000-0000-0000-000000000001'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const department_id = searchParams.get('department_id')
  const year_group = searchParams.get('year_group')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  let query = supabase
    .from('students')
    .select(
      `*,
      departments (id, name, colour),
      guardians!students_primary_guardian_id_fkey (id, first_name, last_name, phone)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (department_id) query = query.eq('department_id', department_id)
  if (year_group) query = query.eq('year_group', year_group)
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,student_ref.ilike.%${search}%`
    )
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    meta: {
      total: count,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (!body.first_name || !body.last_name || !body.year_group) {
    return NextResponse.json(
      { error: 'first_name, last_name and year_group are required' },
      { status: 400 }
    )
  }

  const { data: settings } = await supabase
    .from('tenant_settings')
    .select('student_id_prefix, student_id_next_sequence')
    .eq('tenant_id', TENANT_ID)
    .single()

  const prefix = settings?.student_id_prefix || 'IMI'
  const seq = settings?.student_id_next_sequence || 1
  const student_ref = `${prefix}-${String(seq).padStart(4, '0')}`

  await supabase
    .from('tenant_settings')
    .update({ student_id_next_sequence: seq + 1 })
    .eq('tenant_id', TENANT_ID)

  const { data, error } = await supabase
    .from('students')
    .insert({
      tenant_id: TENANT_ID,
      branch_id: BRANCH_ID,
      student_ref,
      status: 'Active',
      enrolled_at: new Date().toISOString().split('T')[0],
      ...body,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
