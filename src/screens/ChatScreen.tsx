import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RotateCcw, Send } from 'lucide-react'
import { CrowdBadge, Header, IconButton, PlaceImage, Screen, Tag } from '../components'
import { getPlace } from '../data/places'
import { fetchAiChat, type AiChatTurn, type AiMode } from '../lib/aiClient'
import { chatContext } from '../lib/aiContext'
import { describeParsed, searchPlaces, type ParsedQuery } from '../lib/aiSearch'
import { fallbackReply, mergeFollowUp } from '../lib/chatFallback'
import { cx } from '../lib/cx'
import { ROUTES } from '../routes'
import type { Place } from '../state/types'
import { crowdShortLabel } from '../lib/crowd'
import { getNow, hhmm } from '../lib/clock'
import { opensAtMinute, placeCrowd } from '../lib/crowdModel'
import { areaDistance, crowdDetail } from './parts/placeText'
import { usePlaceCrowd } from './parts/usePlaceCrowd'

const MAX_CARDS = 3
const MAX_MESSAGE_CHARS = 200
const STORAGE_KEY = 'inline-ai-chat'
const HISTORY_TURNS = 6
const HISTORY_CHARS = 320
const OFFTOPIC_TEXT = 'Aku cuma bisa bantu cari tempat makan dan minum di sekitar kampus. Lagi laper atau pengin ngopi?'
const QUICK_REPLIES = ['Yang paling sepi', 'Yang lebih murah', 'Dekat Anggrek aja', 'Yang ada colokan', 'Buka sekarang']
const STARTERS = ['Laper, kelas 30 menit lagi, budget 20 ribu', 'Kopi enak buat nugas yang tenang', 'Jajan murah dekat Syahdan']

interface UserMessage {
  role: 'user'
  text: string
}

interface AiMessage {
  role: 'ai'
  text: string
  /** Filters this answer used (carried into the next message). Absent for off-topic answers. */
  parsed?: ParsedQuery
  placeIds: string[]
  total: number
  relaxed: boolean
  usedAi: boolean
  /** 'ask': the AI asked a question back, so no cards. Absent in chats saved before v1.1. */
  mode?: AiMode
  /** Follow-up chips the AI proposed; the fixed quick replies are used when empty. */
  suggestions?: string[]
  /** Matches not shown as cards. */
  more?: number
  /** false when the AI's own sentence already names the cards (checked against our data). */
  summary?: boolean
}

type Message = UserMessage | AiMessage

function loadMessages(): Message[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    const value: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(value) ? (value as Message[]) : []
  } catch {
    return []
  }
}

function lastFilters(messages: readonly Message[]): ParsedQuery | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i]
    if (m.role === 'ai' && m.parsed) return m.parsed
  }
  return null
}

/** Results put closed places last, so a closed first card means every match is closed right now. */
function firstIsClosed(placeIds: string[]): boolean {
  const first = getPlace(placeIds[0] ?? '')
  const now = getNow()
  return !first || placeCrowd(first, now.day, now.minute).closed
}

function moreCount(m: AiMessage): number {
  return m.more ?? m.total - m.placeIds.length
}

/** The answer under the AI's sentence comes from our own data, never from the model. */
function groundedSummary(placeIds: string[], total: number, relaxed: boolean): string {
  const now = getNow()
  const places = placeIds.map(getPlace).filter((p): p is Place => p !== undefined)
  if (places.length === 0) return 'Belum ada tempat yang cocok.'
  // Results put closed places last, so a closed first card means every match is closed right now.
  const first = places[0]
  const crowd = placeCrowd(first, now.day, now.minute)
  if (crowd.closed) {
    const opens = Math.min(...places.map(opensAtMinute))
    return `Semua tempat yang cocok sedang tutup sekarang (pukul ${hhmm(now.minute)}). Paling cepat buka lagi pukul ${hhmm(opens)}.`
  }
  const lead = relaxed ? 'Belum ada yang cocok persis, ini alternatif terdekat.' : `Ketemu ${total} tempat.`
  return `${lead} Paling lega sekarang: ${first.name} (${crowdShortLabel(crowd.level).toLowerCase()}).`
}

