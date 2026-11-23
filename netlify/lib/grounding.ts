// Keeps the AI chat honest: the model may only talk about places it picked from the table the app
// sent, and only quote prices that are in that table (or that the user said). Anything else is
// dropped and the app shows its own data-based summary instead.
import { z } from 'zod'

const CAMPUS = z.enum(['Anggrek', 'Syahdan', 'Kijang', 'Binus Square'])
const CATEGORY = z.enum(['Kopi', 'Kantin', 'Minuman', 'Snack'])
const text = (max: number) => z.string().max(max).transform((s) => s.replace(/[\r\n|]+/g, ' ').trim())
const rupiah = z.number().int().min(0).max(1_000_000)

/** One place as the app sees it right now (status and crowd come from the app's clock and model). */
export const PlaceRowSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,60}$/),
  name: text(60),
  category: CATEGORY,
  campus: CAMPUS,
  distanceM: z.number().int().min(0).max(20_000),
  area: text(20),
  hours: text(20),
  status: z.enum(['Sepi', 'Sedang', 'Ramai', 'Penuh', 'Tutup']),
  priceMin: rupiah,
  priceMax: rupiah,
  facilities: z.array(text(30)).max(10),
  menu: z.array(z.tuple([text(40), rupiah])).max(10),
})
export type PlaceRow = z.infer<typeof PlaceRowSchema>

export const ContextSchema = z.object({
  now: text(30),
  places: z.array(PlaceRowSchema).max(80),
})
export type ChatContext = z.infer<typeof ContextSchema>

/** The table as compact lines for the prompt (cheaper than JSON on the free tier). */
export function contextLines(ctx: ChatContext): string {
  const rows = ctx.places.map((p) =>
    [
      p.id,
      p.name,
      p.category,
      p.campus,
      p.area,
      `${p.distanceM} m`,
      `jam ${p.hours}`,
      p.status,
      `Rp${p.priceMin}–${p.priceMax}`,
      p.facilities.join(', ') || '-',
      p.menu.map(([name, price]) => `${name} ${price}`).join('; '),
    ].join(' | '),
  )
  return [`Waktu sekarang: ${ctx.now}`, 'Tempat (id | nama | kategori | kampus | area | jarak | jam buka | status sekarang | harga | fasilitas | menu harga):', ...rows].join('\n')
}

/** Rupiah amounts written in a text: "Rp20.000", "20 ribu", "18rb", "25k", "50.000". */
export function moneyIn(s: string): number[] {
  const out: number[] = []
  for (const m of s.matchAll(/(rp\.?\s?)?(\d[\d.,]*)\s?(rb|ribu|k)?(?!\w)/gi)) {
    const [, prefix, digits, suffix] = m
    const thousands = /^\d{1,3}([.,]\d{3})+$/.test(digits)
    if (!prefix && !suffix && !thousands) continue
    let value = Number(digits.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.'))
    if (suffix) value *= 1000
    if (Number.isFinite(value)) out.push(Math.round(value))
  }
  return out
}

export interface Grounded {
  picks: string[]
  /** null when the reply named a place or price that is not backed by the table. */
  reply: string | null
}

const MAX_PICKS = 3
const MAX_REPLY_CHARS = 320

/**
 * Keeps picks that exist in the table, and the reply only if every place it names is a pick and
 * every price it quotes belongs to a pick, the budget, or the user's own words.
 */
export function ground(
  reply: string,
  picks: readonly string[],
  ctx: ChatContext | null,
  allowedMoney: readonly number[],
): Grounded {
  const table = new Map((ctx?.places ?? []).map((p) => [p.id, p]))
  const kept = [...new Set(picks)].filter((id) => table.has(id)).slice(0, MAX_PICKS)
  const clean = reply.replace(/\s+/g, ' ').trim()
  if (!clean || clean.length > MAX_REPLY_CHARS) return { picks: kept, reply: null }

  const lower = clean.toLowerCase()
  const namesOther = [...table.values()].some((p) => !kept.includes(p.id) && lower.includes(p.name.toLowerCase()))
  if (namesOther) return { picks: kept, reply: null }

  const allowed = new Set(allowedMoney)
  for (const id of kept) {
    const p = table.get(id)!
    allowed.add(p.priceMin)
    allowed.add(p.priceMax)
    for (const [, price] of p.menu) allowed.add(price)
  }
  if (moneyIn(clean).some((amount) => !allowed.has(amount))) return { picks: kept, reply: null }
  return { picks: kept, reply: clean }
}

/** 0–3 short follow-up chips, in the user's voice. */
export function cleanSuggestions(list: readonly string[]): string[] {
  return [...new Set(list.map((s) => s.replace(/\s+/g, ' ').trim()))]
    .filter((s) => s.length >= 2 && s.length <= 32)
    .slice(0, 3)
}
