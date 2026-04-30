import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatDueDate(iso: string, time?: string | null): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const [y, m, d] = iso.split('-').map(Number)
  const base = `${d} ${months[m - 1]} ${y}`
  if (!time) return base
  // Convert HH:MM[:SS] → 12-hour display
  const [h, min] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${base} at ${hour}:${String(min).padStart(2, '0')}${ampm}`
}

function toFrontend(row: Record<string, unknown>) {
  const dueIso  = row.due_date as string
  const dueTime = row.due_time as string | null | undefined
  const isOverdue =
    row.status !== 'Done' &&
    row.status !== 'Cancelled' &&
    dueIso < new Date().toISOString().slice(0, 10)

  // assignees array — fall back to wrapping the legacy single `assignee` column
  const assignees: string[] =
    Array.isArray(row.assignees) && (row.assignees as string[]).length > 0
      ? (row.assignees as string[])
      : row.assignee
        ? [row.assignee as string]
        : []

  // Reconstruct linkedRecord from flat columns
  const linkedRecord =
    row.linked_record_type && row.linked_record_id
      ? { type: row.linked_record_type, name: row.linked_record_name ?? '', id: row.linked_record_id }
      : null

  return {
    id:                    row.id,
    title:                 row.title,
    type:                  row.type,
    priority:              row.priority,
    status:                row.status,
    assignees,
    dueDate:               formatDueDate(dueIso, dueTime),
    dueTime:               dueTime ?? null,
    linkedRecord,
    description:           row.description ?? '',
    subtasks:              (row.subtasks as string[]) ?? [],
    overdue:               isOverdue,
    sourceLeadId:          row.source_lead_id   ?? undefined,
    sourceLeadName:        row.source_lead_name ?? undefined,
    createdOn:             row.created_at,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  const assignee = searchParams.get('assignee')
  const type     = searchParams.get('type')
  const status   = searchParams.get('status')

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('due_date', { ascending: true })

  // Filter by assignee — check the array contains the name
  if (assignee) query = query.contains('assignees', [assignee])
  if (type)     query = query.eq('type', type)
  if (status)   query = query.eq('status', status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: (data ?? []).map(toFrontend) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()

  // Accept either assignees[] (new) or assignee string (legacy callers)
  const assignees: string[] = Array.isArray(body.assignees)
    ? body.assignees
    : body.assignee
      ? [body.assignee]
      : []

  const linkedRecord = body.linkedRecord as { type?: string; name?: string; id?: string } | null

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      tenant_id:          TENANT_ID,
      title:              body.title,
      description:        body.description ?? '',
      type:               body.type,
      priority:           body.priority,
      status:             'Open',
      assignee:           assignees[0] ?? '',
      assignees,
      due_date:           body.dueDateIso,
      due_time:           body.dueTime ?? null,
      linked_record_type: linkedRecord?.type ?? null,
      linked_record_name: linkedRecord?.name ?? null,
      linked_record_id:   linkedRecord?.id   ?? null,
      subtasks:           body.subtasks ?? [],
      source_lead_id:     body.sourceLeadId ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: toFrontend(data) }, { status: 201 })
}
