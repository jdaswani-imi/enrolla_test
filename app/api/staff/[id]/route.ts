import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FRONTEND_TO_DB_ROLE: Record<string, string> = {
  'Super Admin':   'super_admin',
  'Admin Head':    'admin_head',
  'Admin':         'admin',
  'Academic Head': 'academic_head',
  'HOD':           'hod',
  'Teacher':       'teacher',
  'TA':            'ta',
  'HR-Finance':    'hr_finance',
}

function toDbRole(role: string) {
  return FRONTEND_TO_DB_ROLE[role] ?? role.toLowerCase().replace(/[/ ]/g, '_')
}

const FRONTEND_TO_DB_STATUS: Record<string, string> = {
  'Active':      'active',
  'Invited':     'invited',
  'On Leave':    'on_leave',
  'Inactive':    'inactive',
  'Suspended':   'suspended',
  'Off-boarded': 'off_boarded',
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body   = await request.json()
  const { status, role, email, name } = body

  const patch: Record<string, unknown> = {}
  if (status !== undefined) patch.status = FRONTEND_TO_DB_STATUS[status] ?? status
  if (email  !== undefined) patch.email  = email
  if (role   !== undefined) patch.role   = toDbRole(role)
  if (name   !== undefined) {
    const parts = String(name).trim().split(' ')
    patch.first_name = parts[0] ?? ''
    patch.last_name  = parts.slice(1).join(' ') || ''
  }
  patch.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('staff')
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params

  const { data: staffRow, error: fetchError } = await supabase
    .from('staff')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !staffRow) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
  }

  if (staffRow.status !== 'off_boarded') {
    return NextResponse.json({ error: 'Only off-boarded staff can be deleted' }, { status: 422 })
  }

  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
