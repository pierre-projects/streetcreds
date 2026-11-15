// Home: Mayor Patch's greeting, where your neighborhood stands, and the quests.
// The interactive map has its own tab (MapScreen); a card at the bottom leads there.
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { NEIGHBORHOODS, POINTS } from '../../../../shared/constants'
import type { LeaderboardRow, NeighborhoodId, Player } from '../../../../shared/types'
import { api } from '../../app/api'
import { CameraIcon, ChevronRightIcon, CoinIcon, DocumentIcon, LockIcon, MapIcon, PieIcon, TagIcon } from '../../app/icons'
import { usePlayer } from '../../app/player'
import { leaderboardKey, MAP_POLL_MS, POLL_MS, reportsKey } from '../../app/queryClient'
import { strings } from '../../app/strings'
import { cx, ErrorNotice, Eyebrow, MayorSays } from '../../app/ui'
import { hasPlace } from './mapReports'

function neighborhoodName(id: NeighborhoodId): string {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id
}

/** Where the player's neighborhood stands, worked out from the leaderboard. */
function standing(rows: LeaderboardRow[], mine: NeighborhoodId) {
  const index = rows.findIndex((row) => row.neighborhood === mine)
  if (index === -1) return null
  const row = rows[index]
  const above = index > 0 ? rows[index - 1] : null
  const below = index < rows.length - 1 ? rows[index + 1] : null
  return {
    rank: index + 1,
    total: rows.length,
    behind: above ? above.points - row.points : 0,
    ahead: below ? row.points - below.points : row.points,
  }
}

function Greeting({ player, rows }: { player: Player; rows: LeaderboardRow[] | undefined }) {
  const home = strings.game.home
  const name = neighborhoodName(player.neighborhood)
  const place = rows ? standing(rows, player.neighborhood) : null
  let line: string | null = null
  if (place && place.rank === 1) line = home.leading(name)
  else if (place) line = home.catchUp(name, Math.ceil((place.behind + 1) / POINTS['report-new']), place.rank - 1)
  return (
    <MayorSays>
      <p className="text-base text-ink">
        {home.welcome(player.nickname)}
        {line ? ` ${line}` : null}
      </p>
    </MayorSays>
  )
}

function RankCard({ player, rows }: { player: Player; rows: LeaderboardRow[] }) {
  const place = standing(rows, player.neighborhood)
  if (!place) return null
  const home = strings.game.home
  return (
    <Link to="/leaderboard" className="rank-card">
      <span className="rank-tile">{place.rank}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg text-ink">{neighborhoodName(player.neighborhood)}</span>
        <span className="mt-0.5 block text-sm text-muted">
          {place.rank === 1 ? home.rankLeading(place.total, place.ahead) : home.rankBehind(place.rank, place.total, place.behind)}
        </span>
      </span>
      <span className="text-accent">
        <ChevronRightIcon />
      </span>
    </Link>
  )
}

function QuestRow({
  to,
  icon,
  tone,
  title,
  body,
  points,
}: {
  to?: string
  icon: ReactNode
  tone: 'quest' | 'accent' | 'locked'
  title: string
  body: string
  points?: number
}) {
  const content = (
    <>
      <span className={cx('quest-icon', tone === 'quest' && 'bg-quest text-on-quest', tone === 'accent' && 'bg-accent text-on-accent', tone === 'locked' && 'bg-raised text-muted')}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx('block font-display text-lg', tone === 'locked' ? 'text-muted' : 'text-ink')}>{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{body}</span>
      </span>
      {points !== undefined ? (
        <span className="quest-points">
          <CoinIcon />
          {strings.game.home.plus(points)}
        </span>
      ) : null}
      {tone === 'locked' ? (
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted">
          <LockIcon />
          {strings.game.home.soon}
        </span>
      ) : null}
    </>
  )
  if (!to) {
    return (
      <div className="quest-row is-locked" aria-disabled="true">
        {content}
      </div>
    )
  }
  return (
    <Link to={to} className="quest-row">
      {content}
    </Link>
  )
}

export function HomeScreen() {
  const player = usePlayer()
  const leaderboard = useQuery({ queryKey: leaderboardKey, queryFn: api.getLeaderboard, refetchInterval: POLL_MS })
  const reports = useQuery({ queryKey: reportsKey, queryFn: api.listReports, refetchInterval: MAP_POLL_MS })
  const home = strings.game.home
  const openReports = (reports.data?.reports ?? []).filter(hasPlace).length

  if (player.isPending) {
    return <p className="text-muted" role="status">{strings.home.loading}</p>
  }
  if (player.isError || !player.data) {
    return (
      <ErrorNotice
        message={player.error?.message}
        fallback={strings.errors.playerLoad}
        onRetry={() => void player.refetch()}
        retryLabel={strings.home.retry}
      />
    )
  }

  const rows = leaderboard.data?.neighborhoods

  return (
    <div className="space-y-5">
      <Greeting player={player.data} rows={rows} />

      {rows ? <RankCard player={player.data} rows={rows} /> : null}
      {leaderboard.isPending ? <p className="text-sm text-muted">{strings.home.rankLoading}</p> : null}
      {leaderboard.isError && !rows ? <p className="text-sm text-muted">{strings.home.rankError}</p> : null}

      <section aria-labelledby="home-quests" className="space-y-3">
        <Eyebrow id="home-quests">{home.questsEyebrow}</Eyebrow>
        <QuestRow to="/report" tone="quest" icon={<CameraIcon />} title={home.reportTitle} body={home.reportBody} points={POINTS['report-new']} />
        <QuestRow to="/council" tone="quest" icon={<DocumentIcon />} title={home.councilTitle} body={home.councilBody} points={POINTS.council} />
        <QuestRow to="/deals" tone="accent" icon={<TagIcon />} title={home.dealsTitle} body={home.dealsBody} />
        <QuestRow tone="locked" icon={<PieIcon />} title={home.budgetTitle} body={home.budgetBody} />
      </section>

      <Link to="/map" className="quest-row">
        <span className="quest-icon bg-raised text-accent">
          <MapIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg text-ink">{home.mapTitle}</span>
          <span className="mt-0.5 block text-sm text-muted">
            {reports.data ? home.mapBody(openReports) : strings.map.loading}
          </span>
        </span>
        <span className="text-muted">
          <ChevronRightIcon />
        </span>
      </Link>
    </div>
  )
}
