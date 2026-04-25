import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()

  if (body.type === 'subject') {
    // If name is being changed, block when active enrolments exist
    if (body.name !== undefined) {
      const { data: existing } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', id)
        .eq('tenant_id', TENANT_ID)
        .single()

      if (existing && existing.name !== body.name) {
        const { data: courseRows } = await supabase
          .from('courses')
          .select('id')
          .eq('subject_id', id)
          .eq('tenant_id', TENANT_ID)

        const courseIds = (courseRows ?? []).map((c: { id: string }) => c.id)

        if (courseIds.length > 0) {
          const { count } = await supabase
            .from('enrolments')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', TENANT_ID)
            .eq('status', 'Active')
            .in('course_id', courseIds)

          if ((count ?? 0) > 0) {
            return NextResponse.json(
              { error: 'Subject has active enrolments' },
              { status: 409 }
            )
          }
        }
      }
    }

    const colMap: Record<string, string> = {
      name: 'name',
      code: 'code',
      departmentId: 'department_id',
      yearGroups: 'year_groups',
      description: 'description',
      colour: 'colour',
      isActive: 'is_active',
      sessionDurationMins: 'session_duration_mins',
      gradingScale: 'grading_scale',
      maxStudents: 'max_students',
      allowsMakeup: 'allows_makeup',
      requiresAssessment: 'requires_assessment',
      billingCadenceDefault: 'billing_cadence_default',
      examCountdown: 'exam_countdown',
      conditionalRate: 'conditional_rate',
      conditionDescription: 'condition_description',
      weighting: 'weighting',
      qualificationRoutes: 'qualification_routes',
      examBoards: 'exam_boards',
      phase: 'phase',
    }

    const updates: Record<string, unknown> = {}
    for (const [key, col] of Object.entries(colMap)) {
      if (body[key] !== undefined) updates[col] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', TENANT_ID)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.type === 'course') {
    const colMap: Record<string, string> = {
      yearGroup: 'year_group',
      mode: 'mode',
      sessionDurationMins: 'session_duration_mins',
      ratePerSession: 'rate_per_session',
      tier: 'tier',
      minSessions: 'min_sessions',
      billingCadence: 'billing_cadence',
      effectiveFrom: 'effective_from',
      isActive: 'is_active',
      conditional: 'conditional',
      conditionalRateVal: 'conditional_rate_val',
      conditionText: 'condition_text',
      fallbackRate: 'fallback_rate',
      trialRate: 'trial_rate',
      rateHistory: 'rate_history',
    }

    const updates: Record<string, unknown> = {}
    for (const [key, col] of Object.entries(colMap)) {
      if (body[key] !== undefined) updates[col] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', TENANT_ID)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'type must be "subject" or "course"' }, { status: 400 })
}
