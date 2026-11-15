// Native radio semantics, reusable with any string union.
// look="row": a full-width row with a visible radio (council answers).
// look="chip": a compact chip with no dot, red when picked (report categories).
import { cx } from './cx'

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 shrink-0">
      <path d="m5 12 5 5 9-10" />
    </svg>
  )
}

export function OptionCard<T extends string>({
  value,
  checked,
  onChange,
  name,
  label,
  disabled,
  className,
  look = 'row',
  showCheck = false,
}: {
  value: T
  checked: boolean
  onChange: (value: T) => void
  name: string
  label: string
  disabled?: boolean
  className?: string
  look?: 'row' | 'chip'
  /** Chips only: show a check mark on the picked chip. */
  showCheck?: boolean
}) {
  const focus = 'has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ink'
  const state = disabled ? 'cursor-default opacity-60' : 'cursor-pointer'

  if (look === 'chip') {
    return (
      <label
        className={cx(
          'inline-flex min-h-12 items-center justify-center gap-2 rounded-control border px-4 py-2 text-center text-sm font-bold',
          checked ? 'border-transparent bg-quest text-on-quest' : 'border-ink/10 bg-raised text-ink',
          focus,
          state,
          className,
        )}
      >
        <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} disabled={disabled} className="sr-only" />
        {checked && showCheck ? <CheckIcon /> : null}
        {label}
      </label>
    )
  }

  return (
    <label
      className={cx(
        'flex min-h-12 items-center gap-3 rounded-control border px-4 py-2 text-base text-ink',
        checked ? 'border-accent bg-raised' : 'border-ink/10 bg-surface',
        focus,
        state,
        className,
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} disabled={disabled} className="size-5 shrink-0 accent-accent" />
      {label}
    </label>
  )
}
