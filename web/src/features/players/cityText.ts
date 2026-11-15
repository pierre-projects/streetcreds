// The words for one City record: what the survey found there, and how to point at the record.
// Pure. The popup on the map and the details a player copies for the City's form both use these.
import { strings } from '../../app/strings'
import type { CityRecord } from './cityRecords'

/** What the survey found, as one sentence. For a helpful place, which has no finding, what it is. */
export function cityFinding(record: CityRecord): string {
  switch (record.kind) {
    case 'bus-stop':
      return strings.city.busStop
    case 'curb-ramp':
      return strings.city.curbRamp
    case 'uneven-sidewalk':
      return strings.city.lifted(record.heightIn)
    case 'obstruction':
      return strings.city.obstruction[record.detail ?? 'other']
    case 'gap':
      return strings.city.gap
    case 'fountain':
    case 'restroom':
    case 'food':
      return strings.city.kinds[record.kind]
  }
}

/** How someone at the City can find the record: its ADA id, or the survey layer and row for records that have none. */
export function cityRecordRef(record: CityRecord): string {
  const [layer, row] = record.id.split(':')
  return layer !== undefined && row !== undefined ? strings.city.rowRef(layer, row) : strings.city.recordRef(record.id)
}

/** The line the copied details gain for a report at a spot the City recorded too. */
export function cityCopyLine(record: CityRecord): string {
  return strings.city.copyLine(cityFinding(record), record.where, cityRecordRef(record), record.surveyed)
}
