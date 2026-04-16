'use client'
import { useState } from 'react'

export interface SavedSegment {
  id: string
  name: string
  filters: Record<string, string[]>
  createdAt: string
}

export function useSavedSegments(pageKey: string) {
  const storageKey = `enrolla_segments_${pageKey}`

  const [segments, setSegments] = useState<SavedSegment[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]')
    } catch { return [] }
  })

  function saveSegment(name: string, filters: Record<string, string[]>) {
    const seg: SavedSegment = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    }
    const updated = [...segments, seg]
    setSegments(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  function deleteSegment(id: string) {
    const updated = segments.filter(s => s.id !== id)
    setSegments(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  return { segments, saveSegment, deleteSegment }
}
