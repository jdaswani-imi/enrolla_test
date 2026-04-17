'use client'
import { useRole } from '@/lib/role-context'
import { ShieldAlert } from 'lucide-react'

interface RoleBannerProps {
  message: string
}

export function RoleBanner({ message }: RoleBannerProps) {
  const { role } = useRole()
  if (role === 'Super Admin') return null
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-sm text-slate-600">
      <ShieldAlert size={15} className="text-amber-500 flex-shrink-0" />
      <span>{message}</span>
      <span className="ml-auto text-xs text-slate-400 font-medium">{role}</span>
    </div>
  )
}
