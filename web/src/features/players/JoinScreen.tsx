// The server assigns a neighborhood from a one-time device location. No email or password.
// POST /players makes the player, and the id it returns is kept on the phone.
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { NICKNAME_MAX, NICKNAME_MIN } from '../../../../shared/constants'
import { api } from '../../app/api'
import { BoardLink } from '../../app/BoardLink'
import { legalLinkClass } from '../../app/legal/LegalLinks'
import { readCurrentLocation } from '../../app/location'
import { getStoredPlayerId, storePlayerId } from '../../app/player'
import { strings } from '../../app/strings'
import { Button, ErrorNotice, LogoMark, ScreenHeader, TextField } from '../../app/ui'

export function JoinScreen() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [locating, setLocating] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const join = useMutation({
    mutationFn: api.createPlayer,
    onSuccess: ({ player }) => {
      storePlayerId(player.id)
      void navigate('/home', { replace: true })
    },
  })

  // Someone who already joined never sees this screen again.
  if (getStoredPlayerId() !== null) {
    return <Navigate to="/home" replace />
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (locating || join.isPending) return
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
      join.mutate({ nickname: trimmed, location })
    } catch (error) {
      setProblem(error instanceof Error ? error.message : strings.join.locationError)
      setLocating(false)
    }
  }

  // What the player got wrong on this screen, or else what the API said.
  const message = problem || (join.isError ? join.error.message || strings.errors.generic : null)

  return (
    <main className="app-column flex flex-col px-4 py-8">
      <BoardLink />
      <div className="mb-5 flex items-center gap-3">
        <LogoMark className="size-9" />
        <span className="text-xl font-bold tracking-tight text-ink">{strings.appName}</span>
      </div>
      <ScreenHeader title={strings.appName} subtitle={strings.tagline} />

      <form onSubmit={submit} noValidate className="mt-8 flex flex-1 flex-col gap-6">
        <TextField
          label={strings.join.nicknameLabel}
          hint={strings.join.nicknameHint(NICKNAME_MIN, NICKNAME_MAX)}
          name="nickname" type="text" value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={NICKNAME_MAX} autoComplete="nickname" autoCapitalize="words" enterKeyHint="done"
        />

        <section aria-labelledby="join-location" className="space-y-2">
          <h2 id="join-location" className="text-base font-medium text-ink">{strings.join.neighborhoodLabel}</h2>
          <p className="text-sm leading-relaxed text-muted">{strings.join.locationHint}</p>
          <Link to="/board" className={legalLinkClass}>{strings.join.watchBoard}</Link>
        </section>

        <div className="mt-auto">
          {message !== null && <div className="mb-3"><ErrorNotice message={message} fallback={strings.errors.generic} /></div>}
          <Button type="submit" disabled={locating || join.isPending}>
            {locating ? strings.join.locating : join.isPending ? strings.join.submitting : strings.join.submit}
          </Button>
          <p className="mt-3 text-center text-sm leading-relaxed text-muted">
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
