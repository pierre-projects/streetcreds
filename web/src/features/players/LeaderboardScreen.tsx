// The four neighborhoods, ranked by points, with each one's top three players.
// It refreshes every few seconds, so a new award shows up without a reload.
import { useQuery } from '@tanstack/react-query'
import { NEIGHBORHOODS } from '../../../../shared/constants'
import type { NeighborhoodId } from '../../../../shared/types'
import { api } from '../../app/api'
import { usePlayer } from '../../app/player'
import { leaderboardKey, POLL_MS } from '../../app/queryClient'
import { strings } from '../../app/strings'
import { Badge, ErrorNotice, ScreenHeader, cx } from '../../app/ui'

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
    <div className="leaderboard">
      <ScreenHeader title={strings.leaderboard.title} subtitle={strings.leaderboard.subtitle} />

      {leaderboard.isPending && <p className="leaderboard-status">{strings.leaderboard.loading}</p>}

      {leaderboard.isError && !leaderboard.data && (
        <ErrorNotice
          message={leaderboard.error.message}
          fallback={strings.leaderboard.error}
          onRetry={() => void leaderboard.refetch()}
          retryLabel={strings.leaderboard.retry}
        />
      )}

      {leaderboard.data && leaderboard.data.neighborhoods.length === 0 && (
        <p className="leaderboard-status">{strings.leaderboard.empty}</p>
      )}

      {leaderboard.data && leaderboard.data.neighborhoods.length > 0 && (
        <ol className="leaderboard-list" aria-live="polite">
          {leaderboard.data.neighborhoods.map((row, index) => {
            const mine = player.data?.neighborhood === row.neighborhood
            return (
              <li key={row.neighborhood} className={cx('leaderboard-row', mine && 'is-yours')}>
                <div className="leaderboard-row-main">
                  <div className="leaderboard-row-identity">
                    <span className="leaderboard-rank">{strings.leaderboard.rank(index + 1)}</span>
                    <div className="min-w-0">
                      <div className="leaderboard-name-row">
                        <h2 className="leaderboard-name">{neighborhoodName(row.neighborhood)}</h2>
                        {mine && <Badge className="leaderboard-yours">{strings.leaderboard.yours}</Badge>}
                      </div>
                      <p className="leaderboard-players">{strings.leaderboard.players(row.playerCount)}</p>
                    </div>
                  </div>
                  <span className="leaderboard-points">{strings.leaderboard.points(row.points)}</span>
                </div>

                {row.topPlayers.length > 0 ? (
                  <ol className="leaderboard-tops">
                    {row.topPlayers.map((top, place) => (
                      <li key={`${top.nickname}-${place}`} className="leaderboard-top">
                        <span className="leaderboard-top-name">
                          <span className="leaderboard-top-place">{place + 1}.</span>
                          {top.nickname}
                        </span>
                        <span className="leaderboard-top-points">{strings.leaderboard.points(top.points)}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="leaderboard-tops leaderboard-tops-empty">{strings.leaderboard.noPlayers}</p>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
