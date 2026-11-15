// Builds the two texts a player pastes into the City's own report form (see CityHandoff.tsx):
// the spot, for its Address box, and the details, for its Description box.
// Pure: it only reads the report it is given.
import type { Report } from '../../../../shared/types'
import { strings } from '../../app/strings'
import type { CityRecord } from './cityRecords'
import { cityCopyLine } from './cityText'

/**
 * A report with or without a photo link. The map's reports have one; the report a player has
 * just filed does not, because the submit response carries none.
 */
export type CityReportSource = Report & { photoUrl?: string }

/**
 * The spot the way the City's form takes it: pasted into its Address box, `33.42150, -111.93400`
 * places the pin there. Tried on the City's form on 2026-11-15.
 */
export function cityLocationText(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

/**
 * The format is fixed in docs/TECHNICAL.md section 7:
 *
 *   Category: Pothole
 *   Severity: High
 *   Description: Deep pothole in the right lane near the crosswalk.
 *   Location: 33.42150, -111.93400 (https://www.google.com/maps?q=33.42150,-111.93400)
 *   City ADA survey: This corner has no curb ramp. ...        (only at a spot the City recorded too)
 *   Reports: 3
 *   Photo: {photoUrl} (link expires in about an hour)          (only when the report has a photo link)
 *   Reported with StreetCreds on 2026-11-14
 */
function formatLocation(lat: number, lng: number): string {
  return `${cityLocationText(lat, lng)} (https://www.google.com/maps?q=${lat.toFixed(5)},${lng.toFixed(5)})`
}

/** `cityRecord` is the City's own record of the same spot, when it has one. It adds a line after the location. */
export function buildCityReport(report: CityReportSource, cityRecord?: CityRecord): string {
  const { lat, lng } = report
  const location = lat !== null && lng !== null ? formatLocation(lat, lng) : 'not recorded'

  // The day the report was made, in UTC, as the API stores it.
  const day = (report.submittedAt ?? report.createdAt).slice(0, 10)

  return [
    `Category: ${strings.categories[report.category]}`,
    `Severity: ${strings.severities[report.severity]}`,
    `Description: ${report.description}`,
    `Location: ${location}`,
    ...(cityRecord ? [cityCopyLine(cityRecord)] : []),
    `Reports: ${report.count}`,
    ...(report.photoUrl ? [`Photo: ${report.photoUrl} (link expires in about an hour)`] : []),
    `Reported with ${strings.appName} on ${day}`,
  ].join('\n')
}
