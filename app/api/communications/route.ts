import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Lists all campaigns (sent + scheduled) — the marketing_campaigns table
export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? ''

  let query = supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('scheduled_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: (data ?? []).map(r => ({
      id: r.id,
      campaign: r.campaign,
      audience: r.audience ?? '',
      template: r.template ?? '',
      sent: r.sent ?? 0,
      delivered: r.delivered ?? 0,
      failed: r.failed ?? 0,
      scheduledAt: r.scheduled_at ?? null,
      status: r.status ?? 'Draft',
    })),
  })
}
