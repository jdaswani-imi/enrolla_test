import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const queryError = searchParams.get('error')
  const queryErrorCode = searchParams.get('error_code')

  if (queryError || queryErrorCode) {
    return NextResponse.redirect(`${origin}/login?error=link_expired`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/login?error=link_expired`)
  }

  // No code — likely a hash-based (implicit) flow from an invite or magic-link.
  // The URL hash is never sent to the server, so hand off to the client page.
  const hashCallbackUrl = new URL(`${origin}/auth/hash-callback`)
  hashCallbackUrl.searchParams.set('next', next)
  return NextResponse.redirect(hashCallbackUrl.toString())
}
