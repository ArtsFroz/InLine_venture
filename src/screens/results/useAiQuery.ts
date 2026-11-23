import { useEffect, useState } from 'react'
import { fetchAiParse } from '../../lib/aiClient'
import type { ParsedQuery } from '../../lib/aiSearch'

export interface AiQuery {
  loading: boolean
  /** Filters from the AI, or null when the AI is unavailable (use the keyword parser). */
  parsed: ParsedQuery | null
}

/** Asks the AI to understand `q`. Empty `q` (plain Radar browsing) never calls it. */
export function useAiQuery(q: string): AiQuery {
  const [result, setResult] = useState<{ q: string; parsed: ParsedQuery | null } | null>(null)
  const query = q.trim()

  useEffect(() => {
    if (!query) return undefined
    let cancelled = false
    fetchAiParse(query).then((parsed) => {
      if (!cancelled) setResult({ q: query, parsed })
    })
    return () => {
      cancelled = true
    }
  }, [query])

  if (!query) return { loading: false, parsed: null }
  if (result?.q !== query) return { loading: true, parsed: null }
  return { loading: false, parsed: result.parsed }
}
