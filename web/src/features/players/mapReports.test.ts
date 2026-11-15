import { describe, expect, it } from 'vitest'
import type { PublicReport } from '../../../../shared/types'
import {
  ageMinutes,
  applyFilter,
  byMostReported,
  byNewest,
  bySeriousness,
  countByCategory,
  countBySeverity,
  groupPins,
  hasPlace,
  isFiltering,
  NO_FILTER,
  type PinnedReport,
  reportCount,
  worstSeverity,
} from './mapReports'

function report(changes: Partial<PublicReport>): PublicReport {
  return {
    id: 'report-1',
    playerId: 'player-1',
    photoKey: 'reports/player-1/photo.jpg',
    photoUrl: 'https://example.com/photo.jpg',
    lat: 33.4215,
    lng: -111.934,
    category: 'pothole',
    severity: 'medium',
    description: 'Deep pothole in the right lane near the crosswalk.',
    count: 1,
    status: 'open',
    createdAt: '2026-11-14T18:00:00.000Z',
    submittedAt: '2026-11-14T18:01:00.000Z',
    ...changes,
  }
}

describe('hasPlace', () => {
  it('is false for a report without a location', () => {
    expect(hasPlace(report({}))).toBe(true)
    expect(hasPlace(report({ lat: null, lng: null }))).toBe(false)
  })
})

describe('reportCount', () => {
  it('is a whole number of at least 1, whatever the API sends', () => {
    expect(reportCount(report({ count: 3 }))).toBe(3)
    expect(reportCount(report({ count: 0 }))).toBe(1)
    expect(reportCount(report({ count: 2.6 }))).toBe(3)
    expect(reportCount(report({ count: Number.NaN }))).toBe(1)
  })
})

describe('bySeriousness', () => {
  it('puts the most serious first, then the most reported, then the newest', () => {
    const reports = [
      report({ id: 'low', severity: 'low', count: 9 }),
      report({ id: 'high-once-old', severity: 'high', submittedAt: '2026-11-14T10:00:00.000Z' }),
      report({ id: 'medium', severity: 'medium' }),
      report({ id: 'high-once-new', severity: 'high', submittedAt: '2026-11-14T12:00:00.000Z' }),
      report({ id: 'high-often', severity: 'high', count: 4 }),
    ]
    expect(reports.sort(bySeriousness).map((r) => r.id)).toEqual([
      'high-often',
      'high-once-new',
      'high-once-old',
      'medium',
      'low',
    ])
  })
})

describe('byNewest and byMostReported', () => {
  const reports = [
    report({ id: 'old-high', severity: 'high', submittedAt: '2026-11-14T10:00:00.000Z' }),
    report({ id: 'new-low-often', severity: 'low', count: 5, submittedAt: '2026-11-14T12:00:00.000Z' }),
    report({ id: 'mid-medium-often', severity: 'medium', count: 5, submittedAt: '2026-11-14T11:00:00.000Z' }),
  ]

  it('byNewest puts the latest report first', () => {
    expect([...reports].sort(byNewest).map((r) => r.id)).toEqual(['new-low-often', 'mid-medium-often', 'old-high'])
  })

  it('byMostReported puts the most reported first, and the more serious first among equals', () => {
    expect([...reports].sort(byMostReported).map((r) => r.id)).toEqual(['mid-medium-often', 'new-low-often', 'old-high'])
  })
})

describe('ageMinutes', () => {
  const made = report({ submittedAt: '2026-11-14T18:00:00.000Z' })

  it('counts whole minutes since the report was made', () => {
    expect(ageMinutes(made, Date.parse('2026-11-14T18:00:59.000Z'))).toBe(0)
    expect(ageMinutes(made, Date.parse('2026-11-14T18:12:30.000Z'))).toBe(12)
    expect(ageMinutes(made, Date.parse('2026-11-14T21:00:00.000Z'))).toBe(180)
  })

  it('is null for a time in the future or one that cannot be read', () => {
    expect(ageMinutes(made, Date.parse('2026-11-14T17:00:00.000Z'))).toBeNull()
    expect(ageMinutes(report({ submittedAt: 'not a date' }), Date.now())).toBeNull()
  })
})

