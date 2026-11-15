// The first screen: a nickname and a neighborhood, nothing else. No email, no password.
// POST /players makes the player, and the id it returns is kept on the phone.
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { NEIGHBORHOODS, NICKNAME_MAX, NICKNAME_MIN } from '../../../../shared/constants'
import type { NeighborhoodId } from '../../../../shared/types'
import { api } from '../../app/api'
import { getStoredPlayerId, storePlayerId } from '../../app/player'
import { strings } from '../../app/strings'

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
  const message = problem ?? (join.isError ? join.error.message : null)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">{strings.appName}</h1>
        <p className="mt-1 text-base text-muted">{strings.tagline}</p>
      </header>

      <form onSubmit={submit} noValidate className="mt-8 flex flex-1 flex-col gap-6">
        <div>
          <label htmlFor="nickname" className="block text-base font-semibold text-ink">
            {strings.join.nicknameLabel}
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={NICKNAME_MAX}
            autoComplete="nickname"
            autoCapitalize="words"
            enterKeyHint="done"
            aria-describedby="nickname-hint"
            className="mt-2 block min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          <p id="nickname-hint" className="mt-2 text-sm text-muted">
            {strings.join.nicknameHint(NICKNAME_MIN, NICKNAME_MAX)}
          </p>
        </div>

        <fieldset>
          <legend className="text-base font-semibold text-ink">{strings.join.neighborhoodLabel}</legend>
          <div className="mt-2 grid gap-2">
            {NEIGHBORHOODS.map((option) => {
              const selected = neighborhood === option.id
              return (
                <label
                  key={option.id}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-surface px-4 text-base ${
                    selected ? 'border-accent font-semibold text-ink ring-2 ring-accent/30' : 'border-line text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="neighborhood"
                    value={option.id}
                    checked={selected}
                    onChange={() => setNeighborhood(option.id)}
                    className="size-5 accent-accent"
                  />
                  {option.name}
                </label>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-auto">
          {message !== null && (
            <p role="alert" className="mb-3 text-base text-severity-high">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={join.isPending}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-on-accent disabled:opacity-60"
          >
            {join.isPending ? strings.join.submitting : strings.join.submit}
          </button>
        </div>
      </form>
    </main>
  )
}
