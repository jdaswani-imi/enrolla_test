'use client'

import { useState, useEffect } from 'react'

export interface CurrentUser {
  name: string
  email: string
  role: string
}

const LOADING: CurrentUser = { name: '', email: '', role: '' }
let cached: CurrentUser | null = null

export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<CurrentUser>(cached ?? LOADING)

  useEffect(() => {
    if (cached) return
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          cached = { name: data.name, email: data.email ?? '', role: data.role }
          setUser(cached)
        }
      })
      .catch(() => {})
  }, [])

  return user
}
