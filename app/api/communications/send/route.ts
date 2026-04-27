import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await req.json()
  const {
    campaign,
    audience,
    template,
    scheduledAt,
  } = body as {
    campaign?: string
    audience?: string
    template?: string
    scheduledAt?: string
  }

  if (!campaign?.trim()) {
    return NextResponse.json({ error: 'campaign name is required' }, { status: 400 })
  }
  if (!audience?.trim()) {
    return NextResponse.json({ error: 'audience is required' }, { status: 400 })
  }

  const isScheduled = !!scheduledAt
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('marketing_campaigns')
    .insert({
      tenant_id: TENANT_ID,
      campaign: campaign.trim(),
      audience: audience.trim(),
      template: template ?? '',
      sent: 0,
      delivered: 0,
      failed: 0,
      scheduled_at: scheduledAt ?? now,
      status: isScheduled ? 'Scheduled' : 'Sent',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: { id: data.id, status: data.status } }, { status: 201 })
}
