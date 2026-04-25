import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Guardian not found' }, { status: 404 })
  }
  const { data, error } = await supabase
    .from('guardians')
    .select(`
      *,
      co_parent:guardians!guardians_co_parent_id_fkey (
        id, first_name, last_name, phone
      ),
      students!students_primary_guardian_id_fkey (
        id, first_name, last_name, year_group, status,
        primary_guardian_relationship,
        departments (id, name, colour)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Guardian not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Guardian not found' }, { status: 404 })
  }
  const body = await request.json()

  delete body.id
  delete body.tenant_id
  delete body.created_at

  const { data, error } = await supabase
    .from('guardians')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Guardian not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
