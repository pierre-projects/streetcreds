// The phone's map screen: the severity switches (which are also the color key) and the count
// above the map, and a line about the pins below it. The map itself is ReportsMap, which the
// big-screen board uses too.
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../app/api'
import { MAP_POLL_MS, reportsKey } from '../../app/queryClient'
import { strings } from '../../app/strings'
import { Card, ErrorNotice, ScreenHeader } from '../../app/ui'
import { applyFilter, hasPlace, NO_FILTER, type ReportFilter } from './mapReports'
import { ReportFilters } from './ReportFilters'
import { ReportsMap } from './ReportsMap'

export function MapScreen() {
  const [filter, setFilter] = useState<ReportFilter>(NO_FILTER)
  const reports = useQuery({
    queryKey: reportsKey,
    queryFn: api.listReports,
    refetchInterval: MAP_POLL_MS,
  })

  // Only reports with a place can be drawn. The API sends open reports only, which all have one.
  const pins = useMemo(() => (reports.data?.reports ?? []).filter(hasPlace), [reports.data])
  const visible = useMemo(() => applyFilter(pins, filter), [pins, filter])

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={strings.map.title} subtitle={strings.map.subtitle} />

      {/* Above the map, so it is on screen without scrolling. Once there are reports, the filters take this place. */}
      {pins.length === 0 && (
        <div aria-live="polite">
          {reports.isPending && <p className="text-sm text-muted">{strings.map.loading}</p>}

          {reports.isError && !reports.data && (
            <ErrorNotice message={reports.error.message} fallback={strings.map.error} onRetry={() => void reports.refetch()} retryLabel={strings.map.retry} />
          )}

          {reports.data && <p className="text-sm text-ink">{strings.map.empty}</p>}
        </div>
      )}

      {/* The short form. The type menu and the numbers are left to the big-screen board: here they would push the map off the screen. */}
      {pins.length > 0 && <ReportFilters pins={pins} filter={filter} onChange={setFilter} compact />}

      {/* `isolate` keeps Leaflet's own layers underneath the app's header and navigation. */}
      <div className="map-frame">
        <ReportsMap pins={visible} />
      </div>

      <Card>
        <p className="text-sm text-muted">{strings.map.legend}</p>
      </Card>
    </div>
  )
}
