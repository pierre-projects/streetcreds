// Builds the text behind "Copy city report": everything a city's own report form asks for,
// ready to paste. Pure: it only reads the report it is given.
import type { PublicReport } from '../../../../shared/types'
import { strings } from '../../app/strings'

/**
 * The format is fixed in docs/TECHNICAL.md section 7:
 *
 *   Category: Pothole
 *   Severity: High
 *   Description: Deep pothole in the right lane near the crosswalk.
 *   Location: 33.42150, -111.93400 (https://www.google.com/maps?q=33.42150,-111.93400)
 *   Reports: 3
 *   Photo: {photoUrl} (link expires in about an hour)
 *   Reported with StreetCreds on 2026-11-14
 */
function formatLocation(lat: number, lng: number): string {
  const latText = lat.toFixed(5)
  const lngText = lng.toFixed(5)
  return `${latText}, ${lngText} (https://www.google.com/maps?q=${latText},${lngText})`
}

export function buildCityReport(report: PublicReport): string {
  const { lat, lng } = report
  const location = lat !== null && lng !== null ? formatLocation(lat, lng) : 'not recorded'

  // The day the report was made, in UTC, as the API stores it.
  const day = (report.submittedAt ?? report.createdAt).slice(0, 10)

  return [
    `Category: ${strings.categories[report.category]}`,
    `Severity: ${strings.severities[report.severity]}`,
    `Description: ${report.description}`,
    `Location: ${location}`,
    `Reports: ${report.count}`,
    `Photo: ${report.photoUrl} (link expires in about an hour)`,
    `Reported with ${strings.appName} on ${day}`,
  ].join('\n')
}
