import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function verifyJwtClaims() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_EMAIL!,
    password: process.env.TEST_USER_PASSWORD!,
  })

  if (error || !data.session) {
    console.error('Login failed:', error)
    process.exit(1)
  }

  const payload = JSON.parse(
    Buffer.from(data.session.access_token.split('.')[1], 'base64').toString()
  )

  console.log('JWT claims:', JSON.stringify(payload, null, 2))

  const hasTenantId = !!payload.tenant_id
  const hasUserRole = !!payload.user_role

  console.log(`tenant_id present: ${hasTenantId} (value: ${payload.tenant_id})`)
  console.log(`user_role present: ${hasUserRole} (value: ${payload.user_role})`)

  if (!hasTenantId || !hasUserRole) {
    console.error('FAIL: Hook is not working — JWT is missing claims')
    process.exit(1)
  }

  console.log('PASS: JWT contains both tenant_id and user_role claims')
  process.exit(0)
}

verifyJwtClaims()
