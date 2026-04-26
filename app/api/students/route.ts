import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')?.trim() ?? ''

  let query = supabase
    .from('students')
    .select(`
      id, tenant_id, student_number, first_name, last_name,
      date_of_birth, gender, email, phone, address,
      school_id, status, notes, created_at, updated_at,
      student_guardians (
        guardian_id, is_primary, relationship,
        guardians (id, first_name, last_name, phone, email)
      ),
      enrolments (
        id, status, sessions_remaining,
        subjects (id, name)
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('last_name', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()

  // Create primary guardian first if provided
  let primaryGuardianId: string | null = null
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
        notes: g.notes || null,
      })
      .select('id')
      .single()

    if (gErr) {
      return NextResponse.json({ error: gErr.message }, { status: 500 })
    }
    primaryGuardianId = guardian.id
  }

  const { primaryGuardian, department, id, created_at, updated_at,
    department_id, branch_id, student_ref, primary_guardian_id,
    year_group, frequency_tier, sessions_per_week, rate_per_session,
    enrolled_at, withdrawn_at, archived_at, ...rest } = body

  const { data, error } = await supabase
    .from('students')
    .insert({
      ...rest,
      tenant_id: TENANT_ID,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Link guardian via junction table
  if (primaryGuardianId && data?.id) {
    await supabase.from('student_guardians').insert({
      tenant_id: TENANT_ID,
      student_id: data.id,
      guardian_id: primaryGuardianId,
      relationship: body.primaryGuardian?.relationship || 'Parent',
      is_primary: true,
    })
  }

  return NextResponse.json({ data }, { status: 201 })
}
