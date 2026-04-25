import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const [{ data: subjectsData, error: sErr }, { data: coursesData, error: cErr }] = await Promise.all([
    supabase
      .from('subjects')
      .select(`
        id, name, code, department_id, is_active,
        year_groups, description, colour, grading_scale, phase,
        max_students, allows_makeup, requires_assessment,
        billing_cadence_default, exam_countdown, conditional_rate,
        condition_description, weighting, qualification_routes, exam_boards,
        session_duration_mins,
        departments ( name )
      `)
      .eq('tenant_id', TENANT_ID)
      .order('name'),
    supabase
      .from('courses')
      .select(`
        id, subject_id, year_group, mode, session_duration_mins,
        rate_per_session, tier, min_sessions, billing_cadence,
        effective_from, is_active, conditional, conditional_rate_val,
        condition_text, fallback_rate, trial_rate, rate_history
      `)
      .eq('tenant_id', TENANT_ID)
      .order('created_at'),
  ])

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjects = (subjectsData ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    code: s.code ?? '',
    department: s.departments?.name ?? '',
    departmentId: s.department_id,
    yearGroups: s.year_groups ?? [],
    sessionDurationMins: s.session_duration_mins ?? 60,
    gradingScale: s.grading_scale ?? 'Percentage (0–100%)',
    isActive: s.is_active,
    description: s.description ?? '',
    colour: s.colour ?? 'bg-amber-500',
    maxStudents: s.max_students ?? 6,
    allowsMakeup: s.allows_makeup ?? true,
    requiresAssessment: s.requires_assessment ?? false,
    billingCadenceDefault: s.billing_cadence_default ?? 'Termly',
    examCountdown: s.exam_countdown ?? false,
    conditionalRate: s.conditional_rate ?? false,
    conditionDescription: s.condition_description ?? null,
    weighting: s.weighting ?? { classwork: 10, homework: 20, test: 40, other: 30 },
    qualificationRoutes: s.qualification_routes ?? [],
    examBoards: s.exam_boards ?? [],
    phase: s.phase ?? '',
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courses = (coursesData ?? []).map((c: any) => ({
    id: c.id,
    subjectId: c.subject_id,
    yearGroup: c.year_group ?? '',
    mode: c.mode ?? 'Group',
    sessionDurationMins: c.session_duration_mins ?? 60,
    ratePerSession: c.rate_per_session,
    tier: c.tier ?? 'None',
    minSessions: c.min_sessions ?? 1,
    billingCadence: c.billing_cadence ?? 'Termly',
    effectiveFrom: c.effective_from ?? '',
    isActive: c.is_active,
    conditional: c.conditional ?? false,
    conditionalRateVal: c.conditional_rate_val ?? null,
    conditionText: c.condition_text ?? null,
    fallbackRate: c.fallback_rate ?? null,
    trialRate: c.trial_rate ?? null,
    rateHistory: c.rate_history ?? [],
  }))

  return NextResponse.json({ subjects, courses })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await request.json()

  if (body.type === 'subject') {
    const {
      name, code, departmentId, yearGroups, description, colour, isActive,
      sessionDurationMins, gradingScale, maxStudents, allowsMakeup, requiresAssessment,
      billingCadenceDefault, examCountdown, conditionalRate, conditionDescription,
      weighting, qualificationRoutes, examBoards, phase,
    } = body

    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('subjects')
      .insert({
        tenant_id: TENANT_ID,
        name: name.trim(),
        code: code ?? '',
        department_id: departmentId ?? null,
        year_groups: yearGroups ?? [],
        description: description ?? '',
        colour: colour ?? 'bg-amber-500',
        is_active: isActive ?? true,
        session_duration_mins: sessionDurationMins ?? 60,
        grading_scale: gradingScale ?? 'Percentage (0–100%)',
        max_students: maxStudents ?? 6,
        allows_makeup: allowsMakeup ?? true,
        requires_assessment: requiresAssessment ?? false,
        billing_cadence_default: billingCadenceDefault ?? 'Termly',
        exam_countdown: examCountdown ?? false,
        conditional_rate: conditionalRate ?? false,
        condition_description: conditionDescription ?? null,
        weighting: weighting ?? { classwork: 10, homework: 20, test: 40, other: 30 },
        qualification_routes: qualificationRoutes ?? [],
        exam_boards: examBoards ?? [],
        phase: phase ?? '',
        year_group: (yearGroups ?? [])[0] ?? '',
        session_type: 'Group',
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id }, { status: 201 })
  }

  if (body.type === 'course') {
    const {
      subjectId, subjectName, yearGroup, mode, sessionDurationMins, ratePerSession,
      tier, minSessions, billingCadence, effectiveFrom, isActive,
      conditional, conditionalRateVal, conditionText, fallbackRate, trialRate, rateHistory,
    } = body

    if (!subjectId) return NextResponse.json({ error: 'subjectId is required' }, { status: 400 })

    const courseName = subjectName
      ? `${subjectName} ${yearGroup ?? ''} ${mode ?? 'Group'}`.trim()
      : `Course ${yearGroup ?? ''}`.trim()

    const { data, error } = await supabase
      .from('courses')
      .insert({
        tenant_id: TENANT_ID,
        subject_id: subjectId,
        name: courseName,
        year_group: yearGroup ?? '',
        mode: mode ?? 'Group',
        session_duration_mins: sessionDurationMins ?? 60,
        rate_per_session: ratePerSession ?? 0,
        tier: tier ?? 'None',
        min_sessions: minSessions ?? 1,
        billing_cadence: billingCadence ?? 'Termly',
        effective_from: effectiveFrom ?? new Date().toISOString().slice(0, 10),
        is_active: isActive ?? true,
        conditional: conditional ?? false,
        conditional_rate_val: conditionalRateVal ?? null,
        condition_text: conditionText ?? null,
        fallback_rate: fallbackRate ?? null,
        trial_rate: trialRate ?? null,
        rate_history: rateHistory ?? [],
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id }, { status: 201 })
  }

  return NextResponse.json({ error: 'type must be "subject" or "course"' }, { status: 400 })
}