describe('worstSeverity', () => {
  it('is the most serious severity in the list', () => {
    expect(worstSeverity([report({ severity: 'low' }), report({ severity: 'high' }), report({ severity: 'medium' })])).toBe('high')
    expect(worstSeverity([report({ severity: 'low' }), report({ severity: 'medium' })])).toBe('medium')
    expect(worstSeverity([])).toBe('low')
  })
})

describe('countByCategory', () => {
  it('counts every type, including the ones with no reports', () => {
    const reports = [report({ category: 'pothole' }), report({ category: 'pothole' }), report({ category: 'graffiti' })]
    expect(countByCategory(reports)).toEqual({ pothole: 2, streetlight: 0, graffiti: 1, 'blocked-sidewalk': 0, other: 0 })
  })
})

describe('applyFilter', () => {
  const reports = [
    report({ id: 'a', severity: 'high', category: 'pothole' }),
    report({ id: 'b', severity: 'low', category: 'pothole' }),
    report({ id: 'c', severity: 'high', category: 'graffiti' }),
  ]

  it('lets everything through when nothing is filtered', () => {
    expect(isFiltering(NO_FILTER)).toBe(false)
    expect(applyFilter(reports, NO_FILTER).map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })

  it('hides a severity that is switched off', () => {
    const filter = { ...NO_FILTER, severities: { ...NO_FILTER.severities, high: false } }
    expect(isFiltering(filter)).toBe(true)
    expect(applyFilter(reports, filter).map((r) => r.id)).toEqual(['b'])
  })

  it('keeps one type, and combines with severity', () => {
    expect(applyFilter(reports, { ...NO_FILTER, category: 'pothole' }).map((r) => r.id)).toEqual(['a', 'b'])
    const both = { severities: { low: false, medium: true, high: true }, category: 'pothole' as const }
    expect(applyFilter(reports, both).map((r) => r.id)).toEqual(['a'])
  })
})

describe('groupPins', () => {
  function pin(id: string, lat: number, lng: number): PinnedReport {
    return { ...report({ id }), lat, lng }
  }
  // About 11 m apart, which is between one and two pixels at zoom 14.
  const near = [pin('a', 33.42, -111.94), pin('b', 33.4201, -111.94)]
  // About 2 km from the other two.
  const far = pin('c', 33.44, -111.94)

  it('draws pins that would overlap as one group, and leaves the rest alone', () => {
    const groups = groupPins([...near, far], 14)
    expect(groups.map((group) => group.reports.map((r) => r.id))).toEqual([['a', 'b'], ['c']])
    // A group sits where its first report is.
    expect(groups[0]).toMatchObject({ id: 'a', lat: 33.42, lng: -111.94 })
  })

  it('splits a group once the map is zoomed in far enough', () => {
    const spread = [pin('a', 33.42, -111.94), pin('b', 33.4205, -111.94)]
    expect(groupPins(spread, 14)).toHaveLength(1)
    expect(groupPins(spread, 18)).toHaveLength(2)
  })

  it('keeps reports at the very same spot together at any zoom', () => {
    const same = [pin('a', 33.42, -111.94), pin('b', 33.42, -111.94)]
    expect(groupPins(same, 18)).toHaveLength(1)
  })

  it('puts every report in exactly one group', () => {
    const many = Array.from({ length: 50 }, (_, i) => pin(`r${i}`, 33.42 + (i % 7) * 0.0004, -111.94 + (i % 5) * 0.0004))
    const ids = groupPins(many, 15).flatMap((group) => group.reports.map((r) => r.id))
    expect(ids).toHaveLength(50)
    expect(new Set(ids).size).toBe(50)
  })
})

describe('countBySeverity', () => {
  it('counts every severity, including the ones with no reports', () => {
    const reports = [report({ severity: 'high' }), report({ severity: 'high' }), report({ severity: 'low' })]
    expect(countBySeverity(reports)).toEqual({ low: 1, medium: 0, high: 2 })
    expect(countBySeverity([])).toEqual({ low: 0, medium: 0, high: 0 })
  })
})
