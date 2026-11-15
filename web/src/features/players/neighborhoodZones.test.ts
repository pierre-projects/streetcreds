import { describe, expect, it } from 'vitest'
import { NEIGHBORHOODS } from '../../../../shared/constants'
import { assignGameNeighborhood, GAME_ZONES, pointInBoundary } from '../../../../shared/location'
import type { Boundary } from '../../../../shared/playArea'
import { TEMPE_BOUNDARY } from '../../../../shared/tempeBoundary'
import { edgeOnSide, insideSpans, neighborhoodZones } from './neighborhoodZones'

// A square city from 0 to 10 each way, with a square hole from 4 to 6 in the middle. Points are [lng, lat].
const SQUARE: Boundary = [
  [
    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
    [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
  ],
]

const inCity = (lat: number, lng: number) => TEMPE_BOUNDARY.some((rings) => pointInBoundary({ lat, lng }, rings))

describe('insideSpans', () => {
  it('gives the whole width of the city where nothing is in the way', () => {
    expect(insideSpans(SQUARE, 'lat', 2)).toEqual([[0, 10]])
    expect(insideSpans(SQUARE, 'lng', 8)).toEqual([[0, 10]])
  })

  it('leaves out a hole', () => {
    expect(insideSpans(SQUARE, 'lat', 5)).toEqual([[0, 4], [6, 10]])
  })

  it('keeps to the stretch it is asked for', () => {
    expect(insideSpans(SQUARE, 'lat', 5, 3, 7)).toEqual([[3, 4], [6, 7]])
    expect(insideSpans(SQUARE, 'lat', 2, 12, 14)).toEqual([])
  })

  it('is empty for a line that misses the city', () => {
    expect(insideSpans(SQUARE, 'lat', 11)).toEqual([])
  })
})

describe('edgeOnSide', () => {
  it('cuts the edge of the city at the line and keeps one side', () => {
    const north = edgeOnSide(SQUARE, 7, 'north')
    const points = north.flat()
    expect(points.length).toBeGreaterThan(0)
    expect(points.every(([lat]) => lat >= 7)).toBe(true)
    // The outer ring crosses the line twice, at its west and east sides.
    expect(points).toContainEqual([7, 0])
    expect(points).toContainEqual([7, 10])
    // The hole is all south of the line.
    expect(points.some(([lat, lng]) => lat < 10 && lng > 0 && lng < 10)).toBe(false)
  })

  it('keeps a hole with the side it is on', () => {
    const south = edgeOnSide(SQUARE, 7, 'south')
    expect(south.flat()).toContainEqual([4, 4])
    expect(south.flat().every(([lat]) => lat <= 7)).toBe(true)
  })

  it('closes a ring that does not repeat its first point', () => {
    const open: Boundary = [[[[0, 0], [10, 0], [10, 10], [0, 10]]]]
    // The west side, from [0, 10] back to [0, 0], is only there once the ring is closed.
    expect(edgeOnSide(open, 5, 'south').flat()).toContainEqual([5, 0])
  })
})

describe('neighborhoodZones, for Tempe', () => {
  const zones = neighborhoodZones(TEMPE_BOUNDARY)

  it('has a name on the map for every neighborhood', () => {
    expect(zones.labels.map((label) => label.id).sort()).toEqual(NEIGHBORHOODS.map((n) => n.id).sort())
  })

  it('puts each name where the API assigns that neighborhood', () => {
    for (const label of zones.labels) {
      const [lat, lng] = label.at
      expect(inCity(lat, lng)).toBe(true)
      // A hung label is on the top edge of its rectangle, which is still that neighborhood.
      expect(assignGameNeighborhood({ lat, lng })).toBe(label.id)
    }
  })

  it('draws both rectangles whole: they are inside the city', () => {
    for (const box of [GAME_ZONES.campus, GAME_ZONES.downtown]) {
      expect(insideSpans(TEMPE_BOUNDARY, 'lat', box.north, box.west, box.east)).toEqual([[box.west, box.east]])
      expect(insideSpans(TEMPE_BOUNDARY, 'lat', box.south, box.west, box.east)).toEqual([[box.west, box.east]])
      expect(insideSpans(TEMPE_BOUNDARY, 'lng', box.west, box.south, box.north)).toEqual([[box.south, box.north]])
      expect(insideSpans(TEMPE_BOUNDARY, 'lng', box.east, box.south, box.north)).toEqual([[box.south, box.north]])
    }
  })

  it('keeps each neighborhood’s edges on its own side of the dividing line', () => {
    const split = GAME_ZONES.northStartsAt
    expect(zones.outlines['north-tempe'].flat().every(([lat]) => lat >= split)).toBe(true)
    expect(zones.outlines['south-tempe'].flat().every(([lat]) => lat <= split)).toBe(true)
    expect(zones.outlines['asu-campus']).toHaveLength(4)
    expect(zones.outlines['downtown-tempe']).toHaveLength(4)
  })

  it('draws the dividing line across the city', () => {
    const split = GAME_ZONES.northStartsAt
    const line = zones.outlines['north-tempe'].filter((part) => part.length === 2 && part.every(([lat]) => lat === split))
    expect(line.length).toBeGreaterThan(0)
    for (const [[, west], [, east]] of line) {
      expect(inCity(split, (west + east) / 2)).toBe(true)
    }
  })

  it('keeps every line to real places', () => {
    for (const [lat, lng] of zones.borders.flat()) {
      expect(Number.isFinite(lat) && Number.isFinite(lng)).toBe(true)
      expect(lat).toBeGreaterThan(33.2)
      expect(lat).toBeLessThan(33.5)
      expect(lng).toBeGreaterThan(-112.1)
      expect(lng).toBeLessThan(-111.8)
    }
  })
})
