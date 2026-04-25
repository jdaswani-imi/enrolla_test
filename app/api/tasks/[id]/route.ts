import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}

  if (body.status !== undefined) {
    updates.status = body.status
    if (body.status === 'Done') updates.completed_at = new Date().toISOString()
    else                        updates.completed_at = null
  }
  if (body.title       !== undefined) updates.title        = body.title
  if (body.priority    !== undefined) updates.priority     = body.priority
  if (body.assignee    !== undefined) updates.assignee_name = body.assignee
  if (body.dueDateIso  !== undefined) updates.due_date     = body.dueDateIso
  if (body.description !== undefined) updates.description  = body.description

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
