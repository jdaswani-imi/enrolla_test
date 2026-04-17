'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { type Role } from './role-config'
import { currentUser } from './mock-data'

interface RoleContextValue {
  role: Role
  setRole: (role: Role) => void
}

const RoleContext = createContext<RoleContextValue>({
  role: currentUser.role as Role,
  setRole: () => {},
})

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(currentUser.role as Role)
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
