// The City of Tempe's own accessibility records, shown on the map beside what players report:
// bus stops and corners that do not meet the ADA, and sidewalk hazards, from the City's ADA
// Transition Plan survey (2016 to 2020). Only what the City still lists as awaiting repair.
//
// The records are a file in web/public/data, built by `npm run city-records` in api/. They are
// not part of the API, so nothing here touches the contract in shared/. The record shape is
// written a second time in api/scripts/lib/cityRecords.ts. Change both together.
// No React in here.
import type { Category } from '../../../../shared/types'
import type { PinnedReport } from './mapReports'

/** Something the City's survey found wrong and has not repaired. */
export type BarrierKind = 'bus-stop' | 'curb-ramp' | 'uneven-sidewalk' | 'obstruction' | 'gap'
/** A helpful place from the City's open data. */
export type ResourceKind = 'fountain' | 'restroom' | 'food'
export type CityRecordKind = BarrierKind | ResourceKind
export type ObstructionDetail = 'plants' | 'fixed-object' | 'grate' | 'other'
export type Shade = 'none' | 'partial' | 'full' | 'yes'
export type RestroomType = 'family' | 'female' | 'male'
export type FoodType = 'distribution' | 'produce' | 'farm-bus'

export interface CityRecord {
  /** The City's own id where it has one, otherwise `{layer}:{row}`. */
  id: string
  kind: CityRecordKind
  lat: number
  lng: number
  /** The corner or street, as the City wrote it. */
  where: string | null
  /** The day it was surveyed, YYYY-MM-DD, where the City recorded one. */
  surveyed: string | null
  /** What the City's survey proposed doing about it. */
  cityFix: string | null
  /** Obstructions only. */
  detail?: ObstructionDetail
  /** Lifted slabs only: how high, in inches. */
  heightIn?: number
  /** Bus stops only. */
  shelter?: boolean
  bench?: boolean
  shade?: Shade
  /** Bus stops only: the City heat study's average surface temperature there, in °F. */
  surfaceTempF?: number
  /** Food sites only: what the place is called. */
  name?: string
  foodType?: FoodType
  /** Food sites only: what it offers and when, in the City's words. */
  services?: string
  /** Restrooms only: which rooms the building has, and when it is open, in the City's words. */
  restrooms?: RestroomType[]
  hours?: string
  lit?: boolean
  /** Drinking fountains only. */
  ada?: boolean
  bottleFiller?: boolean
  chilled?: boolean
}

export interface CityRecordsFile {
  /** The day the records were copied from the City, YYYY-MM-DD. */
  copiedAt: string
  records: CityRecord[]
}

// ---- Where to report a problem to the City ----

/**
 * The City's own service request form (Tempe 311). It takes reports with or without an account.
 * The City's records carry no link of their own that opens for the public: the survey's report
 * links point at a City server that only answers inside the City's network. Checked 2026-11-15.
 */
export const TEMPE_311_FORM_URL =
  'https://www.tempe.gov/government/communication-and-marketing/tempe-311/submit-service-request'

// ---- Loading ----

const BARRIERS: readonly BarrierKind[] = ['bus-stop', 'curb-ramp', 'uneven-sidewalk', 'obstruction', 'gap']
const KINDS: readonly CityRecordKind[] = [...BARRIERS, 'fountain', 'restroom', 'food']

/** True for something the City's survey found wrong, false for a helpful place. */
export function isBarrier(record: CityRecord): boolean {
  return BARRIERS.some((kind) => kind === record.kind)
}

function isRecord(value: unknown): value is CityRecord {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Partial<CityRecord>
  return (
    typeof record.id === 'string' &&
    KINDS.some((kind) => kind === record.kind) &&
    typeof record.lat === 'number' &&
    typeof record.lng === 'number'
  )
}

/** Checks the file is what the map expects. It is our own file, but a stale or broken copy should fail here and not in the map. */
export function parseCityRecords(json: unknown): CityRecordsFile {
  const file = json as Partial<CityRecordsFile> | null
  if (!file || typeof file.copiedAt !== 'string' || !Array.isArray(file.records) || !file.records.every(isRecord)) {
    throw new Error('The City records file is not in the expected shape.')
  }
  return { copiedAt: file.copiedAt, records: file.records }
}

