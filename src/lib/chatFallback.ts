// Chat follow-ups without the AI (offline, rate limit, local preview): merge the keyword parse of
// the new message into the previous filters, so "yang lebih murah" or "di Syahdan aja" still work.
import { BUDGET_FILTER_MAX, describeParsed, parseQuery, type ParsedQuery } from './aiSearch'

const CHEAPER_RE = /\b(lebih murah|yang murah|termurah|lebih hemat)\b/i
const MIN_BUDGET = 10000

export function mergeFollowUp(previous: ParsedQuery | null, message: string): ParsedQuery {
  const next = parseQuery(message)
  if (!previous) return next
  const merged: ParsedQuery = {
    ...previous,
    facilities: [...new Set([...previous.facilities, ...next.facilities])],
    menuKeywords: next.menuKeywords.length > 0 ? next.menuKeywords : previous.menuKeywords,
  }
  if (next.category) merged.category = next.category
  if (next.campus) {
    merged.campus = next.campus
    delete merged.nearest
  }
  if (next.shortQueue) merged.shortQueue = true
  if (next.quiet) merged.quiet = true
  if (next.openNow) merged.openNow = true
  if (next.nearest && !merged.campus) merged.nearest = true
  if (CHEAPER_RE.test(message)) {
    merged.maxBudget = previous.maxBudget
      ? Math.max(MIN_BUDGET, Math.round((previous.maxBudget * 0.75) / 1000) * 1000)
      : BUDGET_FILTER_MAX
  } else if (next.maxBudget !== undefined) {
    merged.maxBudget = next.maxBudget
  }
  return merged
}

export function fallbackReply(parsed: ParsedQuery): string {
  return `Oke, aku carikan ${describeParsed(parsed)}.`
}
