// Shared surface shape, border and tone.
import type { HTMLAttributes } from 'react'
import { cx } from './cx'
const tones = {
  plain: 'bg-surface text-ink',
  dark: 'bg-ink text-on-ink [&_:focus-visible]:outline-accent',
}
export function Card({ as: Tag = 'section', tone = 'plain', selected = false, className, ...props }: HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'li'; tone?: keyof typeof tones; selected?: boolean }) {
  return <Tag {...props} className={cx('rounded-card border-dotted p-4', selected ? (tone === 'dark' ? 'border-2 border-accent' : 'border-2 border-ink') : 'border border-line', tones[tone], className)} />
}
