import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data, error } = await supabase
    .from('automation_templates')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: (data ?? []).map(r => ({
      id: r.id,
      name: r.name,
      type: r.type ?? 'Email',
      status: r.status ?? 'Draft',
      owner: r.owner ?? 'Personal',
      body: r.body ?? '',
      mergeFields: r.merge_fields ?? [],
      version: r.version ?? 1,
      usedInRules: r.used_in_rules ?? [],
      locked: r.locked ?? false,
    })),
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await req.json()
  const { name, type, owner, bodyContent, mergeFields } = body as {
    name?: string
    type?: string
    owner?: string
    bodyContent?: string
    mergeFields?: string[]
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('automation_templates')
    .insert({
      tenant_id: TENANT_ID,
      name: name.trim(),
      type: type ?? 'Email',
      status: 'Draft',
      owner: owner ?? 'Personal',
      body: bodyContent ?? '',
      merge_fields: mergeFields ?? [],
      version: 1,
      used_in_rules: [],
      locked: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
