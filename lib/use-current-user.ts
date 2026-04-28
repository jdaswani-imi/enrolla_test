'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface CurrentUser {
  name: string
  email: string
  role: string
}

const LOADING: CurrentUser = { name: '', email: '', role: '' }
const SESSION_KEY = 'enrolla:current-user-v1'

let cached: CurrentUser | null = null
let cachedUserId: string | null = null
let inFlight: Promise<void> | null = null

function readSession(): CurrentUser | null {
  try {
    if (typeof sessionStorage === 'undefined') return null
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as CurrentUser) : null
  } catch { return null }
}

function writeSession(u: CurrentUser) {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(SESSION_KEY, JSON.stringify(u))
  } catch {}
}

function clearSession() {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(SESSION_KEY)
  } catch {}
}

export function clearCurrentUserCache() {
  cached = null
  cachedUserId = null
  inFlight = null
  clearSession()
}

export function useCurrentUser(): CurrentUser {
  // Always start with LOADING so SSR and client initial renders match (avoids hydration mismatch).
  // Cached value is applied in useEffect (client-only) as a fast-path before the async fetch.
  const [user, setUser] = useState<CurrentUser>(LOADING)

  useEffect(() => {
    // Fast-path: apply in-memory cache or sessionStorage to avoid a visible flash
    if (cached) {
      setUser(cached)
    } else {
      const fromSession = readSession()
      if (fromSession) {
        cached = fromSession
        setUser(fromSession)
      }
    }

    const supabase = createClient()

    async function load(userId: string) {
      if (cached && cachedUserId === userId) { setUser(cached); return }
      if (inFlight) { await inFlight; if (cached) setUser(cached); return }
      inFlight = (async () => {
        const data = await fetch('/api/auth/me').then(r => r.ok ? r.json() : null).catch(() => null)
        if (data) {
          cached = { name: data.name, email: data.email ?? '', role: data.role }
          cachedUserId = userId
          writeSession(cached)
        }
      })().finally(() => { inFlight = null })
      await inFlight
      if (cached) setUser(cached)
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
