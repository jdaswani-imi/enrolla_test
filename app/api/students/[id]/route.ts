import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('students')
    .select(
      `*,
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
      )`
    )
    .eq('id', params.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  delete body.id
  delete body.tenant_id
  delete body.branch_id
  delete body.student_ref
  delete body.created_at

  const { data, error } = await supabase
    .from('students')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Soft delete only — set status to Withdrawn, never hard delete
  const { data, error } = await supabase
    .from('students')
    .update({
      status: 'Withdrawn',
      withdrawn_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
