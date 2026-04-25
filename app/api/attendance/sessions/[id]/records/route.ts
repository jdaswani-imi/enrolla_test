import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Maps page-side status values to DB enum values
const STATUS_MAP: Record<string, string> = {
  Present: 'Present',
  Late: 'Late',
  'Absent-Notified': 'Absent Notified',
  'Absent-NoNotice': 'Absent Not Notified',
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id: sessionId } = await params
  const { records } = await request.json() as {
    records: Array<{ student_id: string; status: string; reason?: string }>
  }

  if (!records?.length) {
    return NextResponse.json({ error: 'No records provided' }, { status: 400 })
  }

  const rows = records.map(r => ({
    tenant_id: TENANT_ID,
    session_id: sessionId,
    student_id: r.student_id,
    status: STATUS_MAP[r.status] ?? 'Present',
    reason: r.reason ?? null,
    marked_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('attendance_records')
    .upsert(rows, { onConflict: 'session_id,student_id', ignoreDuplicates: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
