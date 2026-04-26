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

  const patch: Record<string, unknown> = {}

  // Simple scalar fields
  if (body.status !== undefined)               patch.status = body.status
  if (body.cancellation_reason !== undefined)  patch.cancellation_reason = body.cancellation_reason
  if (body.admin_override_reason !== undefined) patch.admin_override_reason = body.admin_override_reason
  if (body.startTime !== undefined)            patch.start_time = body.startTime
  if (body.endTime !== undefined)              patch.end_time   = body.endTime

  // FK fields — prefer explicit IDs, fall back to name lookup
  const needsSubjectLookup = body.subject   && !body.subjectId
  const needsStaffLookup   = body.teacher   && !body.teacherId
  const needsRoomLookup    = body.room      && !body.roomId

  if (body.subjectId) patch.subject_id = body.subjectId
  if (body.teacherId) patch.staff_id   = body.teacherId
  if (body.roomId)    patch.room_id    = body.roomId

  // Fallback name lookups (used when editing sessions created before IDs were stored)
  if (needsSubjectLookup || needsStaffLookup || needsRoomLookup) {
    const [subjectRes, staffRes, roomRes] = await Promise.all([
      needsSubjectLookup
        ? supabase.from('subjects').select('id').eq('tenant_id', TENANT_ID).eq('name', body.subject).maybeSingle()
        : Promise.resolve({ data: null }),
      needsStaffLookup
        ? supabase.from('staff').select('id').eq('tenant_id', TENANT_ID)
            .ilike('first_name', `%${body.teacher.split(' ')[0]}%`)
            .ilike('last_name', `%${body.teacher.split(' ').slice(1).join(' ') || body.teacher.split(' ')[0]}%`)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      needsRoomLookup
        ? supabase.from('rooms').select('id').eq('tenant_id', TENANT_ID).eq('name', body.room).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    if ((subjectRes as { data: { id: string } | null }).data?.id) patch.subject_id = (subjectRes as { data: { id: string } }).data.id
    if ((staffRes   as { data: { id: string } | null }).data?.id) patch.staff_id   = (staffRes   as { data: { id: string } }).data.id
    if ((roomRes    as { data: { id: string } | null }).data?.id) patch.room_id    = (roomRes    as { data: { id: string } }).data.id
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ success: true })
  }

  const { error } = await supabase
    .from('sessions')
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
