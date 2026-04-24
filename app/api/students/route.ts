import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TENANT_ID = 'b2000000-0000-0000-0000-000000000001'
const BRANCH_ID = 'c3000000-0000-0000-0000-000000000001'

const DEPT_ID: Record<string, string> = {
  Primary: 'd4000000-0000-0000-0000-000000000001',
  'Lower Secondary': 'd4000000-0000-0000-0000-000000000002',
  Senior: 'd4000000-0000-0000-0000-000000000003',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('students')
    .select(`
      *,
      departments (id, name, colour),
      guardians!students_primary_guardian_id_fkey (
        id, first_name, last_name, phone, email, whatsapp_number,
        is_dnc, is_unsubscribed
      ),
      enrolments (
        id, status, enrolled_at, withdrawn_at, frequency_tier,
        sessions_per_week,
        courses (id, name, rate_per_session,
          subjects (id, name)
        )
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('last_name', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Auto-generate next student_ref
  const { data: maxRow } = await supabase
    .from('students')
    .select('student_ref')
    .eq('tenant_id', TENANT_ID)
    .order('student_ref', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextNum = maxRow?.student_ref
    ? parseInt(maxRow.student_ref.replace(/\D/g, ''), 10) + 1
    : 1
  const student_ref = `STU-${String(nextNum).padStart(3, '0')}`

  // Create primary guardian first if provided
  let primary_guardian_id: string | null = null
  if (body.primaryGuardian) {
    const g = body.primaryGuardian
    const { data: guardian, error: gErr } = await supabase
      .from('guardians')
      .insert({
        tenant_id: TENANT_ID,
        first_name: g.first_name,
        last_name: g.last_name,
        email: g.email || null,
        phone: g.phone || null,
        whatsapp_number: g.whatsapp_number || null,
        preferred_channel: g.preferred_channel || 'WhatsApp',
        home_area: g.home_area || null,
        nationality: g.nationality || null,
      })
      .select('id')
      .single()

    if (gErr) {
      return NextResponse.json({ error: gErr.message }, { status: 500 })
    }
    primary_guardian_id = guardian.id
  }

  const { primaryGuardian, department, id, created_at, updated_at, ...rest } = body

  const { data, error } = await supabase
    .from('students')
    .insert({
      ...rest,
      tenant_id: TENANT_ID,
      branch_id: BRANCH_ID,
      student_ref,
      ...(department && DEPT_ID[department] ? { department_id: DEPT_ID[department] } : {}),
      ...(primary_guardian_id ? { primary_guardian_id } : {}),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
