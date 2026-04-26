import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FIELDS = [
  'org_name', 'legal_name', 'student_id_format', 'vat_number',
  'currency', 'timezone', 'default_language', 'start_day_of_week',
  'weekly_closure_days', 'office_hours',
  'invoice_number_prefix', 'invoice_number_format', 'vat_rate',
  'default_payment_terms', 'enrolment_fee', 'enrolment_fee_type',
  'invoice_footer_text', 'min_first_instalment', 'late_payment_fee',
  'cpd_annual_target', 'performance_review_cadence', 'org_domain_restriction',
] as const

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { data } = await supabase
    .from('org_settings')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .single()

  return NextResponse.json(data ?? { tenant_id: TENANT_ID })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await request.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const field of FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field]
  }
  if (body.complete === true) {
    updates.onboarding_completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('org_settings')
    .upsert({ tenant_id: TENANT_ID, ...updates }, { onConflict: 'tenant_id' })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
