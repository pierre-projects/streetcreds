// Where a report goes on the City of Tempe's own service request form (Tempe 311), so the
// player lands on the right form with nothing to look for.
//
// The City's form is an Accela app that tempe.gov shows in a frame. Opened on its own it reads
// two settings from its address: `request_type_id` opens one issue's form, and
// `request_type_category_id` opens one group's list of issues. It takes no location,
// description or photo that way: the player pastes those (see CityHandoff.tsx).
//
// The ids and names are the City's, read from its live list and each opened once on
// 2026-11-15. Every form named here takes a report without an account. The City has said it
// will replace this system. If an id stops working the form shows its full list instead, and
// TEMPE_311_FORM_URL in cityRecords.ts is the way in that does not depend on any of this.
// No React in here.
import type { Category } from '../../../../shared/types'
import type { CityRecordKind } from './cityRecords'

export const TEMPE_311_APP_URL = 'https://iframe.publicstuff.com/'
/** The City of Tempe's number in the Accela system. */
export const TEMPE_311_CLIENT_ID = 1000028

/**
 * Where the City's form opens:
 *   `form`    one issue's form, ready to fill in;
 *   `list`    one group's issues, for the player to pick from;
 *   `picker`  every group, with the City's own search.
 * `name` is what the City calls it, so the player recognizes the page.
 */
export type Tempe311Target =
  | { open: 'form'; id: number; name: string }
  | { open: 'list'; id: number; name: string }
  | { open: 'picker' }

const PICKER: Tempe311Target = { open: 'picker' }
const STREET_LIGHTS: Tempe311Target = { open: 'list', id: 4765, name: 'Transportation - Street Lights' }
const GRAFFITI: Tempe311Target = { open: 'list', id: 4720, name: 'Graffiti' }
const STREETS: Tempe311Target = { open: 'list', id: 4768, name: 'Transportation - Streets' }
const POTHOLE: Tempe311Target = { open: 'form', id: 1009682, name: 'Pothole' }
const SIDEWALK_REPAIR: Tempe311Target = { open: 'form', id: 1009685, name: 'Sidewalk or Curb Repair' }
const BUS_STOP: Tempe311Target = { open: 'form', id: 1009772, name: 'Bus Stop Maintenance' }

// A pothole has one form. The City splits the others by what exactly is wrong (thirteen kinds of
// street light problem) or by where it is (graffiti on a wall, in a park, at a bus stop), which
// a StreetCreds category does not say, so those open the group's list.
const BY_CATEGORY: Record<Category, Tempe311Target> = {
  pothole: POTHOLE,
  streetlight: STREET_LIGHTS,
  graffiti: GRAFFITI,
  // Sidewalk or Curb Repair and Downed Tree or Limb are both in this group.
  'blocked-sidewalk': STREETS,
  other: PICKER,
}

// The City's own accessibility records. A missing ramp, a lifted slab and a gap are all concrete
// work. An obstruction can be plants or an object, so it gets the list.
const BY_RECORD: Record<CityRecordKind, Tempe311Target> = {
  'bus-stop': BUS_STOP,
  'curb-ramp': SIDEWALK_REPAIR,
  'uneven-sidewalk': SIDEWALK_REPAIR,
  gap: SIDEWALK_REPAIR,
  obstruction: STREETS,
  fountain: PICKER,
  restroom: PICKER,
  food: PICKER,
}

export function tempe311Target(category: Category): Tempe311Target {
  return BY_CATEGORY[category]
}

export function tempe311RecordTarget(kind: CityRecordKind): Tempe311Target {
  return BY_RECORD[kind]
}

/** The address that opens the City's form at `target`. The settings go after the `#`, as the form expects. */
export function tempe311Url(target: Tempe311Target): string {
  const base = `${TEMPE_311_APP_URL}#?client_id=${TEMPE_311_CLIENT_ID}`
  if (target.open === 'form') return `${base}&request_type_id=${target.id}`
  if (target.open === 'list') return `${base}&request_type_category_id=${target.id}`
  return base
}
