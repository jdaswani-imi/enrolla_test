import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TENANT_ID = 'b2000000-0000-0000-0000-000000000001'

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

  delete body.id
  delete body.student_ref
  delete body.created_at
  delete body.updated_at

  const { data, error } = await supabase
    .from('students')
    .insert({ ...body, tenant_id: TENANT_ID })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
