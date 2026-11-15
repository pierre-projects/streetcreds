// The big-screen view: the neighborhood standings across the top, the map of open reports, and
// beside it a list of every open report, most serious first, with filters. Nobody has to join to
// see it, so it can stay up on a projector while people play on their phones, and the city can
// use it to see where its street problems are. On a narrow screen the same parts stack.
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NEIGHBORHOODS } from '../../../../shared/constants'
import type { NeighborhoodId } from '../../../../shared/types'
import { api } from '../../app/api'
import { ChevronIcon } from '../../app/icons'
import { LegalFooter } from '../../app/legal/LegalLinks'
import { prefersReducedMotion } from '../../app/motion'
import { getStoredPlayerId } from '../../app/player'
import { leaderboardKey, MAP_POLL_MS, POLL_MS, reportsKey } from '../../app/queryClient'
import { strings } from '../../app/strings'
import { Badge, Button, ButtonLink, cx, ErrorNotice, LogoMark } from '../../app/ui'
import {
  ageMinutes,
  applyFilter,
  byMostReported,
  byNewest,
  bySeriousness,
  hasPlace,
  NO_FILTER,
  type PinnedReport,
  reportCount,
  reportedAt,
  type ReportFilter,
  SEVERITY_DOT,
  SEVERITY_TEXT,
} from './mapReports'
import { renewPhotoUrl, steadyPhotoUrl } from './photoUrls'
import { ReportFilters } from './ReportFilters'
import { ReportsMap } from './ReportsMap'
import { CityLayerKeys } from './CityLayerKeys'
import { CityLayerToggles } from './CityLayerToggles'
import { ALL_LAYERS, type CityLayers, type CityRecord, inLayers, LAYER_OF, matchReports } from './cityRecords'
import { useCityRecords } from './useCityRecords'

/** How many rows the list shows at first, and how many each "Show more" adds. */
const PAGE = 20
/** A report this young, in minutes, is marked "New" in the list. */
const NEW_FOR_MINUTES = 10

// The orders the list can be put in. The map always keeps the first one, so its groups stay put.
const SORTS = {
  serious: bySeriousness,
  newest: byNewest,
  most: byMostReported,
}
type SortId = keyof typeof SORTS
const SORT_IDS: SortId[] = ['serious', 'newest', 'most']

function neighborhoodName(id: NeighborhoodId): string {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id
}

/** The day a report was made, short enough for a list row: "Nov 14". */
function shortDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** When a report was made, for its row: how long ago for the last day, and the date before that. */
function whenMade(report: PinnedReport, now: number): string {
  const minutes = ageMinutes(report, now)
  if (minutes === null || minutes >= 24 * 60) return shortDay(reportedAt(report))
  if (minutes < 1) return strings.board.justNow
  if (minutes < 60) return strings.board.minutesAgo(minutes)
  return strings.board.hoursAgo(Math.floor(minutes / 60))
}

/** The time now, refreshed every so often, so "12 min ago" and "New" stay true on a screen left open. */
function useNow(everyMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), everyMs)
    return () => clearInterval(timer)
  }, [everyMs])
  return now
}

interface ReportRowProps {
  report: PinnedReport
  selected: boolean
  /** The City's own record of this spot, if its survey has one. */
  cityRecord: CityRecord | undefined
  now: number
  onPick: (reportId: string) => void
}

/**
 * One report in the list: its photo, what and how serious it is, when it was made, and what it
 * says. The colored edge is the severity, which is also written out. Picking it opens it on the map.
 */
function ReportRow({ report, selected, cityRecord, now, onPick }: ReportRowProps) {
  const count = reportCount(report)
  const minutes = ageMinutes(report, now)
  return (
    <button type="button" className="board-row" aria-pressed={selected} onClick={() => onPick(report.id)}>
      <span className={`w-1.5 shrink-0 ${SEVERITY_DOT[report.severity]}`} aria-hidden="true" />
      {/* Decoration here: the words beside it say what the report is. The popup on the map has the described photo. */}
      <img
        src={steadyPhotoUrl(report)}
        alt=""
        loading="lazy"
        decoding="async"
        className="my-3 size-16 shrink-0 rounded-control border border-ink/15 bg-page object-cover"
        onError={(event) => {
          const fresh = renewPhotoUrl(report)
          if (fresh !== null) event.currentTarget.src = fresh
        }}
      />
      <span className="min-w-0 flex-1 py-3 pr-3">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-base text-ink">{strings.categories[report.category]}</span>
          <span className="shrink-0 font-mono text-xs text-muted">{whenMade(report, now)}</span>
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className={SEVERITY_TEXT[report.severity]}>
            {strings.map.severity(strings.severities[report.severity])}
          </span>
          {count > 1 && <span className="board-chip">{strings.map.reportedTimes(count)}</span>}
          {minutes !== null && minutes < NEW_FOR_MINUTES && (
            <span className="board-chip bg-accent text-on-accent">{strings.board.newTag}</span>
          )}
        </span>
        {/* Cut to two lines to keep the list quick to scan. The picked report shows all of it. */}
        <span className={cx('mt-1 text-sm text-ink', selected ? 'block' : 'line-clamp-2')}>{report.description}</span>
        {cityRecord && (
          <span className="mt-2 flex items-center gap-2 text-xs text-muted">
            <span className="filter-square" aria-hidden="true">
              <span>{strings.city.layerLetter[LAYER_OF[cityRecord.kind]]}</span>
            </span>
            {strings.board.inCitySurvey}
          </span>
        )}
      </span>
    </button>
  )
}

