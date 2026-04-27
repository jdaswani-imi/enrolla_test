'use client'

import { useState, useEffect } from 'react'
import { currentUser as mockCurrentUser } from '@/lib/mock-data'

export interface CurrentUser {
  name: string
  email: string
  role: string
}

const FALLBACK: CurrentUser = {
  name: mockCurrentUser.name,
  email: '',
  role: mockCurrentUser.role,
}

let cached: CurrentUser | null = null

export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<CurrentUser>(cached ?? FALLBACK)

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
