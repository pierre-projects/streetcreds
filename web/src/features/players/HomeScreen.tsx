// Home: map-first radar HUD. Brand, CIVIC points and neighborhood live in the shell header;
// this screen is the full-bleed map with Report / Council / Deals dock over the pins.
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
import { type PopupInsets, ReportsMap } from './ReportsMap'

const HOME_ZOOM = 14
/** Left between an open popup and the header or the navigation. */
const POPUP_GAP = 8

/** Tag / deal glyph for the Local Deals dock control. */
function DealsIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="M2 17 12 22 22 17" />
      <path d="M2 12 12 17 22 12" />
    </svg>
  )
}

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

  // This map fills the screen, so the shell's header and navigation float over it. A popup that
  // opens has to end up between the two. They are measured when asked, because their place
  // depends on the phone (the notch, the home bar). The dock is not counted: it steps aside
  // while a popup is open (see `.app-main-radar:has(.leaflet-popup)` in index.css).
  const popupInsets = useCallback((): PopupInsets => {
    const frame = mapRef.current?.getContainer().getBoundingClientRect()
    if (!frame) return { top: POPUP_GAP, bottom: POPUP_GAP }
    const header = document.querySelector('.app-header')?.getBoundingClientRect()
    const nav = document.querySelector('.app-nav-inner')?.getBoundingClientRect()
    return {
      top: Math.max(0, header ? header.bottom - frame.top : 0) + POPUP_GAP,
      bottom: Math.max(0, nav ? frame.bottom - nav.top : 0) + POPUP_GAP,
    }
  }, [])

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
        <ReportsMap pins={pins} onMapReady={onMapReady} popupInsets={popupInsets} />
        <span className="radar-ring" aria-hidden="true" />
        <span className="radar-ring" aria-hidden="true" />
        <span className="radar-ring" aria-hidden="true" />
        <span className="radar-locus" aria-hidden="true" />
      </div>

      <button
        type="button"
        className="radar-dock-btn radar-recenter"
        aria-label={strings.home.recenter}
        onClick={recenter}
      >
        <NavigateIcon />
      </button>

      <div className="radar-dock">
        <div className="radar-dock-inner">
          <div className="flex w-11 shrink-0 flex-col items-center">
            <Link to="/deals" className="radar-dock-btn" aria-label={strings.home.dealsTitle}>
              <DealsIcon />
            </Link>
            <span className="radar-dock-caption" aria-hidden="true">{strings.home.dealsShort}</span>
          </div>
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
