import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.branch_id !== undefined) updates.branch_id = body.branch_id
  if (body.capacity !== undefined) updates.capacity = body.capacity
  if (body.soft !== undefined) updates.soft_cap = body.soft
  if (body.hard !== undefined) updates.hard_cap = body.hard
  if (body.type !== undefined) updates.room_type = body.type
  if (body.active !== undefined) updates.is_active = body.active
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select('id, name, capacity, soft_cap, hard_cap, room_type, is_active, branch_id, branches(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })

  return NextResponse.json({
    id: data.id,
    name: data.name,
    branch: (data.branches as unknown as { name: string } | null)?.name ?? '',
    branch_id: data.branch_id,
    capacity: data.capacity,
    soft: data.soft_cap ?? data.capacity,
    hard: data.hard_cap ?? data.capacity,
    type: data.room_type ?? 'Classroom',
    active: data.is_active,
  })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id } = await params

  const today = new Date().toISOString().split('T')[0]
  const { count } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', id)
    .eq('tenant_id', TENANT_ID)
    .gte('date', today)
    .neq('status', 'Cancelled')

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Cannot archive — sessions are scheduled in this room.' },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('rooms')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
