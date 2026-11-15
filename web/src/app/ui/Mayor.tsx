// Mayor Patch, the mascot, and his speech bubble. Used on Join, Home and every quest screen.
//
// The mascot picture goes at MASCOT_SRC. Until it is added, the brand mark stands in for it,
// so nothing shows a broken image.
import { useState, type ReactNode } from 'react'
import { Card } from './Card'
import { cx } from './cx'
import { LogoMark } from './LogoMark'

const MASCOT_SRC = '/brand/mayor-patch.svg'

export function MayorAvatar({ size = 'small' }: { size?: 'small' | 'large' }) {
  const [missing, setMissing] = useState(false)
  const large = size === 'large'
  return (
    <span
      className={cx(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent ring-1 ring-accent ring-offset-2 ring-offset-page',
        large ? 'size-40' : 'size-14',
      )}
    >
      {missing ? (
        <LogoMark className={large ? 'size-24' : 'size-9'} />
      ) : (
        <img
          src={MASCOT_SRC}
          alt=""
          width={large ? 160 : 56}
          height={large ? 160 : 56}
          draggable={false}
          onError={() => setMissing(true)}
          className="size-full object-cover"
        />
      )}
    </span>
  )
}

/** A speech bubble. With `avatar` (the default) Mayor Patch sits beside it. */
export function MayorSays({ children, live = false, avatar = true }: { children: ReactNode; live?: boolean; avatar?: boolean }) {
  const bubble = (
    <Card as="div" className="min-w-0 flex-1" aria-live={live ? 'polite' : undefined}>
      <span className="sr-only">Mayor Patch: </span>
      {children}
    </Card>
  )
  if (!avatar) return bubble
  return (
    <div className="flex items-start gap-3">
      <MayorAvatar />
      {bubble}
    </div>
  )
}

/** The "StreetCreds" wordmark: Street in ink, Creds in soft orange. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx('font-display tracking-tight text-ink', className)}>
      Street<span className="text-accent-soft">Creds</span>
    </span>
  )
}
