import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatDueDate(iso: string): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${months[m - 1]} ${y}`
}

function toFrontend(row: Record<string, unknown>) {
  const dueIso = row.due_date as string
  const isOverdue =
    row.status !== 'Done' &&
    row.status !== 'Cancelled' &&
    dueIso < new Date().toISOString().slice(0, 10)

  return {
    id:                    row.id,
    title:                 row.title,
    type:                  row.task_type,
    priority:              row.priority,
    status:                row.status,
    assignee:              row.assignee_name ?? '',
    dueDate:               formatDueDate(dueIso),
    linkedRecord:          (row.linked_record as Record<string, unknown>) ?? null,
    description:           row.description ?? '',
    subtasks:              (row.subtasks as string[]) ?? [],
    overdue:               isOverdue,
    sourceLeadId:          row.source_lead_id ?? undefined,
    sourceLeadName:        row.source_lead_name ?? undefined,
    linkedAssignmentId:    row.linked_assignment_id ?? undefined,
    linkedInventoryItemId: row.linked_inventory_item_id ?? undefined,
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

  if (assignee) query = query.eq('assignee_name', assignee)
  if (type)     query = query.eq('task_type', type)
  if (status)   query = query.eq('status', status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: (data ?? []).map(toFrontend) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()

  // Auto-generate task_ref
  const { data: maxRow } = await supabase
    .from('tasks')
    .select('task_ref')
    .eq('tenant_id', TENANT_ID)
    .not('task_ref', 'is', null)
    .order('task_ref', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastNum = maxRow?.task_ref
    ? parseInt((maxRow.task_ref as string).replace(/\D/g, ''), 10)
    : 0
  const task_ref = `TK-${String(lastNum + 1).padStart(3, '0')}`

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      tenant_id:      TENANT_ID,
      task_ref,
      title:          body.title,
      description:    body.description ?? '',
      task_type:      body.type,
      priority:       body.priority,
      status:         'Open',
      assignee_name:  body.assignee ?? '',
      due_date:       body.dueDateIso,
      linked_record:  body.linkedRecord ?? null,
      subtasks:       body.subtasks ?? [],
      source_lead_id:   body.sourceLeadId ?? null,
      source_lead_name: body.sourceLeadName ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: toFrontend(data) }, { status: 201 })
}
