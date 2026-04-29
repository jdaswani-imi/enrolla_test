"use client";

import { useState, useCallback, useRef } from "react";

export interface StaffMention {
  id: string;
  name: string;
  role: string;
  department: string;
}

export function useStaffSearch() {
  const [results, setResults] = useState<StaffMention[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortRef = useRef<AbortController | undefined>(undefined);

  const search = useCallback((query: string) => {
    clearTimeout(timerRef.current);
    abortRef.current?.abort();

    // No status filter — invited/on_leave staff should be mentionable too
    const url = query.trim()
      ? `/api/staff?q=${encodeURIComponent(query.trim())}`
      : `/api/staff`;

    timerRef.current = setTimeout(async () => {
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const res = await fetch(url, { signal: ac.signal });
        if (res.ok) {
          // API returns { data: [...] } — unwrap before slicing
          const json = await res.json();
          const rows = (Array.isArray(json) ? json : (json.data ?? [])) as Array<{
            id: string;
            name: string;
            role: string;
            department: string;
          }>;
          setResults(
            rows.slice(0, 8).map(({ id, name, role, department }) => ({
              id,
              name,
              role,
              department,
            })),
          );
        }
      } catch {
        // ignore aborts and network errors
      } finally {
        setLoading(false);
      }
    }, 120);
  }, []);

  const clear = useCallback(() => {
    clearTimeout(timerRef.current);
    abortRef.current?.abort();
    setResults([]);
    setLoading(false);
  }, []);

  return { results, loading, search, clear };
}
