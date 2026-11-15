// The street map with a pin for every report it is given. The phone's map screen and the
// big-screen board both use it.
//
// A pin's color is its severity, and it grows with how many times the problem has been reported
// (from two reports up, the number is written on it). Tapping a pin shows the photo and details,
// and a button that copies a report ready to paste into the city's own form.
//
// Pins that would sit on top of each other are drawn as one black pin with the number of reports
// in it. Tapping that zooms in until they come apart.
import L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { MAP_CENTER } from '../../../../shared/constants'
import type { PublicReport, Severity } from '../../../../shared/types'
import { strings } from '../../app/strings'
import { Button } from '../../app/ui'
import { type CityRecord, TEMPE_311_FORM_URL } from './cityRecords'
import { CityRecordsLayer } from './CityRecordsLayer'
import { buildCityReport } from './cityReport'
import { cityFinding } from './cityText'
import { renewPhotoUrl, steadyPhotoUrl } from './photoUrls'
import {
  groupPins,
  type PinGroup,
  type PinnedReport,
  POPUP_WIDTH,
  reportCount,
  SEVERITY_TEXT,
  TAP_PX,
  worstSeverity,
} from './mapReports'

const ZOOM = 14
/** As far in as the map goes. Here every report gets its own pin, however close its neighbors are. */
const MAX_ZOOM = 18

// The same empty values every time, for a map that is given no City records.
const NO_RECORDS: CityRecord[] = []
const NO_MATCHES: ReadonlyMap<string, CityRecord> = new Map()

// Pin colors. These classes are defined in index.css.
const SEVERITY_PIN: Record<Severity, string> = {
  low: 'pin-low',
  medium: 'pin-medium',
  high: 'pin-high',
}
// The ring around a group: the color of the most serious report inside it.
const SEVERITY_GROUP: Record<Severity, string> = {
  low: 'pin-group-low',
  medium: 'pin-group-medium',
  high: 'pin-group-high',
}
// Where pins touch, the more serious one is drawn on top, and a group on top of both.
const SEVERITY_LIFT: Record<Severity, number> = { low: 0, medium: 1000, high: 2000 }
const GROUP_LIFT = 3000

const icons = new Map<string, L.DivIcon>()

/** Escape text that ends up inside a DivIcon's HTML (category labels from our own strings). */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * A Leaflet icon holding one round pin plus an optional category label. The touch area is at
 * least 44 px. Each icon is made once and reused so Leaflet does not rebuild pins on refresh.
 */
