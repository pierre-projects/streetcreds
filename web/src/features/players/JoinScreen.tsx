// The server assigns a neighborhood from a one-time device location. No email or password.
// POST /players makes the player, and the id it returns is kept on the phone.
//
// "Continue with Google" is optional. A returning person goes straight home as their saved
// player. A new person fills the same form, and the player is saved to their account from the start.
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { NEIGHBORHOODS, NICKNAME_MAX, NICKNAME_MIN } from '../../../../shared/constants'
import { api, ApiError } from '../../app/api'
import { BoardLink } from '../../app/BoardLink'
import { GOOGLE_SIGN_IN_ON } from '../../app/google'
import { legalLinkClass } from '../../app/legal/LegalLinks'
import { readCurrentLocation } from '../../app/location'
import { completeSignIn, getStoredPlayerId } from '../../app/player'
import { strings } from '../../app/strings'
import { Button, ErrorNotice, MayorAvatar, MayorSays, TextField, Wordmark } from '../../app/ui'
import { GoogleSignInButton } from './GoogleSignInButton'

const isCode = (error: unknown, code: ApiError['code']) => error instanceof ApiError && error.code === code

export function JoinScreen() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [locating, setLocating] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  // Google's ID token for someone who signed in but has no saved player yet. The form finishes the job.
  const [credential, setCredential] = useState<string | null>(null)

  const signIn = useMutation({
    mutationFn: (googleCredential: string) => api.signInWithGoogle({ credential: googleCredential }),
    onSuccess: ({ player, sessionToken }) => {
      completeSignIn(player, sessionToken)
      void navigate('/home', { replace: true })
    },
    onError: (error, googleCredential) => {
      // No saved player for this Google account: a new person. Keep the token for the form.
      if (isCode(error, 'not_found')) setCredential(googleCredential)
    },
  })

  const join = useMutation({
    mutationFn: api.createPlayer,
    onSuccess: ({ player, sessionToken }) => {
      completeSignIn(player, sessionToken)
      void navigate('/home', { replace: true })
    },
    onError: (error, request) => {
      // The Google account got a saved player since the button was pressed. Sign in to it instead.
      if (isCode(error, 'already_linked') && request.credential !== undefined) signIn.mutate(request.credential)
    },
  })

  // Someone who already joined never sees this screen again.
  if (getStoredPlayerId() !== null) {
    return <Navigate to="/home" replace />
  }

  const busy = locating || join.isPending || signIn.isPending

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const trimmed = nickname.trim()
    if (trimmed.length < NICKNAME_MIN || trimmed.length > NICKNAME_MAX) {
      setProblem(strings.join.nicknameInvalid(NICKNAME_MIN, NICKNAME_MAX))
      return
    }
    setProblem(null)
    join.reset()
    setLocating(true)
    try {
      // Joining only uses the reading to pick a team, so it accepts a rougher one than a report does.
      const location = await readCurrentLocation('join')
      setLocating(false)
      join.mutate({ nickname: trimmed, location, ...(credential === null ? {} : { credential }) })
    } catch (error) {
      setProblem(error instanceof Error ? error.message : strings.join.locationError)
      setLocating(false)
    }
  }

  function onGoogle(googleCredential: string) {
    if (busy) return
    setProblem(null)
    join.reset()
    signIn.mutate(googleCredential)
  }

  // What the player got wrong on this screen, or else what the API said. The two errors that
  // only steer the flow (a new person, an account that is already saved) are not shown.
  const joinFailed = join.isError && !isCode(join.error, 'already_linked')
  const signInFailed = signIn.isError && !isCode(signIn.error, 'not_found')
  const message =
    problem ||
    (joinFailed ? join.error.message || strings.errors.generic : null) ||
    (signInFailed ? signIn.error.message || strings.auth.failed : null)
  const game = strings.game.join

  return (
    <main className="app-column flex flex-col px-5 pb-6 pt-8">
      <BoardLink />
      <div className="flex flex-col items-center gap-4 text-center">
        <MayorAvatar size="large" />
        <h1>
          <Wordmark className="text-5xl" />
        </h1>
      </div>

      <div className="mt-5">
        <MayorSays avatar={false}>
          <p className="text-center text-base text-ink">{game.mayor}</p>
        </MayorSays>
      </div>

      {GOOGLE_SIGN_IN_ON && (
        <section className="mt-6 space-y-2">
          {credential === null ? (
            <>
              <GoogleSignInButton onCredential={onGoogle} busy={signIn.isPending} />
              <p className="text-center text-sm leading-relaxed text-muted">{strings.auth.joinHint}</p>
            </>
          ) : (
            <p role="status" className="text-sm leading-relaxed text-ink">{strings.auth.newPerson}</p>
          )}
        </section>
      )}

      <form onSubmit={submit} noValidate className="mt-6 flex flex-1 flex-col gap-6">
        <TextField
          label={game.nickname}
          hint={strings.join.nicknameHint(NICKNAME_MIN, NICKNAME_MAX)}
          name="nickname" type="text" value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={NICKNAME_MAX} autoComplete="nickname" autoCapitalize="words" enterKeyHint="done"
        />

        <section aria-labelledby="join-location" className="space-y-3">
          <h2 id="join-location" className="text-sm font-semibold text-muted">{strings.join.neighborhoodLabel}</h2>
          {/* The four teams. Your location picks yours when you join, so these are not buttons. */}
          <ul className="grid grid-cols-2 gap-2" aria-label={game.teams}>
            {NEIGHBORHOODS.map((n) => (
              <li key={n.id} className="team-tile">{n.name}</li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-muted">{strings.join.locationHint}</p>
          <Link to="/board" className={legalLinkClass}>{strings.join.watchBoard}</Link>
        </section>

        <div className="mt-auto">
          {message !== null && <div className="mb-3"><ErrorNotice message={message} fallback={strings.errors.generic} /></div>}
          <Button type="submit" disabled={busy}>
            {locating ? strings.join.locating : join.isPending ? strings.join.submitting : game.start}
          </Button>
          <p className="mt-3 text-center text-xs leading-relaxed text-muted">{game.finePrint}</p>
          <p className="mt-1 text-center text-xs leading-relaxed text-muted">
            {strings.legal.joinPrefix}{' '}
            <Link to="/terms" className={legalLinkClass}>{strings.legal.pages.terms.label}</Link>{' '}
            {strings.legal.joinAnd}{' '}
            <Link to="/privacy" className={legalLinkClass}>{strings.legal.privacyPolicy}</Link>
          </p>
          <div className="flex justify-center">
            <Link to="/about" className={legalLinkClass}>{strings.legal.pages.about.label}</Link>
          </div>
        </div>
      </form>
    </main>
  )
}
