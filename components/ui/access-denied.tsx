'use client'

import { ShieldOff } from 'lucide-react'

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
        <ShieldOff className="w-7 h-7 text-slate-400" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-1">Access restricted</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          Your role doesn&apos;t have permission to view this module. Contact your administrator if you need access.
        </p>
      </div>
    </div>
  )
}
