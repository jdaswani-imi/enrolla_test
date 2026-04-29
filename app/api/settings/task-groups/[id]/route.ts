import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth, requireRole } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(['super_admin', 'admin_head'])
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name        !== undefined) updates.name         = body.name
  if (body.description !== undefined) updates.description  = body.description
  if (body.colour      !== undefined) updates.colour       = body.colour
  if (body.memberIds   !== undefined) updates.member_ids   = body.memberIds
  if (body.memberNames !== undefined) updates.member_names = body.memberNames
  if (body.sortOrder   !== undefined) updates.sort_order   = body.sortOrder
  if (body.active      !== undefined) updates.is_active    = body.active

  const { data, error } = await supabase
    .from('task_groups')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select('id, name, description, colour, member_ids, member_names, is_active, sort_order')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })

  return NextResponse.json({
    id:          data.id,
    name:        data.name,
    description: data.description ?? '',
    colour:      data.colour,
    memberIds:   (data.member_ids   as string[]) ?? [],
    memberNames: (data.member_names as string[]) ?? [],
    active:      data.is_active,
    sortOrder:   data.sort_order,
  })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(['super_admin', 'admin_head'])
  if (!auth.ok) return auth.response

  const { id } = await params

  const { error } = await supabase
    .from('task_groups')
    .delete()
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
