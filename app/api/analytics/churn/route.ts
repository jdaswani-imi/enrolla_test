import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const threshold = Number(searchParams.get('threshold') ?? '70') // attendance % below this = at-risk

  // Get all active students
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('id, first_name, last_name, year_group, status')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active')

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })

  const studentIds = (students ?? []).map(s => s.id)
  if (studentIds.length === 0) return NextResponse.json({ data: [] })

  // Attendance records
  const { data: attRows } = await supabase
    .from('attendance_records')
    .select('student_id, status')
    .eq('tenant_id', TENANT_ID)
    .in('student_id', studentIds)

  // Assessment attempts
  const { data: attempts } = await supabase
    .from('assessment_attempts')
    .select('student_id, score, absent')
    .eq('tenant_id', TENANT_ID)
    .in('student_id', studentIds)

  // Build per-student stats
  const attByStudent: Record<string, { total: number; present: number }> = {}
  for (const r of attRows ?? []) {
    if (!attByStudent[r.student_id]) attByStudent[r.student_id] = { total: 0, present: 0 }
    attByStudent[r.student_id].total++
    if (r.status === 'present') attByStudent[r.student_id].present++
  }

  const scoresByStudent: Record<string, number[]> = {}
  for (const a of attempts ?? []) {
    if (!scoresByStudent[a.student_id]) scoresByStudent[a.student_id] = []
    scoresByStudent[a.student_id].push(a.absent ? 0 : (a.score ?? 0))
  }

  const atRisk = (students ?? [])
    .map(s => {
      const att = attByStudent[s.id] ?? { total: 0, present: 0 }
      const attRate = att.total > 0 ? Math.round((att.present / att.total) * 100) : null
      const scores = scoresByStudent[s.id] ?? []
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null

      const riskFactors: string[] = []
      if (attRate !== null && attRate < threshold) riskFactors.push('Low attendance')
      if (avgScore !== null && avgScore < 50) riskFactors.push('Low assessment scores')
      if (att.total === 0) riskFactors.push('No attendance data')

      const churnScore =
        attRate === null ? 50
        : attRate < 60    ? 90
        : attRate < 70    ? 75
        : attRate < 82    ? 50
        : 20

      return {
        id: s.id,
        name: `${s.first_name} ${s.last_name}`.trim(),
        yearGroup: s.year_group,
        attendanceRate: attRate,
        avgScore,
        churnScore,
        riskFactors,
      }
    })
    .filter(s => s.churnScore >= 50)
    .sort((a, b) => b.churnScore - a.churnScore)

  return NextResponse.json({
    data: atRisk,
    meta: { total: atRisk.length, threshold },
  })
}
