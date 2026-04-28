import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage')
  const status = searchParams.get('status')
  const q = searchParams.get('q')?.trim() ?? ''

  let query = supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (stage) query = query.eq('stage', stage)
  if (status) query = query.eq('status', status)
  if (q) query = query.or(`child_name.ilike.%${q}%,ref.ilike.%${q}%,guardian.ilike.%${q}%`)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ data: [] })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const body = await request.json()

  // Auto-generate next ref
  const { data: maxRow } = await supabase
    .from('leads')
    .select('ref')
    .eq('tenant_id', TENANT_ID)
    .order('ref', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextNum = maxRow?.ref
    ? parseInt(maxRow.ref.replace(/\D/g, ''), 10) + 1
    : 1
  const ref = `LEAD-${String(nextNum).padStart(3, '0')}`

  const { data, error } = await supabase
    .from('leads')
    .insert({
      tenant_id: TENANT_ID,
      ref,
      child_name: (body.childName ?? '').trim(),
      year_group: body.yearGroup || null,
      subjects: body.subjects?.length ? body.subjects : null,
      guardian: (body.guardianName ?? '').trim() || null,
      guardian_phone: body.phone?.trim() || null,
      source: body.source || null,
      stage: body.stage || 'New',
      assigned_to: body.assignedTo || null,
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
