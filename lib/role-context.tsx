'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type Role } from './role-config'

const STORAGE_KEY = 'enrolla_role'
const DEFAULT_ROLE: Role = 'Super Admin'

interface RoleContextValue {
  role: Role
  setRole: (role: Role) => void
}

const RoleContext = createContext<RoleContextValue>({
  role: DEFAULT_ROLE,
  setRole: () => {},
})

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(DEFAULT_ROLE)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) setRoleState(stored as Role)
    } catch {}
  }, [])

  function setRole(r: Role) {
    setRoleState(r)
    try { sessionStorage.setItem(STORAGE_KEY, r) } catch {}
  }

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
