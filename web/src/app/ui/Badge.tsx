// Points and status labels with stable-width digits during polling.
import type { HTMLAttributes } from 'react'
import { cx } from './cx'
export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={cx('inline-flex shrink-0 items-center rounded-pill border border-transparent bg-accent px-3 py-1 font-mono text-xs font-semibold tabular-nums text-on-accent', className)} />
}
