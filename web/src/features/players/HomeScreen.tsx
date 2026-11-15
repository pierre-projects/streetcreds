// Home: map-first radar HUD. Brand, CIVIC points and neighborhood live in the shell header;
// this screen is the full-bleed map with Report / Council dock over the pins.
import { useQuery } from '@tanstack/react-query'
import type L from 'leaflet'
import { useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router'
import { MAP_CENTER } from '../../../../shared/constants'
import { api } from '../../app/api'
import { CouncilIcon, NavigateIcon, PlusIcon } from '../../app/icons'
import { MAP_POLL_MS, reportsKey } from '../../app/queryClient'
import { strings } from '../../app/strings'
import { ErrorNotice } from '../../app/ui'
import { hasPlace } from './mapReports'
import { ReportsMap } from './ReportsMap'

const HOME_ZOOM = 14

export function HomeScreen() {
  const mapRef = useRef<L.Map | null>(null)
  const reports = useQuery({
    queryKey: reportsKey,
    queryFn: api.listReports,
    refetchInterval: MAP_POLL_MS,
  })

  const pins = useMemo(() => (reports.data?.reports ?? []).filter(hasPlace), [reports.data])

  const onMapReady = useCallback((map: L.Map) => {
    mapRef.current = map
  }, [])

  function recenter() {
    mapRef.current?.setView([MAP_CENTER.lat, MAP_CENTER.lng], HOME_ZOOM, { animate: true })
  }

  if (reports.isError && !reports.data) {
    return (
      <div className="flex h-full flex-col justify-end gap-3 p-4 pb-28">
        <ErrorNotice message={reports.error.message} fallback={strings.map.error} onRetry={() => void reports.refetch()} retryLabel={strings.map.retry} />
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-0 w-full flex-1">
      <div className="map-frame-radar absolute inset-0" aria-label={strings.home.mapLabel}>
        <ReportsMap pins={pins} onMapReady={onMapReady} />
        <span className="radar-ring" aria-hidden="true" />
        <span className="radar-ring" aria-hidden="true" />
        <span className="radar-ring" aria-hidden="true" />
        <span className="radar-locus" aria-hidden="true" />
      </div>

      <div className="radar-dock">
        <div className="radar-dock-inner">
          <button type="button" className="radar-dock-btn" aria-label={strings.home.recenter} onClick={recenter}>
            <NavigateIcon />
          </button>
          <Link to="/report" className="radar-dock-primary">
            <span>{strings.home.reportCta}</span>
            <span className="radar-dock-plus" aria-hidden="true"><PlusIcon /></span>
          </Link>
          <div className="flex w-11 shrink-0 flex-col items-center">
            <Link to="/council" className="radar-dock-btn" aria-label={strings.home.councilTitle}>
              <CouncilIcon />
            </Link>
            <span className="radar-dock-caption" aria-hidden="true">{strings.home.councilShort}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
