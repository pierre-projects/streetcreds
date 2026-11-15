import { describe, expect, it } from 'vitest'
import type { PublicReport } from '../../../../shared/types'
import type { CityRecord } from './cityRecords'
import { buildCityReport, cityLocationText } from './cityReport'

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

  it('leaves the photo line out of a report that has no photo link', () => {
    const justFiled = { ...report, photoUrl: undefined }
    expect(buildCityReport(justFiled).split('\n').slice(4)).toEqual(['Reports: 3', 'Reported with StreetCreds on 2026-11-14'])
  })

  it('adds the City’s own record of the spot after the location', () => {
    const ramp: CityRecord = {
      id: '260515171717',
      kind: 'curb-ramp',
      lat: 33.4215,
      lng: -111.934,
      where: 'S MILL AVE & W BROADWAY RD, SW corner',
      surveyed: '2017-05-19',
      cityFix: null,
    }
    expect(buildCityReport(report, ramp).split('\n').slice(3, 6)).toEqual([
      'Location: 33.42150, -111.93400 (https://www.google.com/maps?q=33.42150,-111.93400)',
      'City ADA survey: This corner has no curb ramp. S MILL AVE & W BROADWAY RD, SW corner. Record 260515171717, surveyed 2017-05-19, listed as awaiting repair.',
      'Reports: 3',
    ])
  })

  it('points at a City record that has no id by its survey layer and row', () => {
    const slab: CityRecord = { id: '8:25', kind: 'uneven-sidewalk', lat: 33.42, lng: -111.94, where: 'S MILL AVE', surveyed: null, cityFix: null, heightIn: 1.3 }
    expect(buildCityReport(report, slab)).toContain(
      'City ADA survey: A slab is lifted 1.3 in. S MILL AVE. Survey layer 8, row 25, listed as awaiting repair.',
    )
  })
})

describe('cityLocationText', () => {
  it('writes the spot the way the City’s Address box takes it', () => {
    expect(cityLocationText(33.4215, -111.934)).toBe('33.42150, -111.93400')
  })

  it('keeps five decimals, which is about a meter', () => {
    expect(cityLocationText(33.4254987, -111.9400012)).toBe('33.42550, -111.94000')
  })
})
