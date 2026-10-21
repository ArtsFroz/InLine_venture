import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CrowdLevel, HourlyCrowd } from '../state/types'
import { crowdLevelFromValue } from '../lib/crowd'
import { cx } from '../lib/cx'

interface QueueChartProps {
  data: HourlyCrowd[]
  /** Hour drawn solid dark green and labelled "sekarang". */
  nowHour: number
  /** Bar area height in px (default 70, as in Figma). */
  height?: number
  className?: string
}

interface AxisLabel {
  index: number
  text: string
  priority: number
}

const BAR_GAP = 4
const MIN_BAR_RATIO = 0.12
const CHAR_WIDTH_PX = 5.4
const LABEL_GAP_PX = 6
const DEFAULT_WIDTH = 320

const BAR_CLASS: Record<CrowdLevel, string> = {
  Rendah: 'bg-bar-low',
  Sedang: 'bg-bar-mid',
  Tinggi: 'bg-bar-high',
}

const LEVEL_WORD: Record<CrowdLevel, string> = {
  Rendah: 'sepi',
  Sedang: 'sedang',
  Tinggi: 'ramai',
}

function hh(hour: number): string {
  return String(hour).padStart(2, '0')
}

function peakIndex(data: HourlyCrowd[]): number {
  return data.reduce((best, d, i) => (d.level > data[best].level ? i : best), 0)
}

/** Candidate axis labels; lower priority number wins when labels would overlap. */
function candidateLabels(data: HourlyCrowd[], nowIndex: number, peak: number): AxisLabel[] {
  const last = data.length - 1
  const list: AxisLabel[] = []
  if (nowIndex >= 0) list.push({ index: nowIndex, text: 'sekarang', priority: 0 })
  if (peak !== nowIndex) list.push({ index: peak, text: `${hh(data[peak].hour)} (ramai)`, priority: 1 })
  list.push({ index: 0, text: hh(data[0].hour), priority: 2 })
  list.push({ index: last, text: hh(data[last].hour), priority: 3 })
  for (const hour of [10, 18]) {
    const index = data.findIndex((d) => d.hour === hour)
    if (index >= 0) list.push({ index, text: hh(hour), priority: 4 })
  }
  return list
}

interface Placed extends AxisLabel {
  left: number
  align: 'start' | 'center' | 'end'
}

/** Greedy, priority-ordered placement that skips any label that would collide. */
function placeLabels(labels: AxisLabel[], count: number, width: number): Placed[] {
  const barWidth = (width - (count - 1) * BAR_GAP) / count
  const taken: Array<[number, number]> = []
  const placed: Placed[] = []
  const seen = new Set<number>()

  for (const label of [...labels].sort((a, b) => a.priority - b.priority)) {
    if (seen.has(label.index)) continue
    const w = label.text.length * CHAR_WIDTH_PX
    const center = label.index * (barWidth + BAR_GAP) + barWidth / 2
    let start = center - w / 2
    let align: Placed['align'] = 'center'
    if (start < 0) {
      start = 0
      align = 'start'
    } else if (start + w > width) {
      start = width - w
      align = 'end'
    }
    const end = start + w
    const collides = taken.some(([s, e]) => start < e + LABEL_GAP_PX && end > s - LABEL_GAP_PX)
    if (collides) continue
    taken.push([start, end])
    seen.add(label.index)
    placed.push({ ...label, left: align === 'start' ? 0 : align === 'end' ? width : center, align })
  }
  return placed
}

/** Hourly crowd bar chart (03-detail). Pure divs; bars grow in with scaleY. */
export function QueueChart({ data, nowHour, height = 70, className }: QueueChartProps) {
  const axisRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const hasData = data.length > 0

  useLayoutEffect(() => {
    const el = axisRef.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth || DEFAULT_WIDTH)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasData])

  const nowIndex = data.findIndex((d) => d.hour === nowHour)
  const peak = data.length > 0 ? peakIndex(data) : -1

  const labels = useMemo(
    () => (data.length > 0 ? placeLabels(candidateLabels(data, nowIndex, peak), data.length, width) : []),
    [data, nowIndex, peak, width],
  )

  if (data.length === 0) return null

  const nowLevel = nowIndex >= 0 ? crowdLevelFromValue(data[nowIndex].level) : null
  const summary =
    `Grafik keramaian per jam, pukul ${hh(data[0].hour)}.00 sampai ${hh(data[data.length - 1].hour)}.00. ` +
    `Paling ramai pukul ${hh(data[peak].hour)}.00.` +
    (nowLevel ? ` Sekarang pukul ${hh(nowHour)}.00: ${LEVEL_WORD[nowLevel]}.` : '')

  return (
    <div role="img" aria-label={summary} className={cx('w-full', className)}>
      <div aria-hidden className="flex items-end" style={{ height, gap: BAR_GAP }}>
        {data.map((d, i) => {
          const isNow = i === nowIndex
          const ratio = Math.min(1, Math.max(MIN_BAR_RATIO, d.level))
          return (
            <div
              key={d.hour}
              className={cx(
                'flex-1 origin-bottom animate-bar-grow rounded-[5px]',
                isNow ? 'bg-primary' : BAR_CLASS[crowdLevelFromValue(d.level)],
              )}
              style={{ height: `${ratio * 100}%`, animationDelay: `${i * 35}ms` }}
            />
          )
        })}
      </div>
      <div ref={axisRef} aria-hidden className="relative mt-2.5 h-[14px] text-[11px] leading-[14px] text-muted">
        {labels.map((l) => (
          <span
            key={l.index}
            className={cx(
              'absolute top-0 whitespace-nowrap',
              l.align === 'center' && '-translate-x-1/2',
              l.align === 'end' && '-translate-x-full',
              l.text === 'sekarang' && 'font-semibold text-primary-dark',
            )}
            style={{ left: l.left }}
          >
            {l.text}
          </span>
        ))}
      </div>
    </div>
  )
}
