// The top of every quest screen: Cancel on the left, the quest name in the middle, the step on
// the right, and a segmented progress bar under them. Built from tokens only.
import { Link } from 'react-router'
import { questStrings } from './strings'

export function QuestHeader({
  title,
  step,
  total,
  cancelTo = '/home',
}: {
  title: string
  /** 1-based. Leave out (with total) for a screen that has no steps, such as a list. */
  step?: number
  total?: number
  cancelTo?: string
}) {
  const hasSteps = step !== undefined && total !== undefined && total > 0
  return (
    <header className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Link
          to={cancelTo}
          className="inline-flex min-h-11 items-center justify-self-start text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-4 outline-ink"
        >
          {questStrings.steps.cancel}
        </Link>
        <h1 className="text-center font-display text-lg tracking-tight text-ink">{title}</h1>
        <p className="justify-self-end text-xs font-medium text-muted tabular-nums">
          {hasSteps ? questStrings.steps.of(step, total) : null}
        </p>
      </div>
      {hasSteps ? (
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step}
          aria-label={questStrings.steps.of(step, total)}
        >
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={`h-1 flex-1 rounded-pill ${index < step ? 'bg-accent' : 'bg-ink/15'}`}
            />
          ))}
        </div>
      ) : null}
    </header>
  )
}
