import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function toFrontend(row: Record<string, unknown>) {
  return {
    id:          row.id,
    name:        row.name,
    description: row.description ?? '',
    colour:      row.colour,
    memberIds:   (row.member_ids   as string[]) ?? [],
    memberNames: (row.member_names as string[]) ?? [],
    active:      row.is_active,
    sortOrder:   row.sort_order,
  }
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data, error } = await supabase
    .from('task_groups')
    .select('id, name, description, colour, member_ids, member_names, is_active, sort_order')
    .eq('tenant_id', TENANT_ID)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json((data ?? []).map(toFrontend))
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { name, description, colour, memberIds, memberNames, sortOrder } = body

  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('task_groups')
    .select('sort_order')
    .eq('tenant_id', TENANT_ID)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSort = sortOrder ?? ((existing?.[0]?.sort_order ?? 0) + 1)

  const { data, error } = await supabase
    .from('task_groups')
    .insert({
      tenant_id:    TENANT_ID,
      name:         name.trim(),
      description:  description?.trim() ?? '',
      colour:       colour ?? '#64748B',
      member_ids:   memberIds ?? [],
      member_names: memberNames ?? [],
      is_active:    true,
      sort_order:   nextSort,
    })
    .select('id, name, description, colour, member_ids, member_names, is_active, sort_order')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(toFrontend(data), { status: 201 })
}
