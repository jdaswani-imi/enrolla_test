import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}

  // Read current status before update so we can write accurate history
  let previousStatus: string | null = null
  if (body.status !== undefined) {
    const { data } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', id)
      .eq('tenant_id', TENANT_ID)
      .maybeSingle()
    previousStatus = data?.status ?? null
    updates.status = body.status
  }
  if (body.title       !== undefined) updates.title       = body.title
  if (body.priority    !== undefined) updates.priority    = body.priority
  if (body.dueDateIso  !== undefined) updates.due_date    = body.dueDateIso
  if (body.description !== undefined) updates.description = body.description

  // Accept assignees[] (new) or legacy assignee string
  if (body.assignees !== undefined) {
    const arr: string[] = Array.isArray(body.assignees) ? body.assignees : [body.assignees]
    updates.assignees = arr
    updates.assignee  = arr[0] ?? ''
  } else if (body.assignee !== undefined) {
    updates.assignee  = body.assignee
    updates.assignees = body.assignee ? [body.assignee] : []
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Write status history when status actually changed
  if (body.status !== undefined && previousStatus !== null && previousStatus !== body.status) {
    const { data: staff } = await supabase
      .from('staff')
      .select('first_name, last_name')
      .eq('user_id', auth.user.id)
      .maybeSingle()
    const changedByName = staff
      ? `${staff.first_name} ${staff.last_name}`.trim()
      : (auth.user.email ?? 'Unknown')

    await supabase.from('status_history').insert({
      entity_type:     'task',
      entity_id:       id,
      changed_by:      auth.user.id,
      changed_by_name: changedByName,
      previous_status: previousStatus,
      new_status:      body.status,
    })
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
