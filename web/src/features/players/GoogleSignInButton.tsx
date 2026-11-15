// "Continue with Google". Renders Google's own button, and hands back the ID token Google
// gives when the person finishes. What to do with it (sign in, save a guest, join) is the
// screen's business.
//
// In mock mode there is no Google: an ordinary button stands in and hands back a made-up token.
import { useEffect, useRef, useState } from 'react'
import { USE_MOCKS } from '../../app/api'
import { GOOGLE_BUTTON_SCALE, GOOGLE_SIGN_IN_ON, renderGoogleButton } from '../../app/google'
import { strings } from '../../app/strings'
import { Button } from '../../app/ui'

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void
  /** While a sign-in request is running. */
  busy?: boolean
}

export function GoogleSignInButton({ onCredential, busy = false }: GoogleSignInButtonProps) {
  if (!GOOGLE_SIGN_IN_ON) return null
  if (USE_MOCKS) {
    return (
      <Button variant="secondary" disabled={busy} onClick={() => onCredential('mock-credential')}>
        {busy ? strings.auth.signingIn : strings.auth.continueWithGoogle}
      </Button>
    )
  }
  return <RealGoogleButton onCredential={onCredential} busy={busy} />
}

function RealGoogleButton({ onCredential, busy }: Required<GoogleSignInButtonProps>) {
  const holder = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  // Google keeps the callback it was given first, so it gets one that always calls the latest.
  const latest = useRef(onCredential)
  useEffect(() => {
    latest.current = onCredential
  }, [onCredential])

  useEffect(() => {
    const parent = holder.current
    if (!parent) return
    let cancelled = false
    renderGoogleButton(parent, (credential) => latest.current(credential)).catch(() => {
      if (!cancelled) setFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (failed) {
    return <p role="alert" className="text-sm text-severity-high">{strings.auth.unavailable}</p>
  }
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Google draws its button 40 px tall. Scaled up, the tap target is 44 px. */}
      <div className="flex min-h-11 w-full justify-center overflow-hidden" aria-busy={busy}>
        <div
          ref={holder}
          className={busy ? 'pointer-events-none opacity-60' : undefined}
          style={{ transform: `scale(${GOOGLE_BUTTON_SCALE})`, transformOrigin: 'top center', width: `${100 / GOOGLE_BUTTON_SCALE}%` }}
        />
      </div>
      {busy && <p role="status" className="text-sm text-muted">{strings.auth.signingIn}</p>}
    </div>
  )
}
