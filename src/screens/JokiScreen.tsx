import { useId, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, CostSummary, Header, InfoNote, Screen } from '../components'
import { DEFAULT_MEETING_POINT } from '../data/campus'
import { buildFees } from '../data/pricing'
import { useAppState, usePlace } from '../state/AppState'
import type { Place } from '../state/types'
import { ROUTES } from '../routes'
import { ModeOption } from './order/ModeOption'
import { opensAt } from './parts/placeText'
import { INPUT_CLASS, LABEL_CLASS, NotFoundScreen } from './parts/ui'

const JOKI_FEES = buildFees('joki')

function defaultMeetingPoint(place: Place): string {
  return place.campus === 'Anggrek' ? DEFAULT_MEETING_POINT : `${place.campus}, lobby lt. 1`
}

/** 5 · Joki Antre: a NIM-verified buddy queues for you; you come when it is your turn. */
export function JokiScreen() {
  const { placeId } = useParams()
  const place = usePlace(placeId)
  if (!place) {
    return <NotFoundScreen title="InLine Joki" message="Tempat untuk Joki Antre tidak ditemukan. Pilih tempat dari Home." />
  }
  return <JokiForm key={place.id} place={place} />
}

function JokiForm({ place }: { place: Place }) {
  const navigate = useNavigate()
  const { state, actions } = useAppState()
  const [meetingPoint, setMeetingPoint] = useState(() => defaultMeetingPoint(place))
  const inputId = useId()

  const queueHere = state.activeQueue?.placeId === place.id ? state.activeQueue : null
  const canOrder = place.isOpen && meetingPoint.trim().length > 0

  const order = () => {
    if (!canOrder) return
    // No active queue here: the queue number is taken when the order is paid (payOrder).
    const created = actions.createOrder({
      type: 'joki',
      placeId: place.id,
      meetingPoint: meetingPoint.trim(),
      queueNumber: queueHere?.number,
    })
    navigate(ROUTES.pay(created.id))
  }

  const footer = (
    <Button fullWidth disabled={!canOrder} onClick={order}>
      Pesan Joki
    </Button>
  )

  return (
    <Screen footer={footer}>
      <Header title="InLine Joki" subtitle="Khusus area kampus BINUS" />

      <div role="group" aria-label="Pilih layanan" className="grid grid-cols-2 gap-2.5">
        <ModeOption
          title="Joki Antre"
          description="Buddy antre untukmu, kamu datang saat giliran."
          selected
          onClick={() => undefined}
        />
        <ModeOption
          title="Antar ke Kampus"
          description="Makanan diantar ke kelas / Binus Square."
          selected={false}
          onClick={() => navigate(ROUTES.titip(place.id), { replace: true })}
        />
      </div>

      <Card padding="none" className="mt-3.5 p-3.5">
        <p className={LABEL_CLASS}>Tempat</p>
        <p className="mt-2.5 text-[16px] leading-[19px] font-bold text-ink">
          {place.name} · {queueHere ? `antrean ${queueHere.number}` : 'antrean baru (dibuat saat bayar)'}
        </p>
        <label htmlFor={inputId} className={`mt-2.5 block ${LABEL_CLASS}`}>
          Titik temu / catatan
        </label>
        <input
          id={inputId}
          type="text"
          value={meetingPoint}
          onChange={(e) => setMeetingPoint(e.target.value)}
          placeholder="Contoh: Anggrek, lobby lt. 1"
          autoComplete="off"
          enterKeyHint="done"
          aria-invalid={meetingPoint.trim().length === 0}
          className={`mt-2.5 ${INPUT_CLASS}`}
        />
        {meetingPoint.trim().length === 0 && (
          <p className="mt-1.5 text-[12px] text-danger-dark">Isi titik temu supaya buddy bisa menemuimu.</p>
        )}
      </Card>

      {place.isOpen ? (
        <InfoNote className="mt-3.5">Buddy terverifikasi NIM akan dicarikan otomatis setelah kamu pesan.</InfoNote>
      ) : (
        <InfoNote tone="amber" className="mt-3.5">
          {place.name} sedang tutup. Joki Antre bisa dipesan mulai {opensAt(place)}.
        </InfoNote>
      )}

      <CostSummary lines={JOKI_FEES.fees} total={JOKI_FEES.total} className="mt-3.5" />
    </Screen>
  )
}
