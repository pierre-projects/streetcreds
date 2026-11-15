// Home: the player's points, where their neighborhood stands, and the two quests.
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { NEIGHBORHOODS, POINTS } from '../../../../shared/constants'
import type { NeighborhoodId } from '../../../../shared/types'
import { api } from '../../app/api'
import { usePlayer } from '../../app/player'
import { leaderboardKey, POLL_MS } from '../../app/queryClient'
import { strings } from '../../app/strings'

function neighborhoodName(id: NeighborhoodId): string {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id
}

function QuestCard({ to, title, body, points }: { to: string; title: string; body: string; points: number }) {
  return (
    <Link to={to} className="flex min-h-11 items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
      <span>
        <span className="block text-base font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-sm text-muted">{body}</span>
      </span>
      <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-sm font-semibold tabular-nums text-on-accent">
        {strings.home.reward(points)}
      </span>
    </Link>
  )
}

export function HomeScreen() {
  const player = usePlayer()
  const leaderboard = useQuery({
    queryKey: leaderboardKey,
    queryFn: api.getLeaderboard,
    refetchInterval: POLL_MS,
  })

  if (player.isPending) {
    return <p className="text-muted">{strings.home.loading}</p>
  }

  if (player.isError || !player.data) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-5">
        <p role="alert" className="text-base text-severity-high">
          {player.error?.message ?? strings.errors.playerLoad}
        </p>
        <button
          type="button"
          onClick={() => void player.refetch()}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl border border-line px-4 font-semibold text-accent"
        >
          {strings.home.retry}
        </button>
      </section>
    )
  }

  const me = player.data
  const rows = leaderboard.data?.neighborhoods ?? []
  const rankIndex = rows.findIndex((row) => row.neighborhood === me.neighborhood)
  const myRow = rankIndex >= 0 ? rows[rankIndex] : undefined

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm font-medium text-muted">{strings.home.pointsLabel}</p>
        <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight text-ink">{me.points}</p>

        <div className="mt-4 border-t border-line pt-4 text-sm" aria-live="polite">
          {myRow ? (
            <>
              <p className="font-semibold text-ink">
                {strings.home.rank(neighborhoodName(me.neighborhood), rankIndex + 1, rows.length)}
              </p>
              <p className="mt-0.5 text-muted">{strings.home.neighborhoodPoints(myRow.points)}</p>
            </>
          ) : (
            <p className="text-muted">{leaderboard.isError ? strings.home.rankError : strings.home.rankLoading}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">{strings.home.questsTitle}</h2>
        <div className="mt-3 grid gap-3">
          <QuestCard
            to="/report"
            title={strings.home.reportTitle}
            body={strings.home.reportBody}
            points={POINTS['report-new']}
          />
          <QuestCard
            to="/council"
            title={strings.home.councilTitle}
            body={strings.home.councilBody}
            points={POINTS.council}
          />
        </div>
      </section>
    </div>
  )
}
