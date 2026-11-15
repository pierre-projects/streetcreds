// The City's records on the map: barriers its survey found, and helpful places from its open
// data. Must be inside a MapContainer.
//
// Every record is a small dot, so the whole city shows where they are: black for a barrier,
// white for a helpful place. The dots cannot be tapped. Zoomed in, the records in view also get
// a pin with a letter on it, which opens a popup: a square for a barrier, a diamond for a helpful
// place. Black-and-white and never round, so they are not mistaken for the round, colored pins
// of what players reported, and they sit underneath those.
import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { Link } from 'react-router'
import { POINTS } from '../../../../shared/constants'
import { strings } from '../../app/strings'
import {
  type CityLayer,
  type CityRecord,
  inBox,
  isBarrier,
  LAYER_OF,
  type MapBox,
  RESOURCE_LAYERS,
} from './cityRecords'
import { cityFinding } from './cityText'
import { POPUP_WIDTH, TAP_PX } from './mapReports'
import { tempe311RecordTarget, tempe311Url } from './tempe311'

/** From this zoom in, the records in view are pins that can be tapped. Further out they would cover each other. */
const PIN_ZOOM = 16
/** With more records than this in view the map stays on dots: that many pins would be slow, and too crowded to tap. */
const MAX_PINS = 150
const PIN_PX = 20
/** Under every report pin, whose offsets start at 0. */
const UNDER_REPORTS = -1000

const icons = new Map<string, L.DivIcon>()

/**
 * One pin in a 44 px touch area: a square for a barrier, a diamond for a helpful place. Made once
 * and reused, like the report pins. The HTML holds a letter from strings.ts and class names,
 * never text from a record.
 */
function cityIcon(layer: CityLayer, reported: boolean): L.DivIcon {
  const key = `${layer}:${reported}`
  const cached = icons.get(key)
  if (cached) return cached
  const shape = RESOURCE_LAYERS.includes(layer) ? ' pin-resource' : reported ? ' pin-city-reported' : ''
  const icon = L.divIcon({
    className: 'pin-target',
    html: `<span class="pin pin-city${shape}" style="width:${PIN_PX}px;height:${PIN_PX}px"><span>${strings.city.layerLetter[layer]}</span></span>`,
    iconSize: [TAP_PX, TAP_PX],
    iconAnchor: [TAP_PX / 2, TAP_PX / 2],
    popupAnchor: [0, -PIN_PX / 2],
  })
  icons.set(key, icon)
  return icon
}

/** A color from the design tokens in index.css. The dots are drawn on a canvas, which cannot use a class. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function boxOf(map: L.Map): MapBox {
  const bounds = map.getBounds()
  return { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() }
}

/** Every record as a dot. Drawn straight onto one canvas: a React element per dot would be thousands. */
function CityDots({ records }: { records: CityRecord[] }) {
  const map = useMap()
  useEffect(() => {
    if (records.length === 0) return
    const renderer = L.canvas({ padding: 0.5 })
    const ink = token('--color-ink')
    const surface = token('--color-surface')
    const shared = { renderer, interactive: false, fillOpacity: 1 }
    // A barrier is a black dot with a thin white edge. A helpful place is the reverse, and a little bigger.
    const barrier: L.CircleMarkerOptions = { ...shared, radius: 3, weight: 1, color: surface, fillColor: ink }
    const resource: L.CircleMarkerOptions = { ...shared, radius: 4, weight: 2, color: ink, fillColor: surface }
    const dots = L.layerGroup(
      records.map((record) => L.circleMarker([record.lat, record.lng], isBarrier(record) ? barrier : resource)),
    )
    dots.addTo(map)
    return () => {
      dots.remove()
      renderer.remove()
    }
  }, [map, records])
  return null
}

/** A helpful place: what it is, where, and what the City says about it. */
function ResourcePopup({ record }: { record: CityRecord }) {
  const facts = [
    record.ada === undefined ? null : strings.city.ada(record.ada),
    record.bottleFiller === undefined ? null : strings.city.bottleFiller(record.bottleFiller),
    record.chilled === undefined ? null : strings.city.chilled(record.chilled),
    record.restrooms && record.restrooms.length > 0
      ? strings.city.restroomList(record.restrooms.map((room) => strings.city.restrooms[room]))
      : null,
    record.lit === undefined ? null : strings.city.lit(record.lit),
  ].filter((fact) => fact !== null)

  return (
    <div className="flex flex-col gap-2 p-4 font-sans text-sm text-ink">
      {/* Kept clear of the close button in the corner. */}
      <div className="pr-10">
        <p className="text-xs text-muted">{strings.city.resourceEyebrow}</p>
        <p className="text-base">{record.foodType ? strings.city.foodTypes[record.foodType] : strings.city.kinds[record.kind]}</p>
      </div>
      {record.name && <p className="line-clamp-2">{record.name}</p>}
      {record.where && <p className="text-xs">{record.kind === 'fountain' ? strings.city.park(record.where) : record.where}</p>}
      {record.hours && <p className="text-xs">{strings.city.hours(record.hours)}</p>}
      {facts.length > 0 && <p className="text-xs">{facts.join(' · ')}</p>}
      {/* Cut off so the popup always fits inside the map. */}
      {record.services && <p className="line-clamp-4 text-xs">{record.services}</p>}
      <p className="text-xs text-muted">{strings.city.resourceSource}</p>
    </div>
  )
}