/** AI Rekomendasi as a chat: each message refines the search; results are real places from our data. */
export function ChatScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)))
    } catch {
      // Storage blocked: the chat lasts until the screen closes.
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, MAX_MESSAGE_CHARS)
    if (!text || busy) return
    const history: AiChatTurn[] = messages
      .slice(-HISTORY_TURNS)
      .map((m) => ({ role: m.role, text: m.text.slice(0, HISTORY_CHARS) }))
    const previous = lastFilters(messages)
    const lastAi = [...messages].reverse().find((m): m is AiMessage => m.role === 'ai')
    setMessages((prev) => [...prev, { role: 'user', text }])
    setDraft('')
    setBusy(true)

    const ai = await fetchAiChat(text, previous, history, chatContext(getNow()))
    let answer: AiMessage
    if (ai?.mode === 'offtopic') {
      answer = { role: 'ai', text: ai.reply ?? OFFTOPIC_TEXT, placeIds: [], total: 0, relaxed: false, usedAi: true, suggestions: ai.suggestions }
      if (previous) answer.parsed = previous
    } else if (ai?.mode === 'ask' && ai.reply && lastAi?.mode !== 'ask') {
      // Too vague to search: one question back, answered with the AI's chips. Never twice in a row.
      answer = { role: 'ai', text: ai.reply, parsed: ai.parsed, placeIds: [], total: 0, relaxed: false, usedAi: true, mode: 'ask', suggestions: ai.suggestions }
    } else {
      const parsed = ai?.parsed ?? mergeFollowUp(previous, text)
      const { results, relaxed } = searchPlaces(parsed, 'sepi')
      const aiReply = ai?.mode === 'answer' ? ai.reply : null
      const picks = aiReply ? (ai?.picks ?? []).filter((id) => getPlace(id) !== undefined) : []
      const placeIds = picks.length > 0 ? picks : results.slice(0, MAX_CARDS).map((p) => p.id)
      answer = {
        role: 'ai',
        text: aiReply ?? fallbackReply(parsed),
        parsed,
        placeIds,
        total: results.length,
        more: results.filter((p) => !placeIds.includes(p.id)).length,
        relaxed,
        usedAi: ai !== null,
        mode: 'answer',
        suggestions: ai?.suggestions,
        summary: picks.length === 0,
      }
    }
    setMessages((prev) => [...prev, answer])
    setBusy(false)
  }

  // A question typed on Home arrives as ?q=…; send it once, then drop it from the URL.
  useEffect(() => {
    const q = params.get('q')
    if (!q || startedRef.current) return
    startedRef.current = true
    navigate(ROUTES.chat, { replace: true })
    void send(q)
    // Runs once on mount: later changes to params come from our own replace above.
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void send(draft)
  }

  const last = messages[messages.length - 1]
  const lastIsAi = last?.role === 'ai'
  const quickReplies = last?.role === 'ai' && last.suggestions && last.suggestions.length > 0 ? last.suggestions : QUICK_REPLIES

  const composer = (
    <form onSubmit={submit} className="flex items-center gap-2">
      <label htmlFor="chat-input" className="sr-only">
        Tulis pesan untuk AI
      </label>
      <input
        id="chat-input"
        value={draft}
        maxLength={MAX_MESSAGE_CHARS}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Tanya tempat makan atau minum…"
        autoComplete="off"
        enterKeyHint="send"
        className="h-12 min-w-0 flex-1 rounded-[14px] border border-line bg-surface px-3.5 text-[15px] text-ink focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Kirim"
        disabled={busy || !draft.trim()}
        className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white shadow-cta transition-transform active:scale-95 disabled:opacity-50 disabled:shadow-none focus-visible:ring-[3px] focus-visible:ring-primary/45 focus-visible:outline-none"
      >
        <Send size={20} strokeWidth={2.2} aria-hidden />
      </button>
    </form>
  )

  return (
    <Screen footer={composer} footerStyle="bar">
      <Header
        title="AI Rekomendasi"
        subtitle="Tanya tempat makan & minum di sekitar BINUS"
        right={
          messages.length > 0 ? (
            <IconButton
              icon={<RotateCcw size={19} aria-hidden />}
              label="Mulai percakapan baru"
              onClick={() => setMessages([])}
              disabled={busy}
            />
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3" aria-live="polite">
        <AiBubble>
          <p>Halo! Mau makan, ngopi, atau jajan di mana? Ceritain aja kebutuhanmu, nanti aku carikan tempatnya.</p>
          {messages.length === 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {STARTERS.map((s) => (
                <SuggestionButton key={s} label={s} onClick={() => void send(s)} />
              ))}
            </div>
          )}
        </AiBubble>

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <p
              key={i}
              className="animate-screen-in max-w-[80%] self-end rounded-[16px] rounded-br-[6px] bg-primary px-3.5 py-2.5 text-[14.5px] leading-[19px] text-white"
            >
              {m.text}
            </p>
          ) : (
            <AiBubble key={i}>
              <p>{m.text}</p>
              {m.parsed && m.mode !== 'ask' && m.total > 0 && (
                <>
                  {m.placeIds.length > 0 && (
                    <>
                      {m.summary !== false && (
                        <p className="mt-2 text-[13px] text-ink/80">{groundedSummary(m.placeIds, m.total, m.relaxed)}</p>
                      )}
                      <ul className="mt-2.5 flex flex-col gap-2">
                        {m.placeIds.map((id) => {
                          const place = getPlace(id)
                          return place ? (
                            <li key={id}>
                              <PlaceRow place={place} />
                            </li>
                          ) : null
                        })}
                      </ul>
                      {moreCount(m) > 0 && !firstIsClosed(m.placeIds) && (
                        <p className="mt-2 text-[12px] text-muted">+{moreCount(m)} tempat lain yang juga cocok</p>
                      )}
                    </>
                  )}
                  <p className="mt-2.5 text-[11.5px] leading-[15px] text-muted">
                    {m.usedAi ? 'Dipahami AI' : 'Mode kata kunci (AI tidak tersedia)'}: {describeParsed(m.parsed)}
                  </p>
                </>
              )}
            </AiBubble>
          ),
        )}

        {busy && (
          <AiBubble>
            <span className="flex gap-1 py-1" role="status" aria-label="AI sedang mengetik">
              {[0, 1, 2].map((d) => (
                <span key={d} className="size-2 animate-pulse rounded-full bg-primary/60" style={{ animationDelay: `${d * 150}ms` }} />
              ))}
            </span>
          </AiBubble>
        )}

        {lastIsAi && !busy && (
          <div className="flex flex-wrap gap-2 pl-10" aria-label="Balasan cepat">
            {quickReplies.map((q) => (
              <SuggestionButton key={q} label={q} compact onClick={() => void send(q)} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </Screen>
  )
}

function AiBubble({ children }: { children: ReactNode }) {
  return (
    <div className="animate-screen-in flex items-start gap-2">
      <span
        aria-hidden
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-dark text-[11.5px] font-extrabold text-accent"
      >
        AI
      </span>
      <div className="min-w-0 max-w-[86%] flex-1 rounded-[16px] rounded-tl-[6px] bg-surface px-3.5 py-3 text-[14.5px] leading-[19px] text-ink shadow-soft">
        {children}
      </div>
    </div>
  )
}

function SuggestionButton({ label, onClick, compact = false }: { label: string; onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-full border border-primary/30 bg-primary-light font-semibold text-primary-dark transition-colors hover:bg-[#d6ecdf] active:scale-[0.97] focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:outline-none',
        compact ? 'h-9 px-3 text-[12.5px]' : 'min-h-10 rounded-[12px] px-3 py-2 text-left text-[13px]',
      )}
    >
      {label}
    </button>
  )
}

function PlaceRow({ place }: { place: Place }) {
  const crowd = usePlaceCrowd(place)
  return (
    <Link
      to={ROUTES.place(place.id)}
      className="flex items-center gap-2.5 rounded-[12px] border border-line p-2 transition-colors hover:bg-soft focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:outline-none"
    >
      <span className="block size-12 shrink-0">
        <PlaceImage category={place.category} alt="" width={48} height={48} fill rounded="rounded-[10px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold">{place.name}</span>
        <span className="block truncate text-[12px] text-muted">
          {areaDistance(place)}
        </span>
      </span>
      {crowd.closed ? <Tag tone="gray">Tutup</Tag> : <CrowdBadge level={crowd.level} detail={crowdDetail(crowd)} />}
    </Link>
  )
}
