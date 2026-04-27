import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'
import { requireAuth } from '@/lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_STATUSES = ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Rejected']

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params

  const { data, error } = await supabase
    .from('feedback_items')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    data: {
      id: data.id,
      studentName: data.student_name ?? '',
      subject: data.subject ?? '',
      teacher: data.teacher ?? '',
      department: data.department ?? '',
      sessionDate: data.session_date ?? '',
      status: data.status ?? 'Draft',
      score: data.score ?? 0,
      aiSummary: data.ai_summary ?? null,
      selectors: data.selectors ?? [],
      teacherNotes: data.teacher_notes ?? '',
    },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await req.json()
  const { status, rejectedReason, teacherNotes, score } = body as {
    status?: string
    rejectedReason?: string
    teacherNotes?: string
    score?: number
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Verify it belongs to this tenant
  const { data: existing } = await supabase
    .from('feedback_items')
    .select('id, status')
    .eq('tenant_id', TENANT_ID)
    .eq('id', id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status !== undefined) patch.status = status
  if (teacherNotes !== undefined) patch.teacher_notes = teacherNotes
  if (score !== undefined) patch.score = score
  // Store rejection reason back in teacher_notes or a dedicated field
  // feedback_items has no rejected_reason column, so we append to notes
  if (status === 'Rejected' && rejectedReason) {
    patch.teacher_notes = `[Rejected: ${rejectedReason}]\n${body.teacherNotes ?? ''}`
  }

  const { data, error } = await supabase
    .from('feedback_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
