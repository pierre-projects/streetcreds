// The first screen: a nickname and a neighborhood, nothing else. No email, no password.
// POST /players makes the player, and the id it returns is kept on the phone.
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { NEIGHBORHOODS, NICKNAME_MAX, NICKNAME_MIN } from '../../../../shared/constants'
import type { NeighborhoodId } from '../../../../shared/types'
import { api } from '../../app/api'
import { BoardLink } from '../../app/BoardLink'
import { legalLinkClass } from '../../app/legal/LegalLinks'
import { getStoredPlayerId, storePlayerId } from '../../app/player'
import { strings } from '../../app/strings'
import { Button, ErrorNotice, LogoMark, OptionCard, ScreenHeader, TextField } from '../../app/ui'

export function JoinScreen() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [neighborhood, setNeighborhood] = useState<NeighborhoodId | null>(null)
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

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = nickname.trim()
    if (trimmed.length < NICKNAME_MIN || trimmed.length > NICKNAME_MAX) {
      setProblem(strings.join.nicknameInvalid(NICKNAME_MIN, NICKNAME_MAX))
      return
    }
    if (neighborhood === null) {
      setProblem(strings.join.neighborhoodInvalid)
      return
    }
    setProblem(null)
    join.mutate({ nickname: trimmed, neighborhood })
  }

  // What the player got wrong on this screen, or else what the API said.
  const message = problem || (join.isError ? join.error.message || strings.errors.generic : null)

  return (
    <main className="app-column flex flex-col px-4 py-8">
      <BoardLink />
      <div className="mb-5 flex items-center gap-3">
        <LogoMark />
        <span className="text-lg font-bold tracking-tight text-ink">{strings.appName}</span>
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

        <fieldset>
          <legend className="text-base font-medium text-ink">{strings.join.neighborhoodLabel}</legend>
          <div className="mt-2 grid gap-2">
            {NEIGHBORHOODS.map((option) => (
              <OptionCard key={option.id} name="neighborhood" value={option.id} checked={neighborhood === option.id} onChange={setNeighborhood} label={option.name} />
            ))}
          </div>
        </fieldset>

        <div className="mt-auto">
          {message !== null && <div className="mb-3"><ErrorNotice message={message} fallback={strings.errors.generic} /></div>}
          <Button type="submit" disabled={join.isPending}>
            {join.isPending ? strings.join.submitting : strings.join.submit}
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
