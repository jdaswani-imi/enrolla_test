import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
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
    .from('assessments')
    .select(`
      id,
      lead_id,
      student_id,
      status,
      year_group,
      subjects,
      room,
      scheduled_at,
      completed_at,
      recommendation,
      notes,
      leads ( child_first_name, child_last_name, child_year_group, subject_interest ),
      students ( first_name, last_name, year_group ),
      assessor:staff!assessments_assessor_id_fkey ( first_name, last_name )
    `)
    .eq('tenant_id', TENANT_ID)
    .order('scheduled_at', { ascending: true, nullsFirst: false })

  // assessments table not yet migrated — return empty rather than 500
  if (error) return NextResponse.json([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((a: any) => ({
    id: a.id as string,
    name: a.lead_id
      ? `${a.leads?.child_first_name ?? ''} ${a.leads?.child_last_name ?? ''}`.trim()
      : `${a.students?.first_name ?? ''} ${a.students?.last_name ?? ''}`.trim(),
    type: (a.lead_id ? 'Lead' : 'Student') as 'Lead' | 'Student',
    yearGroup:
      (a.year_group as string | null) ??
      (a.lead_id ? (a.leads?.child_year_group as string | null) : (a.students?.year_group as string | null)) ??
      '',
    subjects: ((a.subjects as string[] | null)?.length
      ? (a.subjects as string[])
      : ((a.leads?.subject_interest as string[] | null) ?? [])),
    assessor: a.assessor
      ? `${a.assessor.first_name ?? ''} ${a.assessor.last_name ?? ''}`.trim() || null
      : null,
    date: a.scheduled_at
      ? new Date(a.scheduled_at as string).toISOString().split('T')[0]
      : null,
    time: a.scheduled_at
      ? new Date(a.scheduled_at as string).toTimeString().slice(0, 5)
      : null,
    room: (a.room as string | null) ?? null,
    status: a.status as 'Booked' | 'Link Sent' | 'Awaiting Booking' | 'Completed',
    outcome: (a.recommendation as string | null) ?? null,
  }))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await req.json()
  const { lead_id, student_id, assessor_id, scheduled_at, year_group, subjects, room, status, notes } = body

  const { data, error } = await supabase
    .from('assessments')
    .insert({
      tenant_id: TENANT_ID,
      lead_id: lead_id ?? null,
      student_id: student_id ?? null,
      assessor_id: assessor_id ?? null,
      scheduled_at: scheduled_at ?? null,
      year_group: year_group ?? null,
      subjects: subjects ?? [],
      room: room ?? null,
      status: status ?? 'Awaiting Booking',
      notes: notes ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = [
    'status', 'room', 'scheduled_at', 'assessor_id',
    'recommendation', 'observed_level', 'target_grade',
    'notes', 'completed_at', 'outcome_entered_by',
    'year_group', 'subjects',
  ]
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in updates) patch[key] = updates[key]
  }
  patch.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('assessments')
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('assessments')
    .delete()
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
