import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  let query = supabase
    .from('guardians')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      preferred_channel,
      media_opt_out,
      co_parent_id,
      created_at,
      students!students_primary_guardian_id_fkey (
        id, first_name, last_name
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('last_name', { ascending: true })

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
