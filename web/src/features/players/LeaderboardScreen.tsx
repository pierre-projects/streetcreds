// The four neighborhoods, ranked by points, with each one's top three players.
// It refreshes every few seconds, so a new award shows up without a reload.
import { useQuery } from '@tanstack/react-query'
import { NEIGHBORHOODS } from '../../../../shared/constants'
import type { NeighborhoodId } from '../../../../shared/types'
import { api } from '../../app/api'
import { usePlayer } from '../../app/player'
import { leaderboardKey, POLL_MS } from '../../app/queryClient'
import { strings } from '../../app/strings'

function neighborhoodName(id: NeighborhoodId): string {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id
}

export function LeaderboardScreen() {
  const player = usePlayer()
  const leaderboard = useQuery({
    queryKey: leaderboardKey,
    queryFn: api.getLeaderboard,
    refetchInterval: POLL_MS,
  })

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{strings.leaderboard.title}</h1>
        <p className="mt-1 text-sm text-muted">{strings.leaderboard.subtitle}</p>
      </header>

      {leaderboard.isPending && <p className="text-muted">{strings.leaderboard.loading}</p>}

      {leaderboard.isError && !leaderboard.data && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <p role="alert" className="text-base text-severity-high">
            {leaderboard.error.message || strings.leaderboard.error}
          </p>
          <button
            type="button"
            onClick={() => void leaderboard.refetch()}
            className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl border border-line px-4 font-semibold text-accent"
          >
            {strings.leaderboard.retry}
          </button>
        </section>
      )}

      {leaderboard.data && (
        <ol className="flex flex-col gap-3" aria-live="polite">
          {leaderboard.data.neighborhoods.map((row, index) => {
            const mine = player.data?.neighborhood === row.neighborhood
            return (
              <li
                key={row.neighborhood}
                className={`rounded-2xl border bg-surface p-4 ${mine ? 'border-accent ring-2 ring-accent/30' : 'border-line'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-baseline gap-3">
                    <span className="shrink-0 text-lg font-bold tabular-nums text-muted">
                      {strings.leaderboard.rank(index + 1)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-ink">{neighborhoodName(row.neighborhood)}</h2>
                      <p className="text-sm text-muted">{strings.leaderboard.players(row.playerCount)}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xl font-bold tabular-nums text-ink">
                    {strings.leaderboard.points(row.points)}
                  </span>
                </div>

                {mine && (
                  <p className="mt-2 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-on-accent">
                    {strings.leaderboard.yours}
                  </p>
                )}

                {row.topPlayers.length > 0 ? (
                  <ol className="mt-3 border-t border-line pt-2">
                    {row.topPlayers.map((top, place) => (
                      <li key={`${top.nickname}-${place}`} className="flex items-center justify-between gap-3 py-1 text-sm">
                        <span className="min-w-0 truncate text-ink">
                          <span className="mr-2 tabular-nums text-muted">{place + 1}.</span>
                          {top.nickname}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted">{strings.leaderboard.points(top.points)}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 border-t border-line pt-2 text-sm text-muted">{strings.leaderboard.noPlayers}</p>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
