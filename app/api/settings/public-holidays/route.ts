import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TENANT_ID } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const yearId = searchParams.get('yearId')

  let query = supabase
    .from('public_holidays')
    .select('id, academic_year_id, name, date, source')
    .eq('tenant_id', TENANT_ID)
    .order('date', { ascending: true })

  if (yearId) query = query.eq('academic_year_id', yearId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json((data ?? []).map((h) => ({
    id: h.id,
    academicYearId: h.academic_year_id,
    name: h.name,
    date: h.date,
    source: h.source,
  })))
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { academicYearId, name, date, source = 'custom' } = body

  if (!academicYearId || !name?.trim() || !date) {
    return NextResponse.json({ error: 'academicYearId, name, date required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('public_holidays')
    .insert({ tenant_id: TENANT_ID, academic_year_id: academicYearId, name: name.trim(), date, source })
    .select('id, academic_year_id, name, date, source')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    id: data.id,
    academicYearId: data.academic_year_id,
    name: data.name,
    date: data.date,
    source: data.source,
  }, { status: 201 })
}
