// The four neighborhoods as lines for the map, worked out from the same zone definitions the API
// assigns players with (GAME_ZONES in shared/location.ts) and the city's boundary.
//
// ASU Campus and Downtown Tempe are rectangles. North and South Tempe have no shape of their own:
// they are what is left of the city above and below one line of latitude. So a neighborhood is
// drawn as its edges, not as a filled area: the parts of the city's edge it has, the dividing
// line, and the sides of the rectangles. No polygon is cut up, which would need a library.
import { GAME_ZONES } from '../../../../shared/location'
import type { Boundary } from '../../../../shared/playArea'
import type { NeighborhoodId } from '../../../../shared/types'

/** Latitude, then longitude, as Leaflet takes them. The boundary's own points are the other way round. */
export type MapPoint = [lat: number, lng: number]
export type MapLine = MapPoint[]

interface Box {
  south: number
  north: number
  west: number
  east: number
}

export interface ZoneLabel {
  id: NeighborhoodId
  at: MapPoint
  /** True for a label that hangs under its point (the top edge of a rectangle) instead of sitting on it. */
  hung: boolean
  /** Shown from this zoom in. Further out, a small neighborhood is narrower than its own name. */
  minZoom: number
}

export interface NeighborhoodZones {
  /** Every edge, each drawn once: the city's edge, the dividing line and the two rectangles. */
  borders: MapLine[]
  /** The edges around one neighborhood, for drawing the player's own over the rest. */
  outlines: Record<NeighborhoodId, MapLine[]>
  labels: ZoneLabel[]
}

/** The two rectangles are about 1.5 km wide. Below this zoom their names would run into each other. */
const SMALL_ZONE_LABEL_ZOOM = 13.5

/**
 * The parts of a straight north-south or east-west line that are inside the city, between `from`
 * and `to`. `along: 'lat'` is a line of latitude `at`, and the spans are longitudes; `along: 'lng'`
 * is a line of longitude, and the spans are latitudes. Holes in the city are left out.
 */
export function insideSpans(
  boundary: Boundary,
  along: 'lat' | 'lng',
  at: number,
  from = -Infinity,
  to = Infinity,
): [number, number][] {
  // A boundary point is [lng, lat]. `held` is the coordinate the line keeps the same.
  const held = along === 'lat' ? 1 : 0
  const free = 1 - held
  const cuts: number[] = []
  for (const rings of boundary) {
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[j]
        const b = ring[i]
        if ((a[held] > at) !== (b[held] > at)) {
          cuts.push(a[free] + ((at - a[held]) / (b[held] - a[held])) * (b[free] - a[free]))
        }
      }
    }
  }
  // Going along the line, each crossing of the city's edge goes in or out of the city.
  cuts.sort((x, y) => x - y)
  const spans: [number, number][] = []
  for (let i = 0; i + 1 < cuts.length; i += 2) {
    const start = Math.max(cuts[i], from)
    const end = Math.min(cuts[i + 1], to)
    if (start < end) spans.push([start, end])
  }
  return spans
}

function lineOf(along: 'lat' | 'lng', at: number, [start, end]: [number, number]): MapLine {
  return along === 'lat' ? [[at, start], [at, end]] : [[start, at], [end, at]]
}

/** The four sides of a rectangle, as far as they are inside the city. */
function boxEdges(boundary: Boundary, box: Box): MapLine[] {
  return [
    ...insideSpans(boundary, 'lat', box.north, box.west, box.east).map((span) => lineOf('lat', box.north, span)),
    ...insideSpans(boundary, 'lat', box.south, box.west, box.east).map((span) => lineOf('lat', box.south, span)),
    ...insideSpans(boundary, 'lng', box.west, box.south, box.north).map((span) => lineOf('lng', box.west, span)),
    ...insideSpans(boundary, 'lng', box.east, box.south, box.north).map((span) => lineOf('lng', box.east, span)),
  ]
}

