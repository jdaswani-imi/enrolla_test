import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Map Band 1 concern_type to legacy level labels for frontend compat
const TYPE_LABEL: Record<string, string> = {
  behaviour:    'L1',
  academic:     'L1',
  wellbeing:    'L2',
  safeguarding: 'L3',
  other:        'L1',
}

const LEVEL_LABEL: Record<string, string> = {
  L1: 'Teacher',
  L2: 'Teacher + HOD',
  L3: 'HOD + Academic Head',
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function shapeRow(row: Record<string, unknown>) {
  const reporter = row.staff as { first_name: string; last_name: string } | null
  const concernType = (row.concern_type as string) ?? 'behaviour'
  const lvl = TYPE_LABEL[concernType] ?? 'L1'
  const reporterName = reporter
    ? `${reporter.first_name} ${reporter.last_name}`.trim()
    : 'Unknown'

  return {
    id:               row.id,
    subject:          '',
    trigger:          (row.description as string) ?? '',
    raised:           relTime(row.created_at as string),
    raisedBy:         reporterName,
    level:            lvl,
    levelLabel:       LEVEL_LABEL[lvl] ?? '',
    assignedTo:       reporterName,
    status:           row.status === 'open' ? 'Active' : (row.status as string),
    resolution_notes: (row.notes as string) ?? null,
    created_at:       row.created_at,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id')
  if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('concerns')
    .select(`
      id, concern_type, severity, status, description, notes, resolved_at, created_at,
      staff!concerns_reported_by_fkey (first_name, last_name)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: (data ?? []).map(r => shapeRow(r as Record<string, unknown>)),
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { student_id, level, description } = body

  if (!student_id || !description?.trim()) {
    return NextResponse.json({ error: 'student_id and description required' }, { status: 400 })
  }

  // Resolve the auth user's staff record id for reported_by
  const { data: staffRow } = await supabase
    .from('staff')
    .select('id')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  // Map legacy level (L1/L2/L3) to concern_type
  const TYPE_BY_LEVEL: Record<string, string> = { L1: 'behaviour', L2: 'wellbeing', L3: 'safeguarding' }
  const concernType = TYPE_BY_LEVEL[level ?? 'L1'] ?? 'behaviour'

  const { data, error } = await supabase
    .from('concerns')
    .insert({
      tenant_id:    TENANT_ID,
      student_id,
      reported_by:  staffRow?.id ?? null,
      concern_type: concernType,
      description:  description.trim(),
      status:       'open',
    })
    .select(`
      id, concern_type, severity, status, description, notes, resolved_at, created_at,
      staff!concerns_reported_by_fkey (first_name, last_name)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(
    { data: shapeRow(data as Record<string, unknown>) },
    { status: 201 }
  )
}
