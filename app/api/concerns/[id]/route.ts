import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Map legacy level (L1/L2/L3) to concern_type
const TYPE_BY_LEVEL: Record<string, string> = {
  L1: 'behaviour',
  L2: 'wellbeing',
  L3: 'safeguarding',
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()

  const patch: Record<string, unknown> = {}
  if (body.level !== undefined) patch.concern_type = TYPE_BY_LEVEL[body.level] ?? 'behaviour'
  if (body.status !== undefined) patch.status = body.status
  if (body.resolution_notes !== undefined) patch.notes = body.resolution_notes

  if (body.status === 'Resolved' || body.status === 'resolved' || body.status === 'Dismissed') {
    patch.resolved_at = new Date().toISOString()
    patch.status = 'resolved'
  }

  const { error } = await supabase
    .from('concerns')
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