export function BoardScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<ReportFilter>(NO_FILTER)
  const [sort, setSort] = useState<SortId>('serious')
  const now = useNow(30_000)
  // The City's own accessibility records start switched on here: a big screen has room for both.
  const [layers, setLayers] = useState<CityLayers>(ALL_LAYERS)
  const city = useCityRecords()
  // The City's panel on the map starts folded: a row of letter keys in the corner. Its arrow opens the long form.
  const [cityOpen, setCityOpen] = useState(false)
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
  const cityShown = useMemo(() => inLayers(city.records, layers), [city.records, layers])
  const matches = useMemo(() => matchReports(pins, city.records), [pins, city.records])
  const topPoints = Math.max(1, ...(leaderboard.data?.neighborhoods ?? []).map((row) => row.points))

  // The list in the order the reader chose. `visible` is already most serious first.
  const sorted = useMemo(() => (sort === 'serious' ? visible : [...visible].sort(SORTS[sort])), [visible, sort])
  // The list shows the first rows only. If the selected report is further down, it shows that far.
  const selectedIndex = sorted.findIndex((report) => report.id === selectedId)
  const listed = sorted.slice(0, Math.max(limit, selectedIndex + 1))
  const left = sorted.length - listed.length

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
    mapRef.current?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  // The switches for the City's records, with how many reports are at a spot the City recorded
  // too. Drawn in one of two places, depending on the width of the screen, each under its own title.
  const cityControls = (
    <>
      <CityLayerToggles records={city.records} status={city.status} layers={layers} onChange={setLayers} />
      {city.copiedAt && (
        <p className="text-xs text-muted">
          {matches.size > 0 && `${strings.city.matched(matches.size)} `}
          {strings.city.credit(city.copiedAt)}
        </p>
      )}
    </>
  )

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
                  <div className="mt-1 h-2 overflow-hidden rounded-pill border border-ink/15 bg-surface" aria-hidden="true">
                    <div className="h-full rounded-pill bg-accent" style={{ width: `${(row.points / topPoints) * 100}%` }} />
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
          <ReportsMap pins={visible} selectedId={selectedId} onOpenChange={onOpenChange} cityRecords={cityShown} matches={matches} />
          {/* Docked in the map's bottom left corner, dark and see-through, so the map stays the picture
              and the list beside it keeps its room. Folded, it is one row of letter keys, each a
              switch. The arrow opens the long form, with the names, the numbers and the source. */}
          <div className="board-city-dock">
            <div className="flex items-center">
              {cityOpen ? (
                <h3 className="min-w-0 flex-1 truncate px-4 text-sm text-ink">{strings.city.title}</h3>
              ) : (
                <CityLayerKeys records={city.records} status={city.status} layers={layers} onChange={setLayers} />
              )}
              <button
                type="button"
                className="board-city-fold"
                aria-expanded={cityOpen}
                aria-controls="board-city-panel"
                aria-label={cityOpen ? strings.city.hideDetails : strings.city.showDetails}
                title={cityOpen ? strings.city.hideDetails : strings.city.showDetails}
                onClick={() => setCityOpen((open) => !open)}
              >
                <ChevronIcon />
              </button>
            </div>
            {cityOpen && <div id="board-city-panel" className="board-city-panel">{cityControls}</div>}
          </div>
        </section>

        <aside className="board-side" aria-labelledby="board-reports">
          <div className="board-side-head">
            <h2 id="board-reports" className="section-title">{strings.board.reportsTitle}</h2>

            <div aria-live="polite">
              {reports.isPending && <p className="text-sm text-muted">{strings.map.loading}</p>}

              {reports.isError && !reports.data && (
                <ErrorNotice message={reports.error.message} fallback={strings.map.error} onRetry={() => void reports.refetch()} retryLabel={strings.map.retry} />
              )}

              {reports.data && pins.length === 0 && <p className="text-sm text-ink">{strings.map.empty}</p>}
            </div>

            {pins.length > 0 && (
              <ReportFilters
                pins={pins}
                filter={filter}
                onChange={setFilter}
                beside={
                  // The order of the list, on the same row as the type menu so the list keeps its room.
                  <label className="flex min-w-0 flex-1">
                    <span className="sr-only">{strings.board.sortLabel}</span>
                    <select
                      className="filter-select"
                      value={sort}
                      onChange={(event) => setSort(SORT_IDS.find((id) => id === event.target.value) ?? 'serious')}
                    >
                      {SORT_IDS.map((id) => (
                        <option key={id} value={id}>{strings.board.sorts[id]}</option>
                      ))}
                    </select>
                  </label>
                }
              />
            )}

            {/* On a narrow screen the City's switches go here. On a wide one they sit on the map. */}
            <div className="board-city-inline">
              <div className="flex flex-col gap-2">
                <h3 className="text-sm text-ink">{strings.city.title}</h3>
                {cityControls}
              </div>
            </div>
          </div>

          {listed.length > 0 && (
            <div ref={listRef} className="board-list">
              {/* Inside the list, so it scrolls away and the rows get the room. */}
              <p className="mb-2 text-xs text-muted">{strings.board.reportsHint}</p>
              <ul className="flex flex-col gap-2">
                {listed.map((report) => (
                  <li
                    key={report.id}
                    ref={(row) => {
                      if (row) rows.current.set(report.id, row)
                      else rows.current.delete(report.id)
                    }}
                  >
                    <ReportRow
                      report={report}
                      selected={report.id === selectedId}
                      cityRecord={matches.get(report.id)}
                      now={now}
                      onPick={pick}
                    />
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
      <LegalFooter />
    </div>
  )
}
