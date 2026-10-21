import { Check } from 'lucide-react'
import { cx } from '../lib/cx'

interface StepTrackerProps {
  steps: string[]
  /** Index of the step in progress. Steps before it are done; current >= steps.length = all done. */
  current: number
  className?: string
}

type StepState = 'done' | 'current' | 'todo'

const STATE_LABEL: Record<StepState, string> = {
  done: 'selesai',
  current: 'sedang berlangsung',
  todo: 'belum',
}

function stepState(index: number, current: number): StepState {
  if (index < current) return 'done'
  if (index === current) return 'current'
  return 'todo'
}

/** Vertical order-tracking list (07 / 07a). Circles animate when `current` changes. */
export function StepTracker({ steps, current, className }: StepTrackerProps) {
  return (
    <ol className={cx('flex flex-col', className)}>
      {steps.map((label, index) => {
        const state = stepState(index, current)
        return (
          <li
            key={label}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex min-h-11 items-center gap-3"
          >
            <span
              className={cx(
                'relative flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
                'transition-[background-color,color,transform,box-shadow] duration-300 ease-out',
                state === 'todo'
                  ? 'bg-[#e4e9e5] text-muted'
                  : 'bg-primary text-white',
                state === 'current' && 'shadow-[0_0_0_4px_rgba(21,128,61,0.14)]',
              )}
            >
              {/* key = state: the glyph remounts and pops when the step changes */}
              <span key={state} className={cx('inline-flex', state !== 'todo' && 'animate-pop')}>
                {state === 'done' ? <Check size={15} strokeWidth={3} aria-hidden /> : index + 1}
              </span>
            </span>
            <span
              className={cx(
                'text-[15px] leading-[1.3] transition-colors duration-300',
                state === 'done' && 'font-semibold text-ink',
                state === 'current' && 'font-bold text-primary-dark',
                state === 'todo' && 'font-normal text-muted',
              )}
            >
              {label}
              <span className="sr-only"> ({STATE_LABEL[state]})</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
