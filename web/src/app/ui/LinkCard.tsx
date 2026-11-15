// Navigable surface for quests and council items.
import { Link, type LinkProps } from 'react-router'
import { cx } from './cx'
export function LinkCard({ className, ...props }: LinkProps) {
  return <Link {...props} className={cx('flex min-h-11 items-start justify-between gap-3 rounded-card border border-ink/10 bg-surface p-4 text-ink shadow-float focus-visible:outline-2 focus-visible:outline-offset-4 outline-ink hover:border-ink/30 motion-safe:transition-transform motion-safe:active:scale-[0.99]', className)} />
}
