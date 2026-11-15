// Phase 0 placeholder. It proves the pieces are wired together: the web app loads, it can import
// the contract in shared/, and it can reach the API. Phase 1 replaces this with the real routes.
import { useEffect, useState } from 'react'
import type { LeaderboardResponse } from '../../../shared/api'
import { APP_NAME, NEIGHBORHOODS } from '../../../shared/constants'

type Check =
  | { state: 'loading' }
  | { state: 'ok'; data: LeaderboardResponse }
  | { state: 'error'; message: string }

const API_URL = import.meta.env.VITE_API_URL ?? ''

function neighborhoodName(id: string): string {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id
}

export function App() {
  const [check, setCheck] = useState<Check>(() =>
    API_URL === ''
      ? { state: 'error', message: 'VITE_API_URL is not set. Copy web/.env.example to web/.env.' }
      : { state: 'loading' },
  )

  useEffect(() => {
    if (API_URL === '') return
    const controller = new AbortController()
    fetch(`${API_URL}/leaderboard`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`The API answered with status ${response.status}.`)
        }
        const data = (await response.json()) as LeaderboardResponse
        setCheck({ state: 'ok', data })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const reason = error instanceof Error ? error.message : 'Unknown error.'
        setCheck({ state: 'error', message: `Could not reach the API at ${API_URL}. ${reason}` })
      })
    return () => controller.abort()
  }, [])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">{APP_NAME}</h1>
        <p className="mt-1 text-base text-muted">Earn points for making your neighborhood better.</p>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-4" aria-live="polite">
        <h2 className="text-lg font-semibold text-ink">Neighborhoods</h2>

        {check.state === 'loading' && <p className="mt-3 text-muted">Loading the leaderboard…</p>}

        {check.state === 'error' && (
          <p className="mt-3 text-severity-high" role="alert">
            {check.message}
          </p>
        )}

        {check.state === 'ok' && (
          <ul className="mt-2 divide-y divide-line">
            {check.data.neighborhoods.map((row) => (
              <li key={row.neighborhood} className="flex min-h-11 items-center justify-between gap-3 py-2">
                <span className="text-ink">{neighborhoodName(row.neighborhood)}</span>
                <span className="font-semibold tabular-nums text-ink">{row.points} pts</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-muted">The game is being built at sunhacks 2026. Quests open soon.</p>
    </main>
  )
}
