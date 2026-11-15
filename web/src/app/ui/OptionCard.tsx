// Native radio semantics, reusable with any string union.
import { cx } from './cx'
export function OptionCard<T extends string>({ value, checked, onChange, name, label, disabled, className }: { value: T; checked: boolean; onChange: (value: T) => void; name: string; label: string; disabled?: boolean; className?: string }) {
  return (
    <label className={cx('flex min-h-12 items-center gap-3 rounded-control px-4 py-2 text-base text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ink', checked ? 'border-2 border-ink bg-accent' : 'border border-dotted border-line bg-surface', disabled ? 'cursor-default opacity-60' : 'cursor-pointer', className)}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} disabled={disabled} className="size-5 shrink-0 accent-ink" />
      {label}
    </label>
  )
}
