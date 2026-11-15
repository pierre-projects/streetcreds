// Navigable surface for quests and council items.
import { Link, type LinkProps } from 'react-router'
import { cx } from './cx'
export function LinkCard({ className, ...props }: LinkProps) {
  return <Link {...props} className={cx('flex min-h-11 items-start justify-between gap-3 rounded-card border border-dotted border-line bg-surface p-4 text-ink focus-visible:outline-2 focus-visible:outline-offset-4 outline-ink hover:border-ink motion-safe:transition-transform motion-safe:active:translate-x-[3px] motion-safe:active:translate-y-[3px]', className)} />
}
