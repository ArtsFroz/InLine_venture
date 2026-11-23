// POST /api/ai-search { q, previous?, history?, context? } → { parsed, reply, mode, picks, suggestions }.
// Turns a casual Indonesian food search, or a chat message, into filters; with `context` (the time
// and the app's own table of places) it also picks places and writes a short reply about them.
// Uses Google Gemini on its free tier (Google may use free-tier prompts to improve its products,
// so only the message text and public place data are sent: no name, email or location).
// Runs on Netlify so the API key never reaches the browser; the app falls back to its keyword
// parser on any error, and to its own summary when the reply is not backed by the table.
import { z } from 'zod'
import { cleanSuggestions, ContextSchema, contextLines, ground, moneyIn, type ChatContext } from '../lib/grounding'
import { SYSTEM } from '../lib/prompt'

const MAX_QUERY_CHARS = 200
const MAX_HISTORY = 6
const MAX_HISTORY_CHARS = 320
const DEFAULT_MODEL = 'gemini-3.5-flash-lite'
const TIMEOUT_MS = 10_000
const TEMPERATURE = 0.4
const FACILITIES = ['Wi‑Fi', 'Colokan', 'Area nugas', 'Outdoor', 'Indoor'] as const
const MODES = ['answer', 'ask', 'offtopic'] as const

const FiltersSchema = z.object({
  category: z.enum(['Kopi', 'Kantin', 'Minuman', 'Snack']).nullable(),
  campus: z.enum(['Anggrek', 'Syahdan', 'Kijang', 'Binus Square']).nullable(),
  maxBudget: z.number().int().nullable(),
  quiet: z.boolean(),
  notCrowded: z.boolean(),
  openNow: z.boolean(),
  nearest: z.boolean(),
  facilities: z.array(z.enum(FACILITIES)),
  menuKeywords: z.array(z.string()),
})
type Filters = z.infer<typeof FiltersSchema>

const AnswerSchema = FiltersSchema.extend({
  mode: z.enum(MODES),
  picks: z.array(z.string()),
  reply: z.string(),
  suggestions: z.array(z.string()),
})

const HistorySchema = z
  .array(z.object({ role: z.enum(['user', 'ai']), text: z.string().max(MAX_HISTORY_CHARS) }))
  .transform((h) => h.slice(-MAX_HISTORY))

/** Same shape as AnswerSchema, in the OpenAPI subset Gemini's responseSchema accepts. */
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    mode: { type: 'STRING', enum: [...MODES] },
    category: { type: 'STRING', enum: ['Kopi', 'Kantin', 'Minuman', 'Snack'], nullable: true },
    campus: { type: 'STRING', enum: ['Anggrek', 'Syahdan', 'Kijang', 'Binus Square'], nullable: true },
    maxBudget: { type: 'INTEGER', nullable: true },
    quiet: { type: 'BOOLEAN' },
    notCrowded: { type: 'BOOLEAN' },
    openNow: { type: 'BOOLEAN' },
    nearest: { type: 'BOOLEAN' },
    facilities: { type: 'ARRAY', items: { type: 'STRING', enum: [...FACILITIES] } },
    menuKeywords: { type: 'ARRAY', items: { type: 'STRING' } },
    picks: { type: 'ARRAY', items: { type: 'STRING' } },
    reply: { type: 'STRING' },
    suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: [
    'mode', 'category', 'campus', 'maxBudget', 'quiet', 'notCrowded', 'openNow', 'nearest',
    'facilities', 'menuKeywords', 'picks', 'reply', 'suggestions',
  ],
  propertyOrdering: [
    'mode', 'category', 'campus', 'maxBudget', 'quiet', 'notCrowded', 'openNow', 'nearest',
    'facilities', 'menuKeywords', 'picks', 'reply', 'suggestions',
  ],
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

type History = z.infer<typeof HistorySchema>

/** The user message for Gemini: the place table, the conversation so far, earlier filters, the new message. */
function userTurn(q: string, previous: Filters | null, history: History, ctx: ChatContext | null): string {
  const lines: string[] = []
  if (ctx) lines.push(contextLines(ctx), '')
  if (history.length > 0) {
    lines.push('Percakapan sebelumnya:')
    for (const h of history) lines.push(`${h.role === 'user' ? 'Pengguna' : 'Kamu'}: ${h.text.replace(/\s+/g, ' ')}`)
  }
  if (previous) lines.push(`Filter sebelumnya: ${JSON.stringify(previous)}`)
  lines.push(`Pesan baru: ${q}`)
  return lines.join('\n')
}

/** Concatenated text of the first candidate, or '' when Gemini returned none (e.g. blocked). */
function candidateText(body: unknown): string {
  const parts = (body as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] })?.candidates?.[0]?.content?.parts
  return Array.isArray(parts) ? parts.map((p) => (typeof p.text === 'string' ? p.text : '')).join('') : ''
}

interface ChatRequest {
  q: string
  previous: Filters | null
  history: History
  ctx: ChatContext | null
}

async function readBody(req: Request): Promise<ChatRequest | null> {
  try {
    const body = (await req.json()) as Record<string, unknown> | null
    const q = typeof body?.q === 'string' ? body.q.trim() : ''
    const previous = FiltersSchema.safeParse(body?.previous)
    const history = HistorySchema.safeParse(body?.history ?? [])
    const ctx = body?.context === undefined ? null : ContextSchema.safeParse(body.context)
    if (ctx && !ctx.success) return null
    return {
      q,
      previous: previous.success ? previous.data : null,
      history: history.success ? history.data : [],
      ctx: ctx?.data ?? null,
    }
  } catch {
    return null
  }
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Gunakan POST.' }, 405)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return json({ error: 'AI belum dikonfigurasi.' }, 503)

  const input = await readBody(req)
  if (!input) return json({ error: 'Permintaan tidak valid.' }, 400)
  const { q, previous, history, ctx } = input
  if (!q || q.length > MAX_QUERY_CHARS) return json({ error: `Kalimat 1–${MAX_QUERY_CHARS} karakter.` }, 400)

  const model = process.env.INLINE_AI_MODEL || DEFAULT_MODEL
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: userTurn(q, previous, history, ctx) }] }],
        generationConfig: { temperature: TEMPERATURE, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
      }),
    })
    if (!res.ok) {
      console.error(`ai-search failed: Gemini status ${res.status}`)
      return json({ error: 'AI sedang tidak tersedia.' }, res.status === 429 ? 429 : 502)
    }
    const answer = AnswerSchema.safeParse(JSON.parse(candidateText(await res.json()) || 'null'))
    if (!answer.success) return json({ error: 'AI tidak bisa memproses kalimat ini.' }, 422)

    const { mode, picks, reply, suggestions, ...parsed } = answer.data
    const filters = mode === 'offtopic' && previous ? previous : parsed
    const allowedMoney = [...moneyIn(q), ...history.flatMap((h) => (h.role === 'user' ? moneyIn(h.text) : []))]
    for (const budget of [filters.maxBudget, previous?.maxBudget]) if (budget) allowedMoney.push(budget)
    const grounded = ground(reply, mode === 'answer' ? picks : [], ctx, allowedMoney)
    return json({ parsed: filters, mode, picks: grounded.picks, reply: grounded.reply, suggestions: cleanSuggestions(suggestions) })
  } catch (error) {
    console.error(`ai-search failed: ${error instanceof Error ? error.name : 'unknown error'}`)
    return json({ error: 'AI sedang tidak tersedia.' }, 502)
  }
}

export const config = { path: '/api/ai-search' }
