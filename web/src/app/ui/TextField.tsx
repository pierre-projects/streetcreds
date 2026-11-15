// Field ids connect the label and both descriptions to the native input.
import { useId, type InputHTMLAttributes } from 'react'
import { cx } from './cx'
export function TextField({ label, hint, error, className, id, 'aria-describedby': describedBy, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-base text-ink">{label}</label>
      <input {...props} id={inputId} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={cx(describedBy, hint && hintId, error && errorId) || undefined} className="mt-2 block min-h-12 w-full rounded-control border border-ink bg-surface px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:opacity-60" />
      {hint && <p id={hintId} className="mt-2 text-sm text-muted">{hint}</p>}
      {error && <p id={errorId} className="mt-2 text-sm text-severity-high">{error}</p>}
    </div>
  )
}
