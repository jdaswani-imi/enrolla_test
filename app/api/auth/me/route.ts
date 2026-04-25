import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/route-auth'
import { TENANT_ID } from '@/lib/api-constants'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data } = await admin
    .from('users')
    .select('role, full_name')
    .eq('email', auth.user.email)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  return NextResponse.json({
    email: auth.user.email,
    role: data?.role ?? 'Admin',
    name: data?.full_name ?? auth.user.email,
  })
}
