'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface CurrentUser {
  name: string
  email: string
  role: string
}

const LOADING: CurrentUser = { name: '', email: '', role: '' }
const SESSION_KEY_PREFIX = 'enrolla:current-user-v2:'

let cached: CurrentUser | null = null
let cachedUserId: string | null = null
let inFlight: Promise<void> | null = null

function sessionKey(userId: string) { return `${SESSION_KEY_PREFIX}${userId}` }

function readSession(userId: string): CurrentUser | null {
  try {
    if (typeof sessionStorage === 'undefined') return null
    const raw = sessionStorage.getItem(sessionKey(userId))
    return raw ? (JSON.parse(raw) as CurrentUser) : null
  } catch { return null }
}

function writeSession(userId: string, u: CurrentUser) {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(sessionKey(userId), JSON.stringify(u))
  } catch {}
}

function clearSession(userId?: string | null) {
  try {
    if (typeof sessionStorage === 'undefined') return
    if (userId) {
      sessionStorage.removeItem(sessionKey(userId))
    } else {
      // Clear all enrolla user cache keys
      Object.keys(sessionStorage)
        .filter(k => k.startsWith(SESSION_KEY_PREFIX))
        .forEach(k => sessionStorage.removeItem(k))
    }
  } catch {}
}

export function clearCurrentUserCache() {
  clearSession(cachedUserId)
  cached = null
  cachedUserId = null
  inFlight = null
}

export function useCurrentUser(): CurrentUser {
  // Always start with LOADING so SSR and client initial renders match (avoids hydration mismatch).
  // Cached value is applied in useEffect (client-only) as a fast-path before the async fetch.
  const [user, setUser] = useState<CurrentUser>(LOADING)

  useEffect(() => {
    // Fast-path: apply in-memory cache immediately (session read is deferred to load() so it's
    // scoped to the verified user ID, preventing stale data from a previous user leaking in).
    if (cached) setUser(cached)

    const supabase = createClient()

    async function load(userId: string) {
      if (cached && cachedUserId === userId) { setUser(cached); return }
      // Check user-ID-scoped sessionStorage before hitting the network
      const fromSession = readSession(userId)
      if (fromSession) {
        cached = fromSession
        cachedUserId = userId
        setUser(fromSession)
        return
      }
      if (inFlight) { await inFlight; if (cached) setUser(cached); return }
      inFlight = (async () => {
        const data = await fetch('/api/auth/me').then(r => r.ok ? r.json() : null).catch(() => null)
        if (data) {
          cached = { name: data.name, email: data.email ?? '', role: data.role }
          cachedUserId = userId
          writeSession(userId, cached)
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
        clearSession(cachedUserId)
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
