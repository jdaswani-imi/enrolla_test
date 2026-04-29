import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth, requireRole } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { data, error } = await supabase
    .from('branches')
    .select('id, name, address, phone, email, location_url, currency, is_active')
    .eq('tenant_id', TENANT_ID)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(['super_admin', 'admin_head'])
  if (!auth.ok) return auth.response
  const body = await request.json()
  const { name, address = '', phone = '', email = '', location_url = '', currency = 'AED' } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('branches')
    .insert({ tenant_id: TENANT_ID, name: name.trim(), address, phone, email, location_url, currency, is_active: true })
    .select('id, name, address, phone, email, location_url, currency, is_active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
