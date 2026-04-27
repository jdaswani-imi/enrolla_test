'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface CurrentUser {
  name: string
  email: string
  role: string
}

const LOADING: CurrentUser = { name: '', email: '', role: '' }
let cached: CurrentUser | null = null
let cachedUserId: string | null = null

export function clearCurrentUserCache() {
  cached = null
  cachedUserId = null
}

export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<CurrentUser>(cached ?? LOADING)

  useEffect(() => {
    const supabase = createClient()

    async function load(userId: string) {
      if (cached && cachedUserId === userId) return
      const data = await fetch('/api/auth/me').then(r => r.ok ? r.json() : null).catch(() => null)
      if (data) {
        cached = { name: data.name, email: data.email ?? '', role: data.role }
        cachedUserId = userId
        setUser(cached)
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) load(data.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        cached = null
        cachedUserId = null
        setUser(LOADING)
      } else if (session.user.id !== cachedUserId) {
        load(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return user
}
