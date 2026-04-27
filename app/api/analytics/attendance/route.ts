import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  // Last 8 weeks of attendance records with session info
  const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString()

  const { data: records, error } = await supabase
    .from('attendance_records')
    .select(`
      status, created_at,
      sessions(session_date, subjects(name, departments(name)))
    `)
    .eq('tenant_id', TENANT_ID)
    .gte('created_at', eightWeeksAgo)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Weekly trend (ISO week label)
  const weeklyMap: Record<string, { total: number; present: number }> = {}
  for (const r of records ?? []) {
    const date = new Date((r.sessions as { session_date?: string } | null)?.session_date ?? r.created_at)
    const week = `W${getISOWeek(date)}`
    if (!weeklyMap[week]) weeklyMap[week] = { total: 0, present: 0 }
    weeklyMap[week].total++
    if (r.status === 'present') weeklyMap[week].present++
  }

  const weeklyTrend = Object.entries(weeklyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, { total, present }]) => ({
      week,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    }))

  // By department
  const deptMap: Record<string, { total: number; present: number }> = {}
  for (const r of records ?? []) {
    const session = r.sessions as { subjects?: { departments?: { name?: string } | null } | null } | null
    const dept = session?.subjects?.departments?.name ?? 'Unknown'
    if (!deptMap[dept]) deptMap[dept] = { total: 0, present: 0 }
    deptMap[dept].total++
    if (r.status === 'present') deptMap[dept].present++
  }

  const byDepartment = Object.entries(deptMap).map(([dept, { total, present }]) => ({
    department: dept,
    rate: total > 0 ? Math.round((present / total) * 100) : 0,
    total,
    present,
  }))

  // Overall rate
  const totalRecords = (records ?? []).length
  const totalPresent = (records ?? []).filter(r => r.status === 'present').length
  const overallRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0

  return NextResponse.json({ data: { weeklyTrend, byDepartment, overallRate, totalRecords, totalPresent } })
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
