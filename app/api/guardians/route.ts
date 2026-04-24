import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TENANT_ID = 'b2000000-0000-0000-0000-000000000001'

export async function GET() {
  const { data, error } = await supabase
    .from('guardians')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      preferred_channel,
      created_at,
      students!students_primary_guardian_id_fkey (
        id, first_name, last_name
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('last_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
