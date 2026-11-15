import { describe, expect, it } from 'vitest'
import type { PublicReport } from '../../../../shared/types'
import { buildCityReport } from './cityReport'

const report: PublicReport = {
  id: 'report-1',
  playerId: 'player-1',
  photoKey: 'reports/player-1/photo.jpg',
  photoUrl: 'https://example.com/photo.jpg',
  lat: 33.4215,
  lng: -111.934,
  category: 'pothole',
  severity: 'high',
  description: 'Deep pothole in the right lane near the crosswalk.',
  count: 3,
  status: 'open',
  createdAt: '2026-11-14T18:01:40.000Z',
  submittedAt: '2026-11-14T18:02:11.000Z',
}

describe('buildCityReport', () => {
  it('matches the format in docs/TECHNICAL.md section 7', () => {
    expect(buildCityReport(report)).toBe(
      [
        'Category: Pothole',
        'Severity: High',
        'Description: Deep pothole in the right lane near the crosswalk.',
        'Location: 33.42150, -111.93400 (https://www.google.com/maps?q=33.42150,-111.93400)',
        'Reports: 3',
        'Photo: https://example.com/photo.jpg (link expires in about an hour)',
        'Reported with StreetCreds on 2026-11-14',
      ].join('\n'),
    )
  })

  it('writes a two-word category the way a person would', () => {
    expect(buildCityReport({ ...report, category: 'blocked-sidewalk', severity: 'low' })).toContain(
      'Category: Blocked sidewalk\nSeverity: Low',
    )
  })

  it('uses the day the report was created when it has no submit time', () => {
    expect(buildCityReport({ ...report, submittedAt: null, createdAt: '2026-11-13T23:59:00.000Z' })).toContain(
      'Reported with StreetCreds on 2026-11-13',
    )
  })

  it('says so when a report has no location', () => {
    expect(buildCityReport({ ...report, lat: null, lng: null })).toContain('Location: not recorded')
  })
})
