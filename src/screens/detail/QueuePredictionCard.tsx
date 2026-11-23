import { Info } from 'lucide-react'
import { Card, QueueChart, Tag } from '../../components'
import type { Place } from '../../state/types'
import { DAY_NAMES, hhmm, useNow } from '../../lib/clock'
import { bestTimeText, hourlyCrowd, placeCrowd } from '../../lib/crowdModel'
import { crowdShortLabel, crowdTextClass } from '../../lib/crowd'
import { cx } from '../../lib/cx'

/** Bolds the first time range in "Waktu terbaik datang: 09.20–10.50". */
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

interface QueuePredictionCardProps {
  place: Place
}

/** "Prediksi Keramaian" card: crowd level now (from the class schedule), hourly chart, best time. */
export function QueuePredictionCard({ place }: QueuePredictionCardProps) {
  const now = useNow()
  const crowd = placeCrowd(place, now.day, now.minute)
  const nowHour = Math.floor(now.minute / 60)

  return (
    <Card as="section" padding="none" className="p-3.5" ariaLabel="Prediksi keramaian">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] leading-[19px] font-bold text-ink">Prediksi Keramaian</h2>
        <Tag tone="gray">
          {DAY_NAMES[now.day]} {hhmm(now.minute)}
          {now.simulated ? ' · simulasi' : ''}
        </Tag>
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[12.5px] leading-[15px] text-muted">Keramaian sekarang</p>
          <p
            className={cx(
              'mt-0.5 text-[24px] leading-[28px] font-extrabold tracking-[-0.01em]',
              crowd.closed ? 'text-muted' : crowdTextClass(crowd.level),
            )}
          >
            {crowd.closed ? 'Tutup' : crowdShortLabel(crowd.level)}
          </p>
        </div>
        {!crowd.closed && (
          <p className="text-right text-[12.5px] leading-[15px] text-muted">±{Math.round(crowd.share * 100)}% kapasitas terisi</p>
        )}
      </div>
      <QueueChart data={hourlyCrowd(place, now.day)} nowHour={nowHour} className="mt-2.5" />
      <p className="mt-2.5 rounded-xl bg-soft/80 px-2.5 py-2 text-[12.5px] leading-[15px] text-ink/85">
        <BestTime text={bestTimeText(place, now.day)} />
      </p>
      <p className="mt-2 flex gap-1.5 text-[11.5px] leading-[15px] text-muted">
        <Info size={13} className="mt-px shrink-0" aria-hidden />
        Perkiraan dari jadwal sesi kelas BINUS: ramai di setiap jeda (xx.00–xx.20) dan jam makan siang, sepi di sore hari.
      </p>
    </Card>
  )
}
