// The big-screen view: the neighborhood standings across the top, the map of open reports, and
// beside it a list of every open report, most serious first, with filters. Nobody has to join to
// see it, so it can stay up on a projector while people play on their phones, and the city can
// use it to see where its street problems are. On a narrow screen the same parts stack.
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NEIGHBORHOODS } from '../../../../shared/constants'
import type { NeighborhoodId } from '../../../../shared/types'
import { api } from '../../app/api'
import { getStoredPlayerId } from '../../app/player'
import { leaderboardKey, MAP_POLL_MS, POLL_MS, reportsKey } from '../../app/queryClient'
import { strings } from '../../app/strings'
import { Badge, Button, ButtonLink, ErrorNotice, LogoMark } from '../../app/ui'
import {
  applyFilter,
  bySeriousness,
  hasPlace,
  NO_FILTER,
  reportCount,
  reportedAt,
  type ReportFilter,
  SEVERITY_DOT,
} from './mapReports'
import { ReportFilters } from './ReportFilters'
import { ReportsMap } from './ReportsMap'

/** How many rows the list shows at first, and how many each "Show more" adds. */
const PAGE = 20

function neighborhoodName(id: NeighborhoodId): string {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id
}

/** The day a report was made, short enough for a list row: "Nov 14". */
function shortDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function BoardScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<ReportFilter>(NO_FILTER)
  const [limit, setLimit] = useState(PAGE)
  const mapRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const rows = useRef(new Map<string, HTMLElement>())

  const reports = useQuery({
    queryKey: reportsKey,
    queryFn: api.listReports,
    refetchInterval: MAP_POLL_MS,
  })
  const leaderboard = useQuery({
    queryKey: leaderboardKey,
    queryFn: api.getLeaderboard,
    refetchInterval: POLL_MS,
  })

  // Only reports with a place can be drawn. The API sends open reports only, which all have one.
  const pins = useMemo(() => (reports.data?.reports ?? []).filter(hasPlace).sort(bySeriousness), [reports.data])
  const visible = useMemo(() => applyFilter(pins, filter), [pins, filter])
  const topPoints = Math.max(1, ...(leaderboard.data?.neighborhoods ?? []).map((row) => row.points))

  // The list shows the first rows only. If the selected report is further down, it shows that far.
  const selectedIndex = visible.findIndex((report) => report.id === selectedId)
  const listed = visible.slice(0, Math.max(limit, selectedIndex + 1))
  const left = visible.length - listed.length

  // The map says which popup opened or closed; the list follows it.
  const onOpenChange = useCallback((reportId: string, open: boolean) => {
    setSelectedId((current) => (open ? reportId : current === reportId ? null : current))
  }, [])

  // Keep the selected report's row in view. Only the list is scrolled, never the page: on a
  // narrow screen the list does not scroll by itself, so the reader stays where they were.
  useEffect(() => {
    const row = selectedId === null ? undefined : rows.current.get(selectedId)
    const list = listRef.current
    if (!row || !list) return
    const rowBox = row.getBoundingClientRect()
    const listBox = list.getBoundingClientRect()
    if (rowBox.top < listBox.top || rowBox.bottom > listBox.bottom) {
      list.scrollTop += rowBox.top - listBox.top - 16
    }
  }, [selectedId])

  function pick(reportId: string) {
    setSelectedId(reportId)
    // On a narrow screen the map is above the list, so bring it back into view.
    mapRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  return (
    <div className="board">
      <header className="board-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="app-brand"><LogoMark />{strings.appName}</span>
          <h1 className="section-title truncate">{strings.board.title}</h1>
          <Badge>{strings.board.live}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted">{strings.board.playAt}</p>
          <div className="w-28 shrink-0">
            <ButtonLink to={getStoredPlayerId() === null ? '/join' : '/home'}>{strings.board.play}</ButtonLink>
          </div>
        </div>
      </header>

      <section className="board-scores" aria-labelledby="board-standings">
        <h2 id="board-standings" className="sr-only">{strings.board.standingsTitle}</h2>
        <div aria-live="polite">
          {leaderboard.isPending && <p className="text-sm text-muted">{strings.leaderboard.loading}</p>}

          {leaderboard.isError && !leaderboard.data && (
            <ErrorNotice message={leaderboard.error.message} fallback={strings.leaderboard.error} onRetry={() => void leaderboard.refetch()} retryLabel={strings.leaderboard.retry} />
          )}

          {leaderboard.data && (
            <ol className="board-scores-list">
              {leaderboard.data.neighborhoods.map((row, index) => (
                <li key={row.neighborhood} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-base text-ink">
                      <span className="mr-2 font-mono tabular-nums text-muted">{strings.leaderboard.rank(index + 1)}</span>
                      {neighborhoodName(row.neighborhood)}
                    </span>
                    <span className="shrink-0 font-mono text-base tabular-nums text-ink">
                      {strings.leaderboard.points(row.points)}
                    </span>
                  </div>
                  {/* How far this neighborhood is behind the leader. Decoration: the numbers say the same. */}
                  <div className="mt-1 h-2 border border-ink bg-surface" aria-hidden="true">
                    <div className="h-full bg-accent" style={{ width: `${(row.points / topPoints) * 100}%` }} />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">
                    {strings.leaderboard.players(row.playerCount)}
                    {row.topPlayers[0] && ` · ${strings.board.topPlayer(row.topPlayers[0].nickname)}`}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <div className="board-body">
        <section ref={mapRef} className="board-map" aria-label={strings.board.mapLabel}>
          <ReportsMap pins={visible} selectedId={selectedId} onOpenChange={onOpenChange} />
        </section>

        <aside className="board-side" aria-labelledby="board-reports">
          <div className="board-side-head">
            <div>
              <h2 id="board-reports" className="section-title">{strings.board.reportsTitle}</h2>
              <p className="mt-1 text-sm text-muted">{strings.board.reportsHint}</p>
            </div>

            <div aria-live="polite">
              {reports.isPending && <p className="text-sm text-muted">{strings.map.loading}</p>}

              {reports.isError && !reports.data && (
                <ErrorNotice message={reports.error.message} fallback={strings.map.error} onRetry={() => void reports.refetch()} retryLabel={strings.map.retry} />
              )}

              {reports.data && pins.length === 0 && <p className="text-sm text-ink">{strings.map.empty}</p>}
            </div>

            {pins.length > 0 && <ReportFilters pins={pins} filter={filter} onChange={setFilter} />}
          </div>

          {listed.length > 0 && (
            <div ref={listRef} className="board-list">
              <ul className="flex flex-col gap-2">
                {listed.map((report) => (
                  <li
                    key={report.id}
                    ref={(row) => {
                      if (row) rows.current.set(report.id, row)
                      else rows.current.delete(report.id)
                    }}
                  >
                    <button
                      type="button"
                      className="board-row"
                      aria-pressed={report.id === selectedId}
                      onClick={() => pick(report.id)}
                    >
                      <span
                        className={`mt-1 inline-block size-4 shrink-0 rounded-full border-2 border-ink ${SEVERITY_DOT[report.severity]}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-base text-ink">{strings.categories[report.category]}</span>
                          <span className="shrink-0 font-mono text-xs text-muted">{shortDay(reportedAt(report))}</span>
                        </span>
                        <span className="block text-xs text-muted">
                          {strings.map.severity(strings.severities[report.severity])}
                          {' · '}
                          {strings.map.reportedTimes(reportCount(report))}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-sm text-ink">{report.description}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {left > 0 && (
                <Button variant="secondary" className="mt-3" onClick={() => setLimit(listed.length + PAGE)}>
                  {strings.board.showMore(Math.min(PAGE, left))}
                </Button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
