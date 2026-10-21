import { Card, QueueChart, Tag } from '../../components'
import type { Place } from '../../state/types'
import { crowdTextClass } from '../../lib/crowd'
import { cx } from '../../lib/cx'

/** Bolds the first time range in "Waktu terbaik datang: 07.00–10.00 atau setelah 20.00". */
function BestTime({ text }: { text: string }) {
  const match = /\d{2}\.\d{2}–\d{2}\.\d{2}/.exec(text)
  if (!match) return <>{text}</>
  const start = match.index
  const end = start + match[0].length
  return (
    <>
      {text.slice(0, start)}
      <strong className="font-bold text-ink">{match[0]}</strong>
      {text.slice(end)}
    </>
  )
}

interface StatProps {
  label: string
  value: string
  valueClass?: string
}

function Stat({ label, value, valueClass }: StatProps) {
  return (
    <div className="flex min-w-0 flex-col justify-end">
      <dt className="text-[12.5px] leading-[15px] text-muted">{label}</dt>
      <dd className={cx('mt-0.5 truncate text-[21px] leading-[25px] font-extrabold tracking-[-0.01em]', valueClass ?? 'text-ink')}>
        {value}
      </dd>
    </div>
  )
}

interface QueuePredictionCardProps {
  place: Place
}

/** "Prediksi Antrean AI" card: Live pill, 3 stats, hourly chart, best-time box (03-detail). */
export function QueuePredictionCard({ place }: QueuePredictionCardProps) {
  return (
    <Card as="section" padding="none" className="p-3.5" ariaLabel="Prediksi Antrean AI">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] leading-[19px] font-bold text-ink">Prediksi Antrean AI</h2>
        <Tag tone="green">Live</Tag>
      </div>
      <dl className="mt-2.5 grid grid-cols-3 gap-2">
        <Stat label="Estimasi tunggu" value={place.isOpen ? `${place.waitMin} mnt` : '–'} />
        <Stat label="Keramaian" value={place.crowd} valueClass={crowdTextClass(place.crowd)} />
        <Stat label="Antrean" value={`${place.queueCount} org`} />
      </dl>
      <QueueChart data={place.hourly} nowHour={place.nowHour} className="mt-2.5" />
      <p className="mt-2.5 rounded-xl bg-soft/80 px-2.5 py-2 text-[12.5px] leading-[15px] text-ink/85">
        <BestTime text={place.bestTime} />
      </p>
    </Card>
  )
}
