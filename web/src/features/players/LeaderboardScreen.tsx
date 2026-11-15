// The four neighborhoods, ranked by points, with each one's top three players.
// It refreshes every few seconds, so a new award shows up without a reload.
import { useQuery } from '@tanstack/react-query'
import { NEIGHBORHOODS } from '../../../../shared/constants'
import type { NeighborhoodId } from '../../../../shared/types'
import { api } from '../../app/api'
import { usePlayer } from '../../app/player'
import { leaderboardKey, POLL_MS } from '../../app/queryClient'
import { strings } from '../../app/strings'
import { Badge, Card, ErrorNotice, ScreenHeader } from '../../app/ui'

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
      <ScreenHeader title={strings.leaderboard.title} subtitle={strings.leaderboard.subtitle} />

      {leaderboard.isPending && <p className="text-muted">{strings.leaderboard.loading}</p>}

      {leaderboard.isError && !leaderboard.data && (
        <ErrorNotice message={leaderboard.error.message} fallback={strings.leaderboard.error} onRetry={() => void leaderboard.refetch()} retryLabel={strings.leaderboard.retry} />
      )}

      {leaderboard.data && (
        <ol className="flex flex-col gap-3" aria-live="polite">
          {leaderboard.data.neighborhoods.map((row, index) => {
            const mine = player.data?.neighborhood === row.neighborhood
            return (
              <Card as="li" key={row.neighborhood} selected={mine}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-baseline gap-3">
                    <span className="shrink-0 text-lg font-mono tabular-nums text-muted">
                      {strings.leaderboard.rank(index + 1)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg text-ink">{neighborhoodName(row.neighborhood)}</h2>
                      <p className="text-sm text-muted">{strings.leaderboard.players(row.playerCount)}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xl font-mono tabular-nums text-ink">
                    {strings.leaderboard.points(row.points)}
                  </span>
                </div>

                {mine && (
                  <Badge className="mt-2">
                    {strings.leaderboard.yours}
                  </Badge>
                )}

                {row.topPlayers.length > 0 ? (
                  <ol className="mt-3 border-t border-dotted border-line pt-2">
                    {row.topPlayers.map((top, place) => (
                      <li key={`${top.nickname}-${place}`} className="flex items-center justify-between gap-3 py-1 text-sm">
                        <span className="min-w-0 truncate text-ink">
                          <span className="mr-2 tabular-nums text-muted">{place + 1}.</span>
                          {top.nickname}
                        </span>
                        <span className="shrink-0 font-mono tabular-nums text-muted">{strings.leaderboard.points(top.points)}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 border-t border-dotted border-line pt-2 text-sm text-muted">{strings.leaderboard.noPlayers}</p>
                )}
              </Card>
            )
          })}
        </ol>
      )}
    </div>
  )
}
