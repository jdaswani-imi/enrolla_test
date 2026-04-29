import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import type { User } from '@supabase/supabase-js'

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse }

export type RoleResult =
  | { ok: true; user: User; role: string }
  | { ok: false; response: NextResponse }

const ALLOWED_ROLES = [
  'super_admin', 'admin_head', 'admin',
  'academic_head', 'hod', 'teacher', 'ta', 'hr_finance',
] as const

export type StaffRole = (typeof ALLOWED_ROLES)[number]

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { ok: true, user }
}

// Returns the authenticated user AND their staff role.
// Use requireRole() + check role before sensitive mutations.
export async function requireAuthWithRole(): Promise<RoleResult> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: staffRow } = await admin
    .from('staff')
    .select('role')
    .eq('user_id', authResult.user.id)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  const role = staffRow?.role ?? 'ta'
  return { ok: true, user: authResult.user, role }
}

// Guards a handler so only the specified roles may proceed.
// Returns a 403 response if the caller's role is not in allowedRoles.
export async function requireRole(
  allowedRoles: StaffRole[],
): Promise<RoleResult> {
  const result = await requireAuthWithRole()
  if (!result.ok) return result

  if (!allowedRoles.includes(result.role as StaffRole)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden: insufficient role' },
        { status: 403 },
      ),
    }
  }

  return result
}
