import { useEffect, useState } from 'react'

/** How long the fake "AI sedang menganalisis…" state lasts (must stay well under 1s). */
const ANALYSIS_MS = 600

/** Last search already "analysed" this session, so going back to the same results does not re-run it. */
let lastAnalyzedKey: string | null = null

/**
 * Returns true for ~600ms whenever `key` (the search intent) changes.
 * Disabled searches (plain Radar browsing) never show the analysing state.
 */
export function useFakeAnalysis(key: string, enabled: boolean): boolean {
  const [doneKey, setDoneKey] = useState<string | null>(() => (lastAnalyzedKey === key ? key : null))
  const analyzing = enabled && doneKey !== key && lastAnalyzedKey !== key

  useEffect(() => {
    if (!analyzing) return undefined
    const timer = window.setTimeout(() => {
      lastAnalyzedKey = key
      setDoneKey(key)
    }, ANALYSIS_MS)
    return () => window.clearTimeout(timer)
  }, [analyzing, key])

  return analyzing
}
