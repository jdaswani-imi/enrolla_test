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

  const allowed = ['name', 'yearGroupFrom', 'yearGroupTo', 'colour', 'sortOrder', 'active']
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.yearGroupFrom !== undefined) updates.year_group_from = body.yearGroupFrom
  if (body.yearGroupTo !== undefined) updates.year_group_to = body.yearGroupTo
  if (body.colour !== undefined) updates.colour = body.colour
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder
  if (body.active !== undefined) updates.is_active = body.active
  updates.updated_at = new Date().toISOString()

  void allowed // suppress lint

  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select('id, name, year_group_from, year_group_to, colour, is_active, sort_order')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })

  return NextResponse.json({
    id: data.id,
    name: data.name,
    yearGroupFrom: data.year_group_from,
    yearGroupTo: data.year_group_to,
    colour: data.colour,
    active: data.is_active,
    sortOrder: data.sort_order,
  })
}
