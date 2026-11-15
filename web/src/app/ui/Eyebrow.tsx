// Small mono labels with a readable secondary tone on dark surfaces.
import type { HTMLAttributes } from 'react'
import { cx } from './cx'
export function Eyebrow({ className, tone = 'plain', ...props }: HTMLAttributes<HTMLParagraphElement> & { tone?: 'plain' | 'dark' }) {
  return <p {...props} className={cx('font-mono text-label uppercase', tone === 'dark' ? 'text-on-ink/70' : 'text-muted', className)} />
}
