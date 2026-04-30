import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id: leadId } = await params

  const { data, error } = await supabase
    .from('lead_messages')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id: leadId } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('lead_messages')
    .insert({
      tenant_id: TENANT_ID,
      lead_id: leadId,
      author: body.author ?? 'Unknown',
      author_id: body.author_id ?? null,
      text: body.text ?? '',
      chips: body.chips ?? [],
      reactions: body.reactions ?? {},
      mentions: body.mentions ?? [],
      reply_to: body.reply_to ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id: leadId } = await params
  const { searchParams } = new URL(request.url)
  const messageId = searchParams.get('messageId')

  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 })

  const { error } = await supabase
    .from('lead_messages')
    .delete()
    .eq('id', messageId)
    .eq('tenant_id', TENANT_ID)
    .eq('lead_id', leadId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { id: leadId } = await params
  const body = await request.json()
  const { messageId, reactions } = body

  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('lead_messages')
    .update({ reactions })
    .eq('id', messageId)
    .eq('tenant_id', TENANT_ID)
    .eq('lead_id', leadId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
