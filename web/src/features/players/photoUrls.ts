// Keeps one photo address per report for as long as the page is open.
//
// The reports are fetched again every few seconds, and a photo's address can be different every
// time, because the API signs a fresh one. Handing each new address to an <img> would make the
// browser download every photo again on every refresh. So the first address seen for a report is
// the one that stays in use, until it stops working.
import type { PublicReport } from '../../../../shared/types'

const kept = new Map<string, string>()

/** The address to show for this report's photo: the first one seen while the page has been open. */
export function steadyPhotoUrl(report: PublicReport): string {
  const known = kept.get(report.id)
  if (known !== undefined) return known
  kept.set(report.id, report.photoUrl)
  return report.photoUrl
}

/**
 * For an <img>'s onError: the kept address has probably expired, so switch to the newest one.
 * Returns it, or null when the newest one is the address that just failed, so there is nothing to try.
 */
export function renewPhotoUrl(report: PublicReport): string | null {
  if (kept.get(report.id) === report.photoUrl) return null
  kept.set(report.id, report.photoUrl)
  return report.photoUrl
}