/** The city's edge on one side of a line of latitude: each stretch that stays on that side. */
export function edgeOnSide(boundary: Boundary, split: number, side: 'north' | 'south'): MapLine[] {
  const keep = (lat: number) => (side === 'north' ? lat >= split : lat <= split)
  const lines: MapLine[] = []
  for (const rings of boundary) {
    for (const ring of rings) {
      if (ring.length < 2) continue
      const first = ring[0]
      const last = ring[ring.length - 1]
      // The City repeats a ring's first point at its end. A ring without that is closed here.
      const closed = first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first]
      let run: MapLine | null = null
      for (let i = 0; i < closed.length; i++) {
        const [lng, lat] = closed[i]
        if (i > 0) {
          const [prevLng, prevLat] = closed[i - 1]
          if (keep(prevLat) !== keep(lat)) {
            // The edge crosses the line here. A stretch ends at the crossing, or a new one starts at it.
            const cut: MapPoint = [split, prevLng + ((split - prevLat) / (lat - prevLat)) * (lng - prevLng)]
            if (run) {
              run.push(cut)
              lines.push(run)
              run = null
            } else {
              run = [cut]
            }
          }
        }
        if (keep(lat)) (run ??= []).push([lat, lng])
      }
      if (run && run.length > 1) lines.push(run)
    }
  }
  return lines
}

/** A point inside the city at this latitude: the middle of the widest stretch of city there. */
function middleAt(boundary: Boundary, lat: number): MapPoint | null {
  const spans = insideSpans(boundary, 'lat', lat)
  if (spans.length === 0) return null
  const [west, east] = spans.reduce((widest, span) => (span[1] - span[0] > widest[1] - widest[0] ? span : widest))
  return [lat, (west + east) / 2]
}

export function neighborhoodZones(boundary: Boundary): NeighborhoodZones {
  const { campus, downtown, northStartsAt: split } = GAME_ZONES
  const campusEdges = boxEdges(boundary, campus)
  const downtownEdges = boxEdges(boundary, downtown)
  const dividingLine = insideSpans(boundary, 'lat', split).map((span) => lineOf('lat', split, span))
  const northEdge = edgeOnSide(boundary, split, 'north')
  const southEdge = edgeOnSide(boundary, split, 'south')

  let southmost = Infinity
  let northmost = -Infinity
  for (const rings of boundary) {
    for (const ring of rings) {
      for (const [, lat] of ring) {
        southmost = Math.min(southmost, lat)
        northmost = Math.max(northmost, lat)
      }
    }
  }

  const labels: ZoneLabel[] = [
    { id: 'asu-campus', at: [campus.north, (campus.west + campus.east) / 2], hung: true, minZoom: SMALL_ZONE_LABEL_ZOOM },
    { id: 'downtown-tempe', at: [downtown.north, (downtown.west + downtown.east) / 2], hung: true, minZoom: SMALL_ZONE_LABEL_ZOOM },
  ]
  // North Tempe's name goes halfway up it. South Tempe's goes halfway up the part below both
  // rectangles, so it is never inside one of them.
  const north = middleAt(boundary, (split + northmost) / 2)
  if (north) labels.push({ id: 'north-tempe', at: north, hung: false, minZoom: 0 })
  const south = middleAt(boundary, (southmost + Math.min(split, campus.south, downtown.south)) / 2)
  if (south) labels.push({ id: 'south-tempe', at: south, hung: false, minZoom: 0 })

  return {
    borders: [...northEdge, ...southEdge, ...dividingLine, ...campusEdges, ...downtownEdges],
    outlines: {
      'asu-campus': campusEdges,
      'downtown-tempe': downtownEdges,
      'north-tempe': [...northEdge, ...dividingLine],
      // South Tempe goes around both rectangles, so their sides are its edges too.
      'south-tempe': [...southEdge, ...dividingLine, ...campusEdges, ...downtownEdges],
    },
    labels,
  }
}
