// Shared action styles. Callers use className for spacing and width only.
// primary: Blaze orange, for joining and the app's own actions.
// quest: Signal red, for the one button that finishes a quest and pays points.
// secondary: Raised, for everything else.
import type { ComponentProps } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from './cx'

type Variant = 'primary' | 'quest' | 'secondary'
const variants: Record<Variant, string> = {
  primary:
    'border-transparent bg-accent text-on-accent motion-safe:transition-transform motion-safe:active:scale-[0.99]',
  quest:
    'border-transparent bg-quest text-on-quest motion-safe:transition-transform motion-safe:active:scale-[0.99]',
  secondary: 'border-ink/10 bg-raised text-ink hover:bg-surface',
}
function buttonClass(variant: Variant) {
  return cx(
    'flex min-h-12 w-full items-center justify-center rounded-control border px-4 py-2 text-center font-display text-sm uppercase tracking-[0.08em] focus-visible:outline-2 focus-visible:outline-offset-4 outline-ink disabled:pointer-events-none disabled:opacity-60',
    variants[variant],
  )
}
export function Button({ variant = 'primary', className, type = 'button', ...props }: ComponentProps<'button'> & { variant?: Variant }) {
  return <button {...props} type={type} className={cx(buttonClass(variant), className)} />
}
export function ButtonLink({ variant = 'primary', className, ...props }: LinkProps & { variant?: Variant }) {
  return <Link {...props} className={cx(buttonClass(variant), className)} />
}
/** A link that leaves the app, or saves a file, drawn as a button. ButtonLink is for the app's own screens. */
export function ButtonAnchor({ variant = 'primary', className, ...props }: ComponentProps<'a'> & { variant?: Variant }) {
  return <a {...props} className={cx(buttonClass(variant), className)} />
}