function CityPopup({ record, reported }: { record: CityRecord; reported: boolean }) {
  const facts = [
    record.shelter === undefined ? null : strings.city.shelter(record.shelter),
    record.bench === undefined ? null : strings.city.bench(record.bench),
    record.shade === undefined ? null : strings.city.shade(record.shade),
  ].filter((fact) => fact !== null)

  return (
    <div className="flex flex-col gap-2 p-4 font-sans text-sm text-ink">
      {/* Kept clear of the close button in the corner. */}
      <div className="pr-10">
        <p className="text-xs text-muted">{strings.city.eyebrow}</p>
        <p className="text-base">{strings.city.kinds[record.kind]}</p>
      </div>
      {record.where && <p className="text-xs">{record.where}</p>}
      <p>{cityFinding(record)}</p>
      {facts.length > 0 && <p className="text-xs">{facts.join(' · ')}</p>}
      {record.surfaceTempF !== undefined && <p className="text-xs">{strings.city.surfaceTemp(record.surfaceTempF)}</p>}
      {/* Cut off so the popup always fits inside the map. */}
      {record.cityFix && <p className="line-clamp-2 text-xs">{strings.city.cityFix(record.cityFix)}</p>}
      {reported && <p className="text-xs">{strings.city.reported}</p>}
      <p className="text-xs text-muted">{strings.city.source(record.surveyed)}</p>
      {/* Two ways to act on it: the City's own form, opened on the issue this kind of record is,
          and the game's report quest, which pays points. */}
      <div className="flex flex-wrap justify-between gap-x-3">
        <a className="popup-link" href={tempe311Url(tempe311RecordTarget(record.kind))} target="_blank" rel="noopener noreferrer" aria-label={strings.city.tell311Label}>
          {strings.city.tell311}
        </a>
        <Link className="popup-link" to="/report" aria-label={strings.city.reportHereLabel(POINTS['report-new'])}>
          {strings.city.reportHere(POINTS['report-new'])}
        </Link>
      </div>
    </div>
  )
}

// `is-open` marks the pin whose popup is showing. The pin's element belongs to Leaflet, not to React.
const OPEN_MARK: L.LeafletEventHandlerFnMap = {
  popupopen: (event) => (event.target as L.Marker).getElement()?.classList.add('is-open'),
  popupclose: (event) => (event.target as L.Marker).getElement()?.classList.remove('is-open'),
}

function CityPin({ record, reported }: { record: CityRecord; reported: boolean }) {
  // Kept the same between renders: a new array would make Leaflet move the pin and its popup again.
  const position = useMemo<[number, number]>(() => [record.lat, record.lng], [record.lat, record.lng])
  const barrier = isBarrier(record)
  const kind = strings.city.kinds[record.kind]
  return (
    <Marker
      position={position}
      icon={cityIcon(LAYER_OF[record.kind], reported)}
      zIndexOffset={UNDER_REPORTS}
      title={barrier ? strings.city.pinLabel(kind, record.where) : strings.city.resourcePinLabel(kind, record.name ?? record.where)}
      eventHandlers={OPEN_MARK}
    >
      <Popup minWidth={POPUP_WIDTH} maxWidth={POPUP_WIDTH} autoPanPaddingTopLeft={[8, 16]} autoPanPaddingBottomRight={[8, 8]}>
        {barrier ? <CityPopup record={record} reported={reported} /> : <ResourcePopup record={record} />}
      </Popup>
    </Marker>
  )
}

interface CityRecordsLayerProps {
  /** The records to draw: those in the layers that are switched on. */
  records: CityRecord[]
  /** The ids of records that a player's report is at. Their pins are filled in. */
  reportedIds: ReadonlySet<string>
}

export function CityRecordsLayer({ records, reportedIds }: CityRecordsLayerProps) {
  const map = useMap()
  const [view, setView] = useState(() => ({ zoom: map.getZoom(), box: boxOf(map) }))
  useMapEvents({ moveend: () => setView({ zoom: map.getZoom(), box: boxOf(map) }) })

  const pins = useMemo(() => {
    if (view.zoom < PIN_ZOOM) return []
    const inView = inBox(records, view.box)
    return inView.length <= MAX_PINS ? inView : []
  }, [records, view])

  return (
    <>
      <CityDots records={records} />
      {pins.map((record) => (
        <CityPin key={`${record.kind}:${record.id}`} record={record} reported={reportedIds.has(record.id)} />
      ))}
    </>
  )
}
