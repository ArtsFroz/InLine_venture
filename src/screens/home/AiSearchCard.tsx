import { useId, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { BRAND_GRADIENT_CLASS } from '../parts/ui'

/** Placeholder = the demo query; an empty submit searches for it so the presenter can just tap send. */
export const AI_PLACEHOLDER = 'Kopi susu dekat Anggrek, antre singkat, budget 25 ribu.'

interface AiSearchCardProps {
  onSubmit: (query: string) => void
}

/** Dark-green "AI Rekomendasi" chat card with the natural-language composer (01-home). */
export function AiSearchCard({ onSubmit }: AiSearchCardProps) {
  const [text, setText] = useState('')
  const inputId = useId()

  const submit = () => onSubmit(text.trim() || AI_PLACEHOLDER)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    submit()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <section
      aria-labelledby={`${inputId}-title`}
      className={`relative isolate overflow-hidden rounded-card ${BRAND_GRADIENT_CLASS} p-[18px] text-white shadow-[0_16px_32px_rgba(15,94,44,0.28)]`}
    >
      <div
        aria-hidden
        className="absolute -top-16 -right-10 -z-10 size-48 rounded-full bg-[radial-gradient(circle,rgba(74,222,128,0.18),transparent_70%)]"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${inputId}-title`} className="text-[19px] leading-[23px] font-extrabold tracking-[-0.01em]">
            AI Rekomendasi
          </h2>
          <p className="mt-0.5 text-[12px] leading-[15px] text-white/75">Tanya tempat, AI jawab rekomendasi</p>
        </div>
        <span className="mt-1.5 inline-flex h-[27px] shrink-0 items-center rounded-full bg-white/15 px-2.5 text-[12px] font-semibold">
          Siap
        </span>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span
          aria-hidden
          className="mb-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-[12px] font-extrabold text-primary-dark"
        >
          AI
        </span>
        <div className="max-w-[246px] flex-1 rounded-[16px] rounded-bl-[6px] bg-surface px-3 py-3 text-ink">
          <p className="text-[13px] leading-4 font-bold">AI</p>
          <p className="mt-2 text-[14px] leading-[18px]">Siap membantu kamu</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 rounded-[16px] bg-surface py-3 pr-3 pl-3">
        <label htmlFor={inputId} className="sr-only">
          Tanya AI tempat yang kamu cari
        </label>
        <textarea
          id={inputId}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={AI_PLACEHOLDER}
          enterKeyHint="send"
          className="no-scrollbar h-11 min-w-0 flex-1 resize-none py-1 bg-transparent text-[16px] leading-[18px] text-ink placeholder:text-[14px] placeholder:text-muted/80 focus:outline-none sm:text-[14px]"
        />
        <button
          type="submit"
          aria-label="Kirim ke AI"
          className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-accent text-primary-dark transition-[transform,background-color] duration-150 ease-out hover:bg-[#5ce58f] active:scale-[0.94] focus-visible:ring-[3px] focus-visible:ring-primary/45 focus-visible:outline-none"
        >
          <Send size={20} strokeWidth={2.2} aria-hidden />
        </button>
      </form>
    </section>
  )
}
