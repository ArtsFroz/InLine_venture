// Browser side of the AI search: asks /api/ai-search (Netlify Function) to turn a sentence into
// filters. Returns null on any problem so the caller can fall back to the keyword parser.
import type { Campus, Category } from '../state/types'
import { CAMPUSES } from '../state/types'
import { CATEGORIES, type ParsedQuery } from './aiSearch'
import type { ChatContext } from './aiContext'

const ENDPOINT = '/api/ai-search'
const TIMEOUT_MS = 12_000
const FACILITIES = ['Wi‑Fi', 'Colokan', 'Area nugas', 'Outdoor', 'Indoor']
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

/** Answers already received this session, so going back to a result does not ask again. */
const cache = new Map<string, ParsedQuery | null>()

function toParsed(raw: unknown): ParsedQuery | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const parsed: ParsedQuery = {
    facilities: strings(r.facilities).filter((f) => FACILITIES.includes(f)),
    menuKeywords: strings(r.menuKeywords)
      .map((k) => k.toLowerCase().trim())
      .filter((k) => k.length > 0 && k.length <= 40)
      .slice(0, 5),
  }
  if (typeof r.category === 'string' && (CATEGORIES as readonly string[]).includes(r.category)) {
    parsed.category = r.category as Category
  }
  if (typeof r.campus === 'string' && (CAMPUSES as readonly string[]).includes(r.campus)) parsed.campus = r.campus as Campus
  if (typeof r.maxBudget === 'number' && r.maxBudget >= 1000 && r.maxBudget <= 1_000_000) parsed.maxBudget = Math.round(r.maxBudget)
  if (r.quiet === true) parsed.quiet = true
  if (r.notCrowded === true) parsed.shortQueue = true
  if (r.openNow === true) parsed.openNow = true
  if (r.nearest === true && !parsed.campus) parsed.nearest = true
  return parsed
}

export async function fetchAiParse(q: string): Promise<ParsedQuery | null> {
  const key = q.trim()
  if (cache.has(key)) return cache.get(key) ?? null
  const body = await postAi({ q: key })
  const parsed = body ? toParsed(body.parsed) : null
  if (parsed) cache.set(key, parsed) // failures (rate limit, offline) are retried next time
  return parsed
}

/** Filters in the function's wire format (the inverse of toParsed). */
function toWire(parsed: ParsedQuery) {
  return {
    category: parsed.category ?? null,
    campus: parsed.campus ?? null,
    maxBudget: parsed.maxBudget ?? null,
    quiet: parsed.quiet === true,
    notCrowded: parsed.shortQueue === true,
    openNow: parsed.openNow === true,
    nearest: parsed.nearest === true,
    facilities: parsed.facilities,
    menuKeywords: parsed.menuKeywords,
  }
}

export type AiMode = 'answer' | 'ask' | 'offtopic'

export interface AiChatTurn {
  role: 'user' | 'ai'
  text: string
}

export interface AiChatAnswer {
  parsed: ParsedQuery
  mode: AiMode
  /** Place ids the AI talks about (checked against the table on the server). */
  picks: string[]
  /** Null when the AI's sentence was not backed by our data: show the app's own summary instead. */
  reply: string | null
  suggestions: string[]
}

const MODES: readonly AiMode[] = ['answer', 'ask', 'offtopic']

/** One chat turn: the new message refines `previous` filters. Null when the AI is unavailable. */
export async function fetchAiChat(
  message: string,
  previous: ParsedQuery | null,
  history: readonly AiChatTurn[],
  context: ChatContext,
): Promise<AiChatAnswer | null> {
  const body = await postAi({ q: message.trim(), previous: previous ? toWire(previous) : undefined, history, context })
  const parsed = body ? toParsed(body.parsed) : null
  const mode = MODES.find((m) => m === body?.mode)
  if (!body || !parsed || !mode) return null
  return {
    parsed,
    mode,
    picks: strings(body.picks).slice(0, 3),
    reply: typeof body.reply === 'string' && body.reply.trim() ? body.reply.trim().slice(0, 320) : null,
    suggestions: strings(body.suggestions).filter((t) => t.length <= 32).slice(0, 3),
  }
}

async function postAi(payload: object): Promise<Record<string, unknown> | null> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const body: unknown = await res.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  } catch {
    return null // offline, timeout, or no function deployed (e.g. local preview)
  } finally {
    window.clearTimeout(timer)
  }
}