function roundIcon(key: string, pinClass: string, size: number, countLabel: string, categoryLabel?: string): L.DivIcon {
  const cached = icons.get(key)
  if (cached) return cached
  const labelHtml = categoryLabel
    ? `<span class="pin-label">${escapeHtml(categoryLabel)}</span>`
    : ''
  const width = Math.max(TAP_PX, size, categoryLabel ? 96 : size)
  const height = Math.max(TAP_PX, size + (categoryLabel ? 22 : 0))
  const icon = L.divIcon({
    className: 'pin-target',
    html: `<span class="pin-stack"><span class="pin ${pinClass}" style="width:${size}px;height:${size}px">${countLabel}</span>${labelHtml}</span>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
  icons.set(key, icon)
  return icon
}

/** One report. Bigger for problems reported more often, up to a limit so one pin cannot cover the map. */
function pinIcon(severity: Severity, count: number, category: string): L.DivIcon {
  const countLabel = count > 99 ? '99+' : count > 1 ? String(count) : ''
  return roundIcon(
    `pin:${severity}:${count}:${category}`,
    SEVERITY_PIN[severity],
    20 + 4 * Math.min(count, 6),
    countLabel,
    category,
  )
}

/** Several reports close together. Bigger for more reports, up to a limit. */
function groupIcon(worst: Severity, reports: number): L.DivIcon {
  const label = reports > 99 ? '99+' : String(reports)
  return roundIcon(`group:${worst}:${reports}`, `pin-group ${SEVERITY_GROUP[worst]}`, 30 + 2 * Math.min(reports, 9), label)
}

/** Zooms in on some reports: far enough to fit them all, and always at least one step closer. */
function zoomInto(map: L.Map, reports: PinnedReport[], center?: L.LatLngExpression): void {
  const bounds = L.latLngBounds(reports.map((report) => [report.lat, report.lng]))
  const fit = map.getBoundsZoom(bounds, false, L.point(TAP_PX * 2, TAP_PX * 2))
  const zoom = Math.min(MAX_ZOOM, Math.max(map.getZoom() + 1, Number.isFinite(fit) ? fit : MAX_ZOOM))
  map.setView(center ?? bounds.getCenter(), zoom)
}

/** Zooms out once, after the first load, if a report is outside the opening view. */
function FitToPins({ pins }: { pins: PinnedReport[] }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || pins.length === 0) return
    done.current = true
    const bounds = L.latLngBounds(pins.map((report) => [report.lat, report.lng]))
    if (!map.getBounds().contains(bounds)) {
      map.fitBounds(bounds, { padding: [TAP_PX, TAP_PX], maxZoom: ZOOM })
    }
  }, [map, pins])
  return null
}

type CopyState = { reportId: string; ok: boolean } | null

interface ReportPopupProps {
  report: PublicReport
  /** The City's own record of this spot, when it has one. */
  cityRecord?: CityRecord
  copy: CopyState
  onCopy: () => void
}

function ReportPopup({ report, cityRecord, copy, onCopy }: ReportPopupProps) {
  const category = strings.categories[report.category]
  const copied = copy?.reportId === report.id ? copy : null
  const note = copied === null ? strings.map.copyHint : copied.ok ? strings.map.copied : strings.map.copyFailed
  return (
    <div className="flex flex-col font-sans text-sm text-ink">
      <img
        src={steadyPhotoUrl(report)}
        alt={strings.map.photoAlt(category)}
        loading="lazy"
        className="h-28 w-full border-b border-ink bg-page object-cover"
        onError={(event) => {
          const fresh = renewPhotoUrl(report)
          if (fresh !== null) event.currentTarget.src = fresh
        }}
      />
      <div className="flex flex-col gap-2 p-4">
        <div>
          <p className="text-base">{category}</p>
          <p className={`text-xs ${SEVERITY_TEXT[report.severity]}`}>
            {strings.map.severity(strings.severities[report.severity])}
          </p>
        </div>
        {/* Cut off after four lines so the popup always fits inside the map. The copied report has it all.
            With a City record there are two lines fewer, which the City's line takes. */}
        <p className={cityRecord ? 'line-clamp-2' : 'line-clamp-4'}>{report.description}</p>
        {cityRecord && <p className="line-clamp-2 text-xs">{strings.city.matchNote(cityFinding(cityRecord))}</p>}
        <p className="text-xs text-muted">{strings.map.reportedTimes(reportCount(report))}</p>
        <Button onClick={onCopy}>{strings.map.copy}</Button>
        {/* Always one link tall, so the popup does not change size when the text does. The link is
            the City's own form, where the copied report gets pasted. */}
        <div className="flex min-h-11 items-center justify-between gap-3">
          <p role="status" className={`text-xs ${copied?.ok === false ? 'text-severity-high' : 'text-muted'}`}>
            {note}
          </p>
          <a className="popup-link shrink-0" href={TEMPE_311_FORM_URL} target="_blank" rel="noopener noreferrer" aria-label={strings.city.tell311Label}>
            {strings.city.openForm}
          </a>
        </div>
      </div>
    </div>
  )
}

interface ReportPinProps {
  report: PinnedReport
  cityRecord?: CityRecord
  copy: CopyState
  onCopy: (report: PublicReport) => void
  onOpenChange?: (reportId: string, open: boolean) => void
  /** True when something outside the map picked this report. The pin then opens its own popup. */
  selected: boolean
}

function ReportPin({ report, cityRecord, copy, onCopy, onOpenChange, selected }: ReportPinProps) {
  const count = reportCount(report)
  // Kept the same between refreshes: a new array would make Leaflet move the pin and its popup again.
  const position = useMemo<[number, number]>(() => [report.lat, report.lng], [report.lat, report.lng])
  const ref = useRef<L.Marker>(null)

  // The pin opens its own popup, here and not from the layer above, so that it also happens when
  // the pin has only just appeared (a group came apart) and React sets it up a second time in
  // development. Opening the popup moves the map until the popup is in view.
  useEffect(() => {
    const marker = ref.current
    if (selected && marker && !marker.isPopupOpen()) marker.openPopup()
  }, [selected])

  // `is-open` marks the pin whose popup is showing. The pin's element belongs to Leaflet, not to React.
  const handlers = useMemo<L.LeafletEventHandlerFnMap>(
    () => ({
      popupopen: (event) => {
        const pin = (event.target as L.Marker).getElement()
        pin?.classList.add('is-open')
        onOpenChange?.(report.id, true)
      },
      popupclose: (event) => {
        const pin = (event.target as L.Marker).getElement()
        pin?.classList.remove('is-open')
        onOpenChange?.(report.id, false)
      },
    }),
    [report.id, onOpenChange],
  )

  return (
    <Marker
      ref={ref}
      position={position}
      icon={pinIcon(report.severity, count, strings.categories[report.category])}
      zIndexOffset={SEVERITY_LIFT[report.severity]}
      title={strings.map.pinLabel(strings.categories[report.category], strings.severities[report.severity], count)}
      eventHandlers={handlers}
    >
      <Popup
        minWidth={POPUP_WIDTH}
        maxWidth={POPUP_WIDTH}
        autoPanPaddingTopLeft={[8, 16]}
        autoPanPaddingBottomRight={[8, 8]}
      >
        <ReportPopup report={report} cityRecord={cityRecord} copy={copy} onCopy={() => onCopy(report)} />
      </Popup>
    </Marker>
  )
}

/** Several reports drawn as one pin. Tapping it, or pressing Enter on it, zooms in on them. */
function GroupPin({ group }: { group: PinGroup }) {
  const map = useMap()
  const position = useMemo<[number, number]>(() => [group.lat, group.lng], [group.lat, group.lng])
  const handlers = useMemo<L.LeafletEventHandlerFnMap>(
    () => ({
      click: () => zoomInto(map, group.reports),
      keypress: (event) => {
        if (event.originalEvent.key === 'Enter') zoomInto(map, group.reports)
      },
    }),
    [map, group.reports],
  )
  return (
    <Marker
      position={position}
      icon={groupIcon(worstSeverity(group.reports), group.reports.length)}
      zIndexOffset={GROUP_LIFT}
      title={strings.map.groupLabel(group.reports.length)}
      eventHandlers={handlers}
    />
  )
}

interface PinLayerProps {
  pins: PinnedReport[]
  /** The City's record of the same spot, by report id. */
  matches: ReadonlyMap<string, CityRecord>
  selectedId: string | null
  onOpenChange?: (reportId: string, open: boolean) => void
}

/** Every pin and group, for the zoom the map is at. Must be inside the MapContainer. */
function PinLayer({ pins, matches, selectedId, onOpenChange }: PinLayerProps) {
  const [copy, setCopy] = useState<CopyState>(null)
  const [zoom, setZoom] = useState<number | null>(null)
  const map = useMapEvents({ zoomend: () => setZoom(map.getZoom()) })
  const currentZoom = zoom ?? map.getZoom()

  const groups = useMemo<PinGroup[]>(
    () =>
      currentZoom >= MAX_ZOOM
        ? pins.map((report) => ({ id: report.id, lat: report.lat, lng: report.lng, reports: [report] }))
        : groupPins(pins, currentZoom),
    [pins, currentZoom],
  )

  const copyReport = useCallback(
    (report: PublicReport) => {
      navigator.clipboard.writeText(buildCityReport(report, matches.get(report.id))).then(
        () => setCopy({ reportId: report.id, ok: true }),
        () => setCopy({ reportId: report.id, ok: false }),
      )
    },
    [matches],
  )

  // Bringing the report that something outside the map picked to a pin of its own. Once it has
  // one, that pin opens its popup itself (see ReportPin).
  //   `seen` is the last pick this effect handled, and `pending` is a pick that has not had its own pin yet.
  //   `asked` stops the same zoom being requested twice while the map is still moving.
  const seen = useRef<string | null>(null)
  const pending = useRef<string | null>(null)
  const asked = useRef('')
  useEffect(() => {
    if (selectedId !== seen.current) {
      seen.current = selectedId
      pending.current = selectedId
    }
    if (selectedId === null) return

    const group = groups.find((candidate) => candidate.reports.some((pin) => pin.id === selectedId))
    const report = group?.reports.find((pin) => pin.id === selectedId)
    if (!group || !report) {
      // It has been filtered away, or is no longer open.
      pending.current = null
      onOpenChange?.(selectedId, false)
      return
    }
    if (group.reports.length === 1) {
      pending.current = null
      return
    }
    if (pending.current !== selectedId) {
      // It had its own pin earlier and has since joined a group, because the map was zoomed out. Let go of it.
      onOpenChange?.(selectedId, false)
      return
    }
    // It is inside a group. Zoom in on it, one request per zoom level, until it has a pin of its own.
    const request = `${selectedId}@${currentZoom}`
    if (asked.current !== request) {
      asked.current = request
      zoomInto(map, group.reports, [report.lat, report.lng])
    }
  }, [selectedId, groups, currentZoom, map, onOpenChange])

  return (
    <>
      {groups.map((group) => {
        const only = group.reports.length === 1 ? group.reports[0] : undefined
        return only ? (
          <ReportPin
            key={only.id}
            report={only}
            cityRecord={matches.get(only.id)}
            copy={copy}
            onCopy={copyReport}
            onOpenChange={onOpenChange}
            selected={only.id === selectedId}
          />
        ) : (
          <GroupPin key={`group:${group.id}`} group={group} />
        )
      })}
    </>
  )
}

interface ReportsMapProps {
  pins: PinnedReport[]
  /** The report whose popup should be open, when something outside the map picks one. */
  selectedId?: string | null
  /** Called when a pin's popup opens (true) or closes (false). Keep it the same function between renders. */
  onOpenChange?: (reportId: string, open: boolean) => void
  /** The City's accessibility records to draw under the reports. Keep the array the same between renders. */
  cityRecords?: CityRecord[]
  /** For reports at a spot the City recorded too: that record, by report id. Keep the map the same between renders. */
  matches?: ReadonlyMap<string, CityRecord>
  /** Extra controls rendered inside the map (must use react-leaflet hooks). */
  children?: ReactNode
  /** Optional map instance callback for recenter and similar HUD controls. */
  onMapReady?: (map: L.Map) => void
}

/** Publishes the Leaflet map once, for HUD controls that live outside MapContainer. */
function MapReady({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap()
  useEffect(() => {
    onMapReady?.(map)
  }, [map, onMapReady])
  return null
}

/** Fills its parent, which must have a height: without one Leaflet draws nothing. */
export function ReportsMap({
  pins,
  selectedId = null,
  onOpenChange,
  cityRecords = NO_RECORDS,
  matches = NO_MATCHES,
  children,
  onMapReady,
}: ReportsMapProps) {
  // The City records that a player's report is at. Their pins are filled in.
  const reportedIds = useMemo(() => new Set([...matches.values()].map((record) => record.id)), [matches])
  return (
    <MapContainer center={[MAP_CENTER.lat, MAP_CENTER.lng]} zoom={ZOOM} maxZoom={MAX_ZOOM} className="h-full w-full">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapReady onMapReady={onMapReady} />
      <FitToPins pins={pins} />
      <CityRecordsLayer records={cityRecords} reportedIds={reportedIds} />
      <PinLayer pins={pins} matches={matches} selectedId={selectedId} onOpenChange={onOpenChange} />
      {children}
    </MapContainer>
  )
}
