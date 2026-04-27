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
  const q = searchParams.get('q')?.trim() ?? ''
  const dept = searchParams.get('department') ?? ''
  const risk = searchParams.get('risk') ?? ''

  // Fetch all students for the tenant
  let studentQuery = supabase
    .from('students')
    .select('id, first_name, last_name, year_group, status, notes')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'active')
    .order('last_name')

  if (q) studentQuery = studentQuery.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)

  const { data: students, error: sErr } = await studentQuery
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })

  const studentIds = (students ?? []).map(s => s.id)
  if (studentIds.length === 0) return NextResponse.json({ data: [] })

  // Attendance counts per student
  const { data: attRows } = await supabase
    .from('attendance_records')
    .select('student_id, status')
    .eq('tenant_id', TENANT_ID)
    .in('student_id', studentIds)

  const attByStudent: Record<string, { total: number; present: number }> = {}
  for (const r of attRows ?? []) {
    if (!attByStudent[r.student_id]) attByStudent[r.student_id] = { total: 0, present: 0 }
    attByStudent[r.student_id].total++
    if (r.status === 'present') attByStudent[r.student_id].present++
  }

  // Average assessment scores per student (absent attempts count as 0)
  const { data: attempts } = await supabase
    .from('assessment_attempts')
    .select('student_id, score, absent')
    .eq('tenant_id', TENANT_ID)
    .in('student_id', studentIds)

  const scoresByStudent: Record<string, number[]> = {}
  for (const a of attempts ?? []) {
    if (!scoresByStudent[a.student_id]) scoresByStudent[a.student_id] = []
    scoresByStudent[a.student_id].push(a.absent ? 0 : (a.score ?? 0))
  }

  // Build rows
  const rows = (students ?? []).map(s => {
    const att = attByStudent[s.id] ?? { total: 0, present: 0 }
    const attRate = att.total > 0 ? Math.round((att.present / att.total) * 100) : null
    const scores = scoresByStudent[s.id] ?? []
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

    const churnRisk =
      attRate === null ? 'Unknown'
      : attRate < 70   ? 'High'
      : attRate < 82   ? 'Medium'
      : 'Low'

    const predictedGrade =
      avgScore === null ? null
      : avgScore >= 85  ? 'A'
      : avgScore >= 70  ? 'B'
      : avgScore >= 55  ? 'C'
      : avgScore >= 40  ? 'D'
      : 'E'

    return {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`.trim(),
      yearGroup: s.year_group,
      status: s.status,
      attendanceRate: attRate,
      avgScore,
      predictedGrade,
      churnRisk,
    }
  }).filter(r => {
    if (risk && r.churnRisk !== risk) return false
    return true
  })

  return NextResponse.json({ data: rows })
}
