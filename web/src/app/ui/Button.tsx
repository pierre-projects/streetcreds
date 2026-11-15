// Shared action styles. Callers use className for spacing and width only.
import type { ComponentProps } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from './cx'

type Variant = 'primary' | 'secondary'
const variants: Record<Variant, string> = {
  primary: 'border-solid bg-accent text-on-accent shadow-hard motion-safe:transition-transform motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-x-[3px] motion-safe:active:translate-y-[3px] active:shadow-none',
  secondary: 'border-dotted bg-surface text-ink hover:bg-page',
}
function buttonClass(variant: Variant) {
  return cx('flex min-h-11 w-full items-center justify-center rounded-control border border-ink px-4 py-2 text-center text-sm focus-visible:outline-2 focus-visible:outline-offset-4 outline-ink disabled:pointer-events-none disabled:opacity-60', variants[variant])
}
export function Button({ variant = 'primary', className, type = 'button', ...props }: ComponentProps<'button'> & { variant?: Variant }) {
  return <button {...props} type={type} className={cx(buttonClass(variant), className)} />
}
export function ButtonLink({ variant = 'primary', className, ...props }: LinkProps & { variant?: Variant }) {
  return <Link {...props} className={cx(buttonClass(variant), className)} />
}