/** Fetches the City records. They change only when someone copies them again, so one load lasts the visit. */
export async function loadCityRecords(): Promise<CityRecordsFile> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/city-records.json`)
  if (!response.ok) throw new Error(`The City records file did not load (${response.status}).`)
  return parseCityRecords(await response.json())
}

// ---- The switches on the map ----

/**
 * The groups a person can switch on and off. The first three are barriers (sidewalk is three
 * kinds of record together). The last two are helpful places.
 */
export type CityLayer = 'bus-stops' | 'curb-ramps' | 'sidewalk' | 'water' | 'food'

export const BARRIER_LAYERS: readonly CityLayer[] = ['bus-stops', 'curb-ramps', 'sidewalk']
export const RESOURCE_LAYERS: readonly CityLayer[] = ['water', 'food']

export const LAYER_OF: Record<CityRecordKind, CityLayer> = {
  'bus-stop': 'bus-stops',
  'curb-ramp': 'curb-ramps',
  'uneven-sidewalk': 'sidewalk',
  obstruction: 'sidewalk',
  gap: 'sidewalk',
  fountain: 'water',
  restroom: 'water',
  food: 'food',
}

export type CityLayers = Record<CityLayer, boolean>

export const ALL_LAYERS: CityLayers = { 'bus-stops': true, 'curb-ramps': true, sidewalk: true, water: true, food: true }
export const NO_LAYERS: CityLayers = { 'bus-stops': false, 'curb-ramps': false, sidewalk: false, water: false, food: false }

export function countByLayer(records: CityRecord[]): Record<CityLayer, number> {
  const counts: Record<CityLayer, number> = { 'bus-stops': 0, 'curb-ramps': 0, sidewalk: 0, water: 0, food: 0 }
  for (const record of records) counts[LAYER_OF[record.kind]] += 1
  return counts
}

/** The records in the layers that are switched on, in the order they came in. */
export function inLayers(records: CityRecord[], layers: CityLayers): CityRecord[] {
  return records.filter((record) => layers[LAYER_OF[record.kind]])
}

// ---- Matching a player's report to a City record ----

/** Meters between two places. */
export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h))
}

/** A report this close to a City record is taken to be about the same place. A phone's location is good to about this far. */
export const MATCH_RADIUS_M = 30

// Only these report types can be about an accessibility barrier. A pothole beside a bus stop is
// not the bus stop's problem.
const CAN_MATCH: Record<Category, boolean> = {
  pothole: false,
  streetlight: false,
  graffiti: false,
  'blocked-sidewalk': true,
  other: true,
}

/** Meters in one degree of latitude. A degree of longitude is shorter by the cosine of the latitude. */
const METERS_PER_DEGREE = 111_320

/**
 * For each report that could be about an accessibility barrier, the nearest barrier the City
 * recorded within `radiusM`, by report id. Reports with none nearby are left out. Helpful places
 * never match: a report beside a drinking fountain is not about the fountain.
 */
export function matchReports(
  pins: PinnedReport[],
  allRecords: CityRecord[],
  radiusM: number = MATCH_RADIUS_M,
): Map<string, CityRecord> {
  const records = allRecords.filter(isBarrier)
  const matches = new Map<string, CityRecord>()
  for (const pin of pins) {
    if (!CAN_MATCH[pin.category]) continue
    // A box around the report, so the exact distance is only worked out for records close by.
    const latReach = radiusM / METERS_PER_DEGREE
    const lngReach = latReach / Math.cos((pin.lat * Math.PI) / 180)
    let best: { record: CityRecord; meters: number } | undefined
    for (const record of records) {
      if (Math.abs(record.lat - pin.lat) > latReach || Math.abs(record.lng - pin.lng) > lngReach) continue
      const meters = haversineMeters(pin, record)
      if (meters <= radiusM && (!best || meters < best.meters)) best = { record, meters }
    }
    if (best) matches.set(pin.id, best.record)
  }
  return matches
}

// ---- Choosing what to draw ----

/** A rectangle of the map, as its south-west and north-east corners. */
export interface MapBox {
  south: number
  west: number
  north: number
  east: number
}

export function inBox(records: CityRecord[], box: MapBox): CityRecord[] {
  return records.filter(
    (record) => record.lat >= box.south && record.lat <= box.north && record.lng >= box.west && record.lng <= box.east,
  )
}
