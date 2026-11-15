// Mayor Patch, the mascot, with a speech bubble beside him. Used on every quest screen.
//
// The mascot picture is not in the repo yet. Until Pierre adds it at MASCOT_SRC (see the note
// for Pierre), the brand mark stands in for it, so nothing shows a broken image.
import { useState, type ReactNode } from 'react'
import { Card, LogoMark } from '../../app/ui'
import { questStrings } from './strings'

const MASCOT_SRC = '/brand/mayor-patch.png'

function MayorAvatar() {
  const [missing, setMissing] = useState(false)
  return (
    <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-accent bg-accent">
      {missing ? (
        <LogoMark className="size-9" />
      ) : (
        <img
          src={MASCOT_SRC}
          alt=""
          width={56}
          height={56}
          draggable={false}
          onError={() => setMissing(true)}
          className="size-full object-cover"
        />
      )}
    </span>
  )
}

export function MayorSays({ children, live = false }: { children: ReactNode; live?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <MayorAvatar />
      <Card as="div" className="min-w-0 flex-1" aria-live={live ? 'polite' : undefined}>
        <span className="sr-only">{questStrings.mayor.name}: </span>
        {children}
      </Card>
    </div>
  )
}
