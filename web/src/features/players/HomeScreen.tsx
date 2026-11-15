// Home: the player's points, where their neighborhood stands, and the two quests.
import { useQuery } from '@tanstack/react-query'
import { NEIGHBORHOODS, POINTS } from '../../../../shared/constants'
import type { NeighborhoodId } from '../../../../shared/types'
import { api } from '../../app/api'
import { LegalFooter } from '../../app/legal/LegalLinks'
import { usePlayer } from '../../app/player'
import { leaderboardKey, POLL_MS } from '../../app/queryClient'
import { explorerAddressUrl } from '../../app/solana'
import { strings } from '../../app/strings'
import { Badge, Card, ErrorNotice, Eyebrow, LinkCard } from '../../app/ui'

function neighborhoodName(id: NeighborhoodId): string {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id
}

function QuestCard({ to, title, body, points }: { to: string; title: string; body: string; points: number }) {
  return (
    <LinkCard to={to}>
      <span>
        <span className="block text-base text-ink">{title}</span>
        <span className="mt-1 block text-sm text-muted">{body}</span>
      </span>
      <Badge>
        {strings.home.reward(points)}
      </Badge>
    </LinkCard>
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
    return <div className="space-y-6"><p className="text-muted">{strings.home.loading}</p><LegalFooter /></div>
  }

  if (player.isError || !player.data) {
    return (
      <div className="space-y-6">
        <ErrorNotice message={player.error?.message} fallback={strings.errors.playerLoad} onRetry={() => void player.refetch()} retryLabel={strings.home.retry} />
        <LegalFooter />
      </div>
    )
  }

  const me = player.data
  const rows = leaderboard.data?.neighborhoods ?? []
  const rankIndex = rows.findIndex((row) => row.neighborhood === me.neighborhood)
  const myRow = rankIndex >= 0 ? rows[rankIndex] : undefined

  return (
    <div className="flex flex-col gap-6">
      <Card tone="dark">
        <Eyebrow tone="dark">{strings.home.pointsLabel}</Eyebrow>
        <p className="points-total mt-1">{me.points}</p>

        <div className="dark-detail mt-4" aria-live="polite">
          {myRow ? (
            <>
              <p className="text-on-ink">
                {strings.home.rank(neighborhoodName(me.neighborhood), rankIndex + 1, rows.length)}
              </p>
              <p className="mt-0.5 text-on-ink/70">{strings.home.neighborhoodPoints(myRow.points)}</p>
            </>
          ) : (
            <p className="text-on-ink/70">{leaderboard.isError ? strings.home.rankError : strings.home.rankLoading}</p>
          )}
        </div>

        {me.walletAddress !== null && (
          <p className="dark-detail mt-4">
            {strings.home.walletNote}{' '}
            <a
              href={explorerAddressUrl(me.walletAddress)}
              target="_blank"
              rel="noreferrer"
              className="wallet-link"
            >
              {strings.home.walletLink}
            </a>
          </p>
        )}
      </Card>

      <section>
        <h2 className="section-title">{strings.home.questsTitle}</h2>
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
      <LegalFooter />
    </div>
  )
}
