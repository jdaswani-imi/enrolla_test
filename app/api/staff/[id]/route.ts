import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function toDbRole(role: string) {
  return role === 'HR-Finance' ? 'HR/Finance' : role
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id }   = await params
  const body     = await request.json()
  const { status, role, department, subjects, email, name } = body

  // Build staff_profiles patch
  const profilePatch: Record<string, unknown> = {}
  if (status    !== undefined) profilePatch.status          = status
  if (subjects  !== undefined) profilePatch.subjects_taught = subjects

  // Resolve department → id if provided
  if (department !== undefined) {
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('name', department)
      .maybeSingle()
    profilePatch.department_id = dept?.id ?? null
  }

  if (Object.keys(profilePatch).length > 0) {
    const { error } = await supabase
      .from('staff_profiles')
      .update(profilePatch)
      .eq('id', id)
      .eq('tenant_id', TENANT_ID)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update user record if name / email / role changed
  const userPatch: Record<string, unknown> = {}
  if (name  !== undefined) userPatch.full_name = name
  if (email !== undefined) userPatch.email     = email
  if (role  !== undefined) userPatch.role      = toDbRole(role)

  if (Object.keys(userPatch).length > 0) {
    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('user_id')
      .eq('id', id)
      .single()

    if (profile?.user_id) {
      const { error } = await supabase
        .from('users')
        .update(userPatch)
        .eq('id', profile.user_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
