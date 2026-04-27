import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// People directory view of students — filterable, paginated
export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const status = searchParams.get('status') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50')))
  const offset = (page - 1) * limit

  let query = supabase
    .from('students')
    .select(`
      id, first_name, last_name, email, phone, status, created_at, year_group,
      student_guardians(
        guardians(first_name, last_name, phone, email)
      )
    `, { count: 'exact' })
    .eq('tenant_id', TENANT_ID)
    .order('last_name')
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((s: any) => {
    const primaryGuardian = s.student_guardians?.[0]?.guardians
    return {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`.trim(),
      type: 'Student' as const,
      contact: s.email ?? s.phone ?? primaryGuardian?.phone ?? '',
      status: s.status ?? 'active',
      departmentOrStage: s.year_group ?? '',
      createdOn: s.created_at?.slice(0, 10) ?? '',
      link: `/students/${s.id}`,
    }
  })

  return NextResponse.json({ data: rows, total: count ?? 0, page, limit })
}
