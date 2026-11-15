// The four neighborhoods on the map: their edges as thin lines, and each one's name. Must be
// inside a MapContainer.
//
// The player's own neighborhood is drawn again over the rest in the accent color, and its name
// says "Your neighborhood". Nothing here can be tapped, and it all sits underneath the pins.
//
// The edges come from the copy of the city's boundary that ships with the app
// (shared/tempeBoundary.ts), not the live one the API checks a position against: the two can be a
// day apart, and a line on the map does not decide anything.
import L from 'leaflet'
import { useState } from 'react'
import { Marker, Polyline, useMap, useMapEvents } from 'react-leaflet'
import { NEIGHBORHOODS } from '../../../../shared/constants'
import { TEMPE_BOUNDARY } from '../../../../shared/tempeBoundary'
import type { NeighborhoodId } from '../../../../shared/types'
import { strings } from '../../app/strings'
import { neighborhoodZones, type ZoneLabel } from './neighborhoodZones'

const ZONES = neighborhoodZones(TEMPE_BOUNDARY)
/** Under every pin: report pins start at 0 and the City's at -1000, and a pin's own place on the screen adds a few thousand. */
const UNDER_PINS = -100000

const icons = new Map<string, L.DivIcon>()

/**
 * A name with no size of its own, so it takes no taps. Made once and reused. The HTML holds a
 * name from shared/constants.ts and a line from strings.ts, never text from a player.
 */
function labelIcon(label: ZoneLabel, yours: boolean): L.DivIcon {
  const key = `${label.id}:${yours}`
  const cached = icons.get(key)
  if (cached) return cached
  const name = NEIGHBORHOODS.find((n) => n.id === label.id)?.name ?? label.id
  const classes = ['zone-label', label.hung ? 'zone-label-hung' : '', yours ? 'is-yours' : ''].filter(Boolean).join(' ')
  const icon = L.divIcon({
    className: 'zone-label-anchor',
    html: `<span class="${classes}">${name}${yours ? `<small>${strings.map.yourNeighborhood}</small>` : ''}</span>`,
    iconSize: [0, 0],
  })
  icons.set(key, icon)
  return icon
}

interface NeighborhoodLayerProps {
  /** The player's own neighborhood, drawn in the accent color. Left out where no one player is looking, as on the big-screen board. */
  yours?: NeighborhoodId | null
}

export function NeighborhoodLayer({ yours = null }: NeighborhoodLayerProps) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) })

  return (
    <>
      {/* The colors are the classes' (index.css): a path's own color cannot be a design token. */}
      <Polyline positions={ZONES.borders} className="zone-line" weight={1.5} interactive={false} />
      {yours && (
        <Polyline key={yours} positions={ZONES.outlines[yours]} className="zone-line zone-line-yours" weight={2.5} interactive={false} />
      )}
      {ZONES.labels
        .filter((label) => zoom >= label.minZoom)
        .map((label) => (
          <Marker
            key={label.id}
            position={label.at}
            icon={labelIcon(label, label.id === yours)}
            interactive={false}
            keyboard={false}
            zIndexOffset={UNDER_PINS}
          />
        ))}
    </>
  )
}
