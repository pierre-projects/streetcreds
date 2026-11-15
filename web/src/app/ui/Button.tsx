// Shared action styles. Callers use className for spacing and width only.
import type { ComponentProps } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from './cx'

type Variant = 'primary' | 'secondary'
const variants: Record<Variant, string> = {
  primary: 'border-solid border-transparent bg-accent text-on-accent shadow-float motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.99]',
  secondary: 'border-ink/15 bg-surface text-ink hover:bg-page',
}
function buttonClass(variant: Variant) {
  return cx('flex min-h-11 w-full items-center justify-center rounded-pill border px-4 py-2 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 outline-ink disabled:pointer-events-none disabled:opacity-60', variants[variant])
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
