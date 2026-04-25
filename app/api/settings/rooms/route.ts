import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID, BRANCH_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { data, error } = await supabase
    .from('rooms')
    .select('id, name, capacity, soft_cap, hard_cap, room_type, is_active, branch_id, branches(name)')
    .eq('tenant_id', TENANT_ID)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    branch: (r.branches as unknown as { name: string } | null)?.name ?? '',
    branch_id: r.branch_id,
    capacity: r.capacity,
    soft: r.soft_cap ?? r.capacity,
    hard: r.hard_cap ?? r.capacity,
    type: r.room_type ?? 'Classroom',
    active: r.is_active,
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()
  const { name, branch_id, capacity, soft, hard, type } = body

  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      tenant_id: TENANT_ID,
      branch_id: branch_id ?? BRANCH_ID,
      name: name.trim(),
      capacity,
      soft_cap: soft ?? capacity,
      hard_cap: hard ?? capacity,
      room_type: type ?? 'Classroom',
      is_active: true,
    })
    .select('id, name, capacity, soft_cap, hard_cap, room_type, is_active, branch_id, branches(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
  }, { status: 201 })
}
