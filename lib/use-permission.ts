'use client'
import { useRole } from './role-context'
import { canDo, canAccess } from './role-config'

export function usePermission() {
  const { role } = useRole()
  return {
    can: (action: string) => canDo(role, action),
    sees: (navId: string) => canAccess(role, navId),
    role,
  }
}
