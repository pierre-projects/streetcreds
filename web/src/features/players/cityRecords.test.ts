import { describe, expect, it } from 'vitest'
import type { PublicReport } from '../../../../shared/types'
import {
  ALL_LAYERS,
  type CityRecord,
  countByLayer,
  haversineMeters,
  inBox,
  inLayers,
  isBarrier,
  matchReports,
  NO_LAYERS,
  parseCityRecords,
} from './cityRecords'
import type { PinnedReport } from './mapReports'

function record(overrides: Partial<CityRecord> = {}): CityRecord {
  return { id: 'r1', kind: 'curb-ramp', lat: 33.42, lng: -111.94, where: null, surveyed: null, cityFix: null, ...overrides }
}

function pin(overrides: Partial<PublicReport> = {}): PinnedReport {
  return {
    id: 'p1',
    playerId: 'player-1',
    photoKey: 'reports/player-1/photo.jpg',
    photoUrl: 'https://example.com/photo.jpg',
    category: 'blocked-sidewalk',
    severity: 'medium',
    description: 'A sign post in the middle of the sidewalk.',
    count: 1,
    status: 'open',
    createdAt: '2026-11-14T18:01:40.000Z',
    submittedAt: '2026-11-14T18:02:11.000Z',
    ...overrides,
    lat: overrides.lat ?? 33.42,
    lng: overrides.lng ?? -111.94,
  }
}

// One ten-thousandth of a degree of latitude is about 11 m.
const STEP = 0.0001

describe('parseCityRecords', () => {
  it('accepts the file the script writes', () => {
    const file = { copiedAt: '2026-11-14', sources: [], records: [record()] }
    expect(parseCityRecords(file)).toEqual({ copiedAt: '2026-11-14', records: [record()] })
  })

  it('refuses anything else', () => {
    expect(() => parseCityRecords(null)).toThrow()
    expect(() => parseCityRecords({ records: [] })).toThrow()
    expect(() => parseCityRecords({ copiedAt: '2026-11-14', records: [{ id: 'x', kind: 'pothole', lat: 1, lng: 2 }] })).toThrow()
    expect(() => parseCityRecords({ copiedAt: '2026-11-14', records: [{ id: 'x', kind: 'gap', lat: '1', lng: 2 }] })).toThrow()
  })
})

describe('layers', () => {
  const records = [
    record({ id: 'a', kind: 'bus-stop' }),
    record({ id: 'b', kind: 'curb-ramp' }),
    record({ id: 'c', kind: 'uneven-sidewalk' }),
    record({ id: 'd', kind: 'obstruction' }),
    record({ id: 'e', kind: 'gap' }),
    record({ id: 'f', kind: 'fountain' }),
    record({ id: 'g', kind: 'restroom' }),
    record({ id: 'h', kind: 'food' }),
  ]

  it('counts the three sidewalk kinds as one layer, and fountains with restrooms', () => {
    expect(countByLayer(records)).toEqual({ 'bus-stops': 1, 'curb-ramps': 1, sidewalk: 3, water: 2, food: 1 })
  })

  it('keeps the records of the layers that are on', () => {
    expect(inLayers(records, ALL_LAYERS)).toEqual(records)
    expect(inLayers(records, NO_LAYERS)).toEqual([])
    expect(inLayers(records, { ...NO_LAYERS, sidewalk: true }).map((r) => r.id)).toEqual(['c', 'd', 'e'])
    expect(inLayers(records, { ...NO_LAYERS, water: true }).map((r) => r.id)).toEqual(['f', 'g'])
  })

  it('tells a barrier from a helpful place', () => {
    expect(records.filter(isBarrier).map((r) => r.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
})

describe('haversineMeters', () => {
  it('measures a short distance in Tempe', () => {
    expect(haversineMeters({ lat: 33.42, lng: -111.94 }, { lat: 33.421, lng: -111.94 })).toBeCloseTo(111.2, 0)
    expect(haversineMeters({ lat: 33.42, lng: -111.94 }, { lat: 33.42, lng: -111.94 })).toBe(0)
  })
})

describe('matchReports', () => {
  it('matches a report to a City record within 30 m', () => {
    const near = record({ id: 'near', lat: 33.42 + 2 * STEP })
    expect(matchReports([pin()], [near]).get('p1')).toBe(near)
  })

  it('leaves out a report with no record that close', () => {
    const far = record({ id: 'far', lat: 33.42 + 4 * STEP })
    expect(matchReports([pin()], [far]).size).toBe(0)
  })

  it('picks the nearest record when several are close', () => {
    const closer = record({ id: 'closer', lat: 33.42 + STEP })
    const further = record({ id: 'further', lat: 33.42 - 2 * STEP })
    expect(matchReports([pin()], [further, closer]).get('p1')).toBe(closer)
  })

  it('measures east to west as well as north to south', () => {
    // 0.0003 degrees of longitude is about 28 m here, and 0.0004 is about 37 m.
    expect(matchReports([pin()], [record({ lng: -111.94 + 3 * STEP })]).size).toBe(1)
    expect(matchReports([pin()], [record({ lng: -111.94 + 4 * STEP })]).size).toBe(0)
  })

  it('only matches reports that could be about an accessibility barrier', () => {
    const here = record()
    const pins = [
      pin({ id: 'sidewalk', category: 'blocked-sidewalk' }),
      pin({ id: 'other', category: 'other' }),
      pin({ id: 'pothole', category: 'pothole' }),
      pin({ id: 'light', category: 'streetlight' }),
      pin({ id: 'graffiti', category: 'graffiti' }),
    ]
    expect([...matchReports(pins, [here]).keys()]).toEqual(['sidewalk', 'other'])
  })

  it('never matches a helpful place', () => {
    const places = [record({ id: 'f', kind: 'fountain' }), record({ id: 'g', kind: 'restroom' }), record({ id: 'h', kind: 'food' })]
    expect(matchReports([pin()], places).size).toBe(0)
  })

  it('uses the radius it is given', () => {
    const far = record({ lat: 33.42 + 4 * STEP })
    expect(matchReports([pin()], [far], 50).size).toBe(1)
  })
})

describe('inBox', () => {
  it('keeps the records inside the rectangle', () => {
    const records = [record({ id: 'in' }), record({ id: 'north', lat: 33.5 }), record({ id: 'west', lng: -112 })]
    const box = { south: 33.41, west: -111.95, north: 33.43, east: -111.93 }
    expect(inBox(records, box).map((r) => r.id)).toEqual(['in'])
  })
})
