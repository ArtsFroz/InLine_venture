import { Check } from 'lucide-react'
import { Card } from '../../components'
import type { ActiveQueue, Place } from '../../state/types'
import { cx } from '../../lib/cx'

/** Walking speed used for "jalan kaki ±N menit" (≈ 4.5 km/h). */
const WALK_M_PER_MIN = 75
/** Positions shown "behind" the user in the progress bar, so 3 ahead ≈ 2/3 done (as in Figma). */
const PROGRESS_TAIL = 6

function walkMinutes(place: Place | undefined): number {
  return place ? Math.max(1, Math.round(place.distanceM / WALK_M_PER_MIN)) : 4
}

function progressRatio(queue: ActiveQueue): number {
  const ratio = 1 - queue.ahead / (queue.ahead + PROGRESS_TAIL)
  return Math.min(0.95, Math.max(0.08, ratio))
}

export function QueueSuccessBanner() {
  return (
    <div className="flex min-h-[68px] items-center gap-3 rounded-tile bg-primary-light px-3.5 py-3">
      <span aria-hidden className="flex size-10 shrink-0 animate-pop items-center justify-center rounded-full bg-primary text-white">
        <Check size={20} strokeWidth={2.6} />
      </span>
      <div className="min-w-0">
        <p className="text-[14.5px] leading-[18px] font-bold text-primary-dark">Antrean berhasil diambil</p>
        <p className="mt-0.5 text-[12.5px] leading-[15px] text-primary-dark/85">Kami kabari saat giliranmu sudah dekat.</p>
      </div>
    </div>
  )
}

interface QueueNumberCardProps {
  queue: ActiveQueue
  place: Place | undefined
}

/** "Nomor antreanmu" card: huge number, serving / ETA / ahead stats, progress, AI advice (04). */
export function QueueNumberCard({ queue, place }: QueueNumberCardProps) {
  const stats: ReadonlyArray<readonly [string, string]> = [
    ['Sedang dilayani', queue.serving],
    ['Estimasi AI', `±${queue.etaMin} mnt`],
    ['Di depanmu', `${queue.ahead} org`],
  ]
  return (
    <Card padding="none" className="p-[18px]">
      <p className="text-[12.5px] leading-[15px] text-muted">Nomor antreanmu · {place?.name ?? 'Tempat'}</p>
      <p className="mt-3.5 text-[72px] leading-[81px] font-extrabold tracking-[-0.03em] text-ink tabular-nums">{queue.number}</p>
      <div aria-hidden className="mt-3.5 h-px bg-line" />
      <dl className="mt-4 grid grid-cols-3 gap-x-2">
        {stats.map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col justify-end">
            <dt className="text-[12px] leading-[15px] text-muted">{label}</dt>
            <dd className="mt-0.5 text-[18px] leading-[23px] font-extrabold whitespace-nowrap text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <div
        role="progressbar"
        aria-label="Progres antrean"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressRatio(queue) * 100)}
        className="mt-3.5 h-2 overflow-hidden rounded-full bg-[#e2e7e3]"
      >
        <div
          className="h-full origin-left rounded-full bg-primary transition-transform duration-500 ease-out"
          style={{ transform: `scaleX(${progressRatio(queue)})` }}
        />
      </div>
      <p className="mt-3.5 text-[12.5px] leading-[15px] text-ink/80">
        Saran AI: berangkat sekarang, jalan kaki ±{walkMinutes(place)} menit.
      </p>
    </Card>
  )
}

interface TimelineRowProps {
  label: string
  time: string
  tone: 'done' | 'current' | 'todo'
}

function TimelineRow({ label, time, tone }: TimelineRowProps) {
  const toneClass = {
    done: 'font-bold text-ink',
    current: 'font-bold text-primary',
    todo: 'font-normal text-muted',
  }[tone]
  return (
    <li className={cx('flex items-baseline justify-between gap-3 text-[14px] leading-4', toneClass)}>
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 tabular-nums">{time}</span>
    </li>
  )
}

/** Three-row timeline: created → serving → your turn (04). */
export function QueueTimelineCard({ queue }: { queue: ActiveQueue }) {
  return (
    <Card padding="none" className="px-3.5 py-3.5">
      <ol aria-label="Linimasa antrean" className="flex flex-col gap-3">
        <TimelineRow label="Antrean dibuat" time={queue.createdAt} tone="done" />
        <TimelineRow label={`Sedang diproses · ${queue.serving}`} time={queue.servingAt} tone="current" />
        <TimelineRow label="Giliranmu" time={`±${queue.turnAt}`} tone="todo" />
      </ol>
    </Card>
  )
}
