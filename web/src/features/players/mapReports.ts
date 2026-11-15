// Small pure helpers for showing reports on the map and on the board. No React in here.
import type { Category, PublicReport, Severity } from '../../../../shared/types'

/** The smallest area a finger hits reliably. Every pin on the map is at least this big to touch. */
export const TAP_PX = 44
/** Width of a popup's content. With its border it fits a 320 px wide phone. */
export const POPUP_WIDTH = 256

/** A report that has a place, so it can be drawn. */
export type PinnedReport = PublicReport & { lat: number; lng: number }

export function hasPlace(report: PublicReport): report is PinnedReport {
  return report.lat !== null && report.lng !== null
}

/** How many times a problem was reported, as a whole number of at least 1. */
export function reportCount(report: PublicReport): number {
  return Math.max(1, Math.round(Number(report.count)) || 1)
}

// Written out in full so Tailwind can see each class name.
export const SEVERITY_TEXT: Record<Severity, string> = {
  low: 'text-severity-low',
  medium: 'text-severity-medium',
  high: 'text-severity-high',
}
export const SEVERITY_DOT: Record<Severity, string> = {
  low: 'bg-severity-low',
  medium: 'bg-severity-medium',
  high: 'bg-severity-high',
}

/** The order to list severities in: the most serious first. */
export const SEVERITY_ORDER: Severity[] = ['high', 'medium', 'low']

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 }

/** When the report was made, as the API stores it. */
export function reportedAt(report: PublicReport): string {
  return report.submittedAt ?? report.createdAt
}

/**
 * Sort order for a list someone at the city would work through: most serious first, then the
 * problems reported most often, then the newest.
 */
export function bySeriousness(a: PublicReport, b: PublicReport): number {
  return (
    SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
    reportCount(b) - reportCount(a) ||
    reportedAt(b).localeCompare(reportedAt(a))
  )
}

/** Sort order for watching reports come in: the newest first. */
export function byNewest(a: PublicReport, b: PublicReport): number {
  return reportedAt(b).localeCompare(reportedAt(a))
}

/** Sort order for finding what bothers the most people: the most reported first, then the most serious. */
export function byMostReported(a: PublicReport, b: PublicReport): number {
  return reportCount(b) - reportCount(a) || bySeriousness(a, b)
}

/**
 * How many whole minutes ago a report was made. Null when that is not a usable answer: the time
 * cannot be read, or it is in the future because two clocks disagree.
 */
export function ageMinutes(report: PublicReport, now: number): number | null {
  const minutes = Math.floor((now - Date.parse(reportedAt(report))) / 60_000)
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : null
}

/** The most serious severity among the reports. `low` for an empty list. */
export function worstSeverity(reports: PublicReport[]): Severity {
  return reports.reduce<Severity>(
    (worst, report) => (SEVERITY_RANK[report.severity] < SEVERITY_RANK[worst] ? report.severity : worst),
    'low',
  )
}

/** How many of the reports there are at each severity. */
export function countBySeverity(reports: PublicReport[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { low: 0, medium: 0, high: 0 }
  for (const report of reports) {
    counts[report.severity] += 1
  }
  return counts
}

/** How many of the reports there are of each type. */
export function countByCategory(reports: PublicReport[]): Record<Category, number> {
  const counts: Record<Category, number> = { pothole: 0, streetlight: 0, graffiti: 0, 'blocked-sidewalk': 0, other: 0 }
  for (const report of reports) {
    counts[report.category] += 1
  }
  return counts
}

// ---- Filtering ----

/** Which reports to show. A severity set to false is hidden; `category` null means every type. */
export interface ReportFilter {
  severities: Record<Severity, boolean>
  category: Category | null
}

export const NO_FILTER: ReportFilter = {
  severities: { low: true, medium: true, high: true },
  category: null,
}

/** True when the filter hides anything at all. */
export function isFiltering(filter: ReportFilter): boolean {
  return filter.category !== null || !filter.severities.low || !filter.severities.medium || !filter.severities.high
}

/** The reports the filter lets through, in the order they came in. */
export function applyFilter<T extends PublicReport>(reports: T[], filter: ReportFilter): T[] {
  return reports.filter(
    (report) => filter.severities[report.severity] && (filter.category === null || report.category === filter.category),
  )
}

// ---- Grouping pins that would overlap ----

/** Two pins closer than this many pixels on screen are drawn as one group. The widest pin is 48 px, so pins never cover each other. */
export const GROUP_REACH_PX = 48

/** Reports drawn as one pin. A group of one is an ordinary pin. */
export interface PinGroup {
  /** The id of the report the group formed around. Steady while that report stays in the list. */
  id: string
  /** Where to draw it: the place of the report the group formed around. */
  lat: number
  lng: number
  reports: PinnedReport[]
}

/** Where a place falls on the flat world map at a zoom level, in pixels. This is the projection the map tiles use. */
function worldPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const size = 256 * 2 ** zoom
  const sin = Math.sin((lat * Math.PI) / 180)
  return {
    x: ((lng + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  }
}

/**
 * Puts reports whose pins would sit on top of each other at this zoom into one group.
 *
 * Each report in turn starts a group, unless an earlier group already took it, and takes every
 * later report within `reachPx` of it. Two groups are therefore never closer than `reachPx`.
 * The result depends on the order of `pins`: give them in a steady order, or the groups shuffle.
 */
export function groupPins(pins: PinnedReport[], zoom: number, reachPx: number = GROUP_REACH_PX): PinGroup[] {
  const points = pins.map((report) => worldPixel(report.lat, report.lng, zoom))
  const taken = new Set<number>()
  const groups: PinGroup[] = []

  pins.forEach((seed, i) => {
    const from = points[i]
    if (taken.has(i) || !from) return
    taken.add(i)
    const reports = [seed]
    pins.forEach((other, j) => {
      const to = points[j]
      if (j <= i || taken.has(j) || !to) return
      if (Math.hypot(from.x - to.x, from.y - to.y) <= reachPx) {
        taken.add(j)
        reports.push(other)
      }
    })
    groups.push({ id: seed.id, lat: seed.lat, lng: seed.lng, reports })
  })
  return groups
}
