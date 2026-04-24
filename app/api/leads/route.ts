import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID, BRANCH_ID } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage')
  const terminal_status = searchParams.get('terminal_status')

  let query = supabase
    .from('leads')
    .select(`
      *,
      guardians (id, first_name, last_name, phone, whatsapp_number)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (stage) query = query.eq('stage', stage)
  if (terminal_status) query = query.eq('terminal_status', terminal_status)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Auto-generate next lead_ref
  const { data: maxRow } = await supabase
    .from('leads')
    .select('lead_ref')
    .eq('tenant_id', TENANT_ID)
    .order('lead_ref', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextNum = maxRow?.lead_ref
    ? parseInt(maxRow.lead_ref.replace(/\D/g, ''), 10) + 1
    : 1
  const lead_ref = `LEAD-${String(nextNum).padStart(3, '0')}`

  // Create guardian record
  let guardian_id: string | null = null
  if (body.guardianName) {
    const nameParts = body.guardianName.trim().split(' ')
    const g_first = nameParts[0] ?? ''
    const g_last = nameParts.slice(1).join(' ') || g_first

    const { data: guardian, error: gErr } = await supabase
      .from('guardians')
      .insert({
        tenant_id: TENANT_ID,
        first_name: g_first,
        last_name: g_last,
        phone: body.phone || null,
        whatsapp_number: body.whatsapp ? body.phone || null : null,
        preferred_channel: body.whatsapp ? 'WhatsApp' : 'Phone',
      })
      .select('id')
      .single()

    if (gErr) {
      return NextResponse.json({ error: gErr.message }, { status: 500 })
    }
    guardian_id = guardian.id
  }

  // Parse child name
  const childParts = (body.childName ?? '').trim().split(' ')
  const child_first_name = childParts[0] ?? ''
  const child_last_name = childParts.slice(1).join(' ') || child_first_name

  const { data, error } = await supabase
    .from('leads')
    .insert({
      tenant_id: TENANT_ID,
      branch_id: BRANCH_ID,
      lead_ref,
      child_first_name,
      child_last_name,
      child_year_group: body.yearGroup || null,
      subject_interest: body.subjects?.length ? body.subjects : null,
      source: body.source || null,
      stage: body.stage || 'New',
      notes: body.notes || null,
      ...(guardian_id ? { guardian_id } : {}),
    })
    .select(`*, guardians (id, first_name, last_name, phone, whatsapp_number)`)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
