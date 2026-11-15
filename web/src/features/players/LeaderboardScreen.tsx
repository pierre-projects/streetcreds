// Two boards behind one switch. Neighborhoods: the four of them, ranked by points, with each
// one's top three players. Players: the ten people with the most points, wherever they joined.
// A player can report anywhere in the city, so the second board ranks people on all they earned.
// It refreshes every few seconds, so a new award shows up without a reload.
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { NEIGHBORHOODS } from '../../../../shared/constants'
import type { NeighborhoodId, TopPlayer } from '../../../../shared/types'
import { api } from '../../app/api'
import { usePlayer } from '../../app/player'
import { leaderboardKey, POLL_MS } from '../../app/queryClient'
import { strings } from '../../app/strings'
import { Badge, ErrorNotice, ScreenHeader, cx } from '../../app/ui'
import { Coins } from './Coins'

function neighborhoodName(id: NeighborhoodId): string {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id
}

type View = 'neighborhoods' | 'players'
const VIEWS: View[] = ['neighborhoods', 'players']

export function LeaderboardScreen() {
  const player = usePlayer()
  const [view, setView] = useState<View>('neighborhoods')
  const leaderboard = useQuery({
    queryKey: leaderboardKey,
    queryFn: api.getLeaderboard,
    refetchInterval: POLL_MS,
  })

  return (
    <div className="leaderboard">
      <ScreenHeader
        title={strings.leaderboard.title}
        subtitle={view === 'players' ? strings.leaderboard.playersSubtitle : strings.leaderboard.subtitle}
      />

      <div className="leaderboard-switch" role="group" aria-label={strings.leaderboard.viewLabel}>
        {VIEWS.map((option) => (
          <button
            key={option}
            type="button"
            className="leaderboard-switch-option"
            aria-pressed={view === option}
            onClick={() => setView(option)}
          >
            {strings.leaderboard.views[option]}
          </button>
        ))}
      </div>

      {leaderboard.isPending && <p className="leaderboard-status">{strings.leaderboard.loading}</p>}

      {leaderboard.isError && !leaderboard.data && (
        <ErrorNotice
          message={leaderboard.error.message}
          fallback={strings.leaderboard.error}
          onRetry={() => void leaderboard.refetch()}
          retryLabel={strings.leaderboard.retry}
        />
      )}

      {view === 'players' && leaderboard.data && <PlayersBoard players={leaderboard.data.players} />}

      {view === 'neighborhoods' && leaderboard.data && leaderboard.data.neighborhoods.length === 0 && (
        <p className="leaderboard-status">{strings.leaderboard.empty}</p>
      )}

      {view === 'neighborhoods' && leaderboard.data && leaderboard.data.neighborhoods.length > 0 && (
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
                  <Coins points={row.points} className="leaderboard-points" />
                </div>

                {row.topPlayers.length > 0 ? (
                  <ol className="leaderboard-tops">
                    {row.topPlayers.map((top, place) => (
                      <li key={`${top.nickname}-${place}`} className="leaderboard-top">
                        <span className="leaderboard-top-name">
                          <span className="leaderboard-top-place">{place + 1}.</span>
                          {top.nickname}
                        </span>
                        <Coins points={top.points} className="leaderboard-top-points" />
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

/**
 * The ten players with the most points. `players` is missing from an API that was deployed
 * before this board existed, which is then shown as an empty board, not an error.
 */
function PlayersBoard({ players }: { players: TopPlayer[] | undefined }) {
  if (!players || players.length === 0) {
    return <p className="leaderboard-status">{strings.leaderboard.playersEmpty}</p>
  }
  return (
    <ol className="leaderboard-row" aria-live="polite">
      {players.map((entry, place) => (
        // Nicknames are not unique, so the place is part of the key.
        <li key={place + '-' + entry.nickname} className="leaderboard-player">
          <span className="leaderboard-player-place">{place + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="leaderboard-player-name">{entry.nickname}</p>
            <p className="leaderboard-player-team">{neighborhoodName(entry.neighborhood)}</p>
          </div>
          <Coins points={entry.points} className="leaderboard-top-points" />
        </li>
      ))}
    </ol>
  )
}
