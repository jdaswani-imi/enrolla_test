import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { data, error } = await supabase
    .from('unbilled_sessions')
    .select(`
      id,
      session_date,
      sessions_count,
      status,
      write_off_reason,
      write_off_at,
      students (
        id,
        first_name,
        last_name,
        year_group
      ),
      subjects ( name )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('session_date', { ascending: true })

  // unbilled_sessions table not yet migrated — return empty rather than 500
  if (error) return NextResponse.json([])

  const mapped = (data ?? []).map((u) => {
    const s = u.students as unknown as {
      id: string; first_name: string; last_name: string; year_group: string | null
    } | null
    const subj = u.subjects as unknown as { name: string } | null

    return {
      id: u.id,
      studentId: s?.id ?? '',
      student: s ? `${s.first_name} ${s.last_name}` : '—',
      department: '—',
      yearGroup: s?.year_group ?? '—',
      courseTitle: subj?.name ?? '—',
      sessionDate: u.session_date,
      sessionsCount: u.sessions_count,
      status: u.status as 'open' | 'written_off',
      writeOffReason: u.write_off_reason ?? undefined,
      writeOffBy: undefined as string | undefined,
      writeOffAt: u.write_off_at ?? undefined,
    }
  })

  return NextResponse.json(mapped)
}
