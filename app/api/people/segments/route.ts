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
    .from('segments')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: (data ?? []).map(r => ({
      id: r.id,
      name: r.name,
      scope: r.scope ?? 'Personal',
      recordType: r.record_type ?? 'Students',
      members: r.member_count ?? 0,
      count: r.member_count ?? 0,
      filterSummary: r.filter_summary ?? '',
      lastRefreshed: r.last_refreshed_at ?? null,
      lastUpdated: r.updated_at,
      createdBy: r.created_by ?? '',
      filters: typeof r.filters === 'string' ? r.filters : JSON.stringify(r.filters ?? {}),
    })),
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await req.json()
  const { name, scope, recordType, filterSummary, filters, createdBy } = body as {
    name?: string
    scope?: string
    recordType?: string
    filterSummary?: string
    filters?: unknown
    createdBy?: string
  }

  if (!name?.trim() || !recordType) {
    return NextResponse.json({ error: 'name and recordType are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('segments')
    .insert({
      tenant_id: TENANT_ID,
      name: name.trim(),
      scope: scope ?? 'Personal',
      record_type: recordType,
      filter_summary: filterSummary ?? '',
      filters: filters ?? {},
      created_by: createdBy ?? auth.user.email ?? '',
      member_count: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
