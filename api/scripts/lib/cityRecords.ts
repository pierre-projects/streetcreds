// Turns pages saved from the City of Tempe's public map services into the records the map shows.
// Pure: no network and no files in here. scripts/city-records.ts does the reading and writing.
//
// There are two sorts of record. Barriers come from the City's ADA Transition Plan survey (2016
// to 2020) and its list of bus stops without a shelter: only what the City still lists as
// awaiting repair is kept. Resources are helpful places from the City's open data: drinking
// fountains and restrooms in parks, and places to get food. Nothing about a person is read: the
// queries below never ask for surveyor, reviewer or contact fields.
//
// The record shape is written a second time in web/src/features/players/cityRecords.ts, because
// shared/ is the fixed contract. Change both together.

export type BarrierKind = 'bus-stop' | 'curb-ramp' | 'uneven-sidewalk' | 'obstruction' | 'gap';
export type ResourceKind = 'fountain' | 'restroom' | 'food';
export type CityRecordKind = BarrierKind | ResourceKind;
export type ObstructionDetail = 'plants' | 'fixed-object' | 'grate' | 'other';
export type Shade = 'none' | 'partial' | 'full' | 'yes';
export type RestroomType = 'family' | 'female' | 'male';
export type FoodType = 'distribution' | 'produce' | 'farm-bus';

export interface CityRecord {
  /** The City's own id where it has one (ADA_ID), otherwise `{layer}:{OBJECTID}`. */
  id: string;
  kind: CityRecordKind;
  lat: number;
  lng: number;
  /** The corner or street, as the City wrote it. */
  where: string | null;
  /** The day it was surveyed, YYYY-MM-DD, where the layer records one. */
  surveyed: string | null;
  /** What the City's survey proposed doing about it. */
  cityFix: string | null;
  /** Obstructions only. */
  detail?: ObstructionDetail;
  /** Lifted slabs only: how high, in inches. */
  heightIn?: number;
  /** Bus stops only. */
  shelter?: boolean;
  bench?: boolean;
  shade?: Shade;
  /** Bus stops only: the City heat study's average surface temperature there, in °F. */
  surfaceTempF?: number;
  /** Food sites only: what the place is called. */
  name?: string;
  foodType?: FoodType;
  /** Food sites only: what it offers and when, in the City's words. */
  services?: string;
  /** Restrooms only: which rooms the building has, and when it is open, in the City's words. */
  restrooms?: RestroomType[];
  hours?: string;
  lit?: boolean;
  /** Drinking fountains only. */
  ada?: boolean;
  bottleFiller?: boolean;
  chilled?: boolean;
}

export interface CityRecordsFile {
  /** The day the pages were copied from the City, YYYY-MM-DD. */
  copiedAt: string;
  sources: { title: string; url: string }[];
  records: CityRecord[];
}

// ---- What to download ----

export type PageKey = 'transit' | 'ramp' | 'gap' | 'heaving' | 'obstruction' | 'heat' | 'fountain' | 'restroom' | 'food';

export interface PageSpec {
  key: PageKey;
  title: string;
  /** The layer, without `/query`. */
  layerUrl: string;
  where: string;
  /** The first one is the layer's row id. */
  outFields: string[];
  /**
   * True for a layer that lists places beyond Tempe, or test rows: a row outside Tempe is then
   * left out instead of stopping the script. The page is still refused if every row is outside.
   */
  skipOutside?: boolean;
  /** A field only this layer has, used to tell which saved file is which. */
  marker: string;
  /** The name to save the page under. Any name works: files are recognized by their contents. */
  fileName: string;
}

export const ADA_URL = 'https://gis.tempe.gov/arcgis/rest/services/Open_Data/ADA_Transition_Plan/MapServer';
/** The City's open data on ArcGIS Online. Unlike the ADA server, it answers a script. */
export const OPEN_DATA_URL = 'https://services.arcgis.com/lQySeXwbBg53XWDi/arcgis/rest/services';
export const HEAT_URL = `${OPEN_DATA_URL}/BusStops_2015_2020_LST_NoShelter/FeatureServer/0`;
export const FOUNTAIN_URL = `${OPEN_DATA_URL}/Drinking_Fountains_-_Parks_App_-_Public_View/FeatureServer/0`;
export const RESTROOM_URL = `${OPEN_DATA_URL}/Restrooms_public_view/FeatureServer/0`;
export const FOOD_URL = `${OPEN_DATA_URL}/Tempe_Community_Food_Site_view/FeatureServer/0`;

/** The most rows one request returns. Every page below is smaller, and a page that is cut off is refused. */
export const PAGE_SIZE = 2000;

// Obstruction types that block the way and can be seen. Driveways and surface materials are slope
// findings, and temporary obstructions from the survey year are long gone.
const OBSTRUCTION_DETAIL: Record<string, ObstructionDetail> = {
  Vegetation_Obs: 'plants',
  Overhead_Veg_Prot: 'plants',
  Permanent_Obs: 'fixed-object',
  Storm_Grate_Manhole: 'grate',
  Other_Obs: 'other',
  Transit_Obs: 'other',
};

const HIGH_HEAVE = 'Heaving >= 1 in';

export const PAGES: PageSpec[] = [
  {
    key: 'transit',
    title: 'Transit stops',
    layerUrl: `${ADA_URL}/0`,
    where: '1=1',
    outFields: ['OBJECTID', 'ADA_ID', 'TS_Street1', 'TS_Street2', 'TS_LocInInt', 'TS_SurveyDate', 'TS_Shelter', 'TS_Bench', 'TS_Shade', 'RepairStatus', 'AA_OVERALL_Compliant', 'AA_OVERALL_PossibleSol'],
    marker: 'TS_Street1',
    fileName: 'city-transit.json',
  },
  {
    key: 'ramp',
    title: 'Corners with no curb ramp',
    layerUrl: `${ADA_URL}/3`,
    where: "RP_Type='NoRamp'",
    outFields: ['OBJECTID', 'ADA_ID', 'RP_Street1', 'RP_Street2', 'RP_LocInInt', 'RP_Type', 'RP_SurveyDate', 'RepairStatus', 'AA_OVERALL_PossibleSol'],
    marker: 'RP_Street1',
    fileName: 'city-ramps.json',
  },
  {
    key: 'gap',
    title: 'Sidewalk gaps',
    layerUrl: `${ADA_URL}/7`,
    where: '1=1',
    outFields: ['OBJECTID', 'Width', 'Depth', 'CorridorID', 'RepairStatus'],
    marker: 'Depth',
    fileName: 'city-gaps.json',
  },
  {
    key: 'heaving',
    title: 'Slabs lifted an inch or more',
    layerUrl: `${ADA_URL}/8`,
    where: `BmpDescription='${HIGH_HEAVE}'`,
    outFields: ['OBJECTID', 'BmpDescription', 'BumpHt', 'CorridorID', 'RepairStatus'],
    marker: 'BumpHt',
    fileName: 'city-heaving.json',
  },
  {
    key: 'obstruction',
    title: 'Sidewalk obstructions',
    layerUrl: `${ADA_URL}/9`,
    where: `TypePre IN (${Object.keys(OBSTRUCTION_DETAIL).map((type) => `'${type}'`).join(',')})`,
    outFields: ['OBJECTID', 'TypePre', 'CorridorID', 'RepairStatus'],
    marker: 'TypePre',
    fileName: 'city-obstructions.json',
  },
  {
    key: 'heat',
    title: 'Bus stops without a shelter, with surface temperature',
    layerUrl: HEAT_URL,
    where: '1=1',
    outFields: ['OBJECTID_1', 'StopID', 'busstop__4'],
    marker: 'busstop__4',
    fileName: 'city-heat.json',
  },
  {
    key: 'fountain',
    title: 'Drinking fountains in parks',
    layerUrl: FOUNTAIN_URL,
    where: '1=1',
    outFields: ['OBJECTID', 'ADA', 'Bottle_Filler', 'Chiller', 'Park'],
    marker: 'Bottle_Filler',
    fileName: 'city-fountains.json',
  },
  {
    key: 'restroom',
    title: 'Restrooms in parks',
    layerUrl: RESTROOM_URL,
    where: '1=1',
    outFields: ['OBJECTID', 'TYPE_', 'LIGHTING', 'ParkName', 'Address', 'Days', 'Hours'],
    marker: 'TYPE_',
    fileName: 'city-restrooms.json',
  },
  {
    key: 'food',
    title: 'Community food sites',
    layerUrl: FOOD_URL,
    where: '1=1',
    outFields: ['objectid', 'FoodResourceType', 'SiteName', 'Status', 'Address', 'ServicesProvided'],
    marker: 'FoodResourceType',
    // The list includes food banks in Mesa and Guadalupe, and two test rows in New York.
    skipOutside: true,
    fileName: 'city-food.json',
  },
];

/** The address that returns one page as JSON, in latitude and longitude. */
export function queryUrl(spec: PageSpec): string {
  const params = new URLSearchParams({
    where: spec.where,
    outFields: spec.outFields.join(','),
    returnGeometry: 'true',
    outSR: '4326',
    orderByFields: spec.outFields[0] ?? 'OBJECTID',
    resultRecordCount: String(PAGE_SIZE),
    f: 'json',
  });
  return `${spec.layerUrl}/query?${params.toString()}`;
}

// ---- Reading a saved page ----

type Attributes = Record<string, unknown>;

export interface Row {
  attributes: Attributes;
  lat: number;
  lng: number;
}

// A box around Tempe. A point outside it means the coordinates were not converted.
const BOX = { west: -112.07, south: 33.27, east: -111.84, north: 33.49 };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Which page this is, from the fields its rows have. Null when it is none of them. */
export function identifyPage(json: unknown): PageKey | null {
  if (!isObject(json) || !Array.isArray(json.features)) return null;
  const first: unknown = json.features[0];
  const attributes = isObject(first) && isObject(first.attributes) ? first.attributes : null;
  if (!attributes) return null;
  return PAGES.find((spec) => spec.marker in attributes)?.key ?? null;
}

/**
 * Checks a page and returns its rows. Throws, with the reason, on anything that could put a
 * record in the wrong place or leave some out: an error from the City's server, coordinates that
 * are not latitude and longitude, a page that was cut off, a repeated row, or a point outside Tempe.
 */
export function parsePage(spec: PageSpec, json: unknown): Row[] {
  const fail = (reason: string): never => {
    throw new Error(`${spec.title}: ${reason}`);
  };
  if (!isObject(json)) return fail('the file is not a JSON object.');
  if (isObject(json.error)) return fail(`the City's server answered with an error: ${String(json.error.message ?? 'unknown')}.`);
  if (!Array.isArray(json.features)) return fail('the file has no list of features.');
  if (json.exceededTransferLimit === true) return fail('the page was cut off, so some records are missing.');

  const reference = isObject(json.spatialReference) ? json.spatialReference : {};
  if (reference.wkid !== 4326 && reference.latestWkid !== 4326) {
    return fail('the coordinates are not latitude and longitude (the address must include outSR=4326).');
  }

  const idField = spec.outFields[0] ?? 'OBJECTID';
  const seen = new Set<unknown>();
  const rows: Row[] = [];
  for (const feature of json.features as unknown[]) {
    if (!isObject(feature) || !isObject(feature.attributes)) return fail('a feature has no attributes.');
    const id = feature.attributes[idField];
    if (id === undefined || id === null) return fail(`a feature has no ${idField}.`);
    if (seen.has(id)) return fail(`${idField} ${String(id)} appears twice.`);
    seen.add(id);

    // A row with no place cannot be drawn. The City has a few.
    if (!isObject(feature.geometry)) continue;
    const { x, y } = feature.geometry;
    if (typeof x !== 'number' || typeof y !== 'number') continue;
    if (x < BOX.west || x > BOX.east || y < BOX.south || y > BOX.north) {
      if (spec.skipOutside) continue;
      return fail(`${idField} ${String(id)} is outside Tempe (${y}, ${x}).`);
    }
    rows.push({ attributes: feature.attributes, lat: y, lng: x });
  }
  if (spec.skipOutside && rows.length === 0 && json.features.length > 0) {
    return fail('every row is outside Tempe, so the coordinates were probably not converted.');
  }
  return rows;
}

// ---- Turning rows into records ----

function text(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const trimmed = String(value).trim();
  return trimmed === '' || trimmed === '<Null>' || trimmed === 'N/A' ? null : trimmed;
}

function yesNo(value: unknown): boolean | undefined {
  const answer = text(value)?.toLowerCase();
  return answer === 'yes' ? true : answer === 'no' ? false : undefined;
}

const SHADE: Record<string, Shade> = { none: 'none', no: 'none', partial: 'partial', full: 'full', yes: 'yes' };

/** "7/26/2017 13:04" as 2017-07-26. Null for anything else. */
export function surveyDay(value: unknown): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(text(value) ?? '');
  if (!match) return null;
  const [, month = '', day = '', year = ''] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/** "S MILL AVE & W BROADWAY RD, SW corner" */
function corner(street1: unknown, street2: unknown, side: unknown): string | null {
  const streets = [text(street1), text(street2)].filter((street) => street !== null).join(' & ');
  if (streets === '') return null;
  const where = text(side);
  return where ? `${streets}, ${where} corner` : streets;
}

/** "E_BASELINE_RD_135" as "E BASELINE RD". The number is the City's section of the street. */
export function corridorName(value: unknown): string | null {
  const name = text(value)?.replace(/_\d+$/, '').replaceAll('_', ' ').trim();
  return name ? name : null;
}

function shorten(value: unknown, max: number): string | null {
  const full = text(value);
  if (full === null) return null;
  return full.length <= max ? full : `${full.slice(0, max - 1).trimEnd()}…`;
}

const round = (value: number, places: number) => Number(value.toFixed(places));
const awaiting = (row: Row) => row.attributes.RepairStatus === 'AW';

/**
 * The City keeps more than one row for some stops and corners: one per repair. Rows are grouped
 * by the City's id, and a place is kept only when every one of its rows is still awaiting
 * repair, so nothing the City has worked on is shown as untouched.
 */
function untouched(rows: Row[], layer: number): { id: string; row: Row }[] {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const id = text(row.attributes.ADA_ID) ?? `${layer}:${String(row.attributes.OBJECTID)}`;
    groups.set(id, [...(groups.get(id) ?? []), row]);
  }
  const kept: { id: string; row: Row }[] = [];
  for (const [id, group] of groups) {
    const first = group[0];
    if (first && group.every(awaiting)) kept.push({ id, row: first });
  }
  return kept;
}

/** Meters between two places. */
export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** A heat-study stop this close to a surveyed stop is taken to be the same stop. */
const HEAT_REACH_M = 40;

function nearestTemp(stop: { lat: number; lng: number }, heat: Row[]): number | undefined {
  let best: { meters: number; temp: number } | undefined;
  for (const row of heat) {
    const temp = row.attributes.busstop__4;
    if (typeof temp !== 'number') continue;
    const meters = haversineMeters(stop, row);
    if (meters <= HEAT_REACH_M && (!best || meters < best.meters)) best = { meters, temp };
  }
  return best ? Math.round(best.temp) : undefined;
}

// ---- Resources: helpful places ----

/** Rows this close together are taken to be one place: the two doors of one restroom building, or a site listed twice. */
const SAME_PLACE_M = 25;

/** Puts rows that are the same place together. `sameSort` says whether two rows could be: the same park, the same kind of site. */
function samePlaces(rows: Row[], sameSort: (a: Row, b: Row) => boolean): Row[][] {
  const places: Row[][] = [];
  for (const row of rows) {
    const place = places.find((group) => {
      const first = group[0];
      return first !== undefined && sameSort(first, row) && haversineMeters(first, row) <= SAME_PLACE_M;
    });
    if (place) place.push(row);
    else places.push([row]);
  }
  return places;
}

/** "2146 E. Apache Blvd. ,Tempe,Arizona,85281" as "2146 E. Apache Blvd., Tempe, Arizona, 85281" */
function tidyAddress(value: unknown): string | null {
  const parts = (text(value) ?? '').split(',').map((part) => part.trim()).filter((part) => part !== '');
  return parts.length > 0 ? parts.join(', ') : null;
}

const RESTROOM_ORDER: RestroomType[] = ['family', 'female', 'male'];

function restroomType(value: unknown): RestroomType | undefined {
  const type = text(value)?.toLowerCase() ?? '';
  return RESTROOM_ORDER.find((option) => type.startsWith(option));
}

function foodType(value: unknown): FoodType | undefined {
  const type = text(value) ?? '';
  if (type.startsWith('Food Distribution')) return 'distribution';
  if (type.startsWith('Produce Pickup')) return 'produce';
  if (type.startsWith('Farm Express')) return 'farm-bus';
  // School and community gardens, compost and seed libraries are not places to get food today.
  return undefined;
}

function buildResources(pages: Partial<Record<PageKey, Row[]>>): CityRecord[] {
  const records: CityRecord[] = [];
  const place = (row: Row) => ({ lat: round(row.lat, 6), lng: round(row.lng, 6) });
  const letter = (value: unknown) => (value === 'Y' ? true : value === 'N' ? false : undefined);

  for (const row of pages.fountain ?? []) {
    const a = row.attributes;
    const record: CityRecord = {
      id: `fountain:${String(a.OBJECTID)}`,
      kind: 'fountain',
      ...place(row),
      where: text(a.Park),
      surveyed: null,
      cityFix: null,
    };
    const ada = letter(a.ADA);
    const bottleFiller = letter(a.Bottle_Filler);
    const chilled = letter(a.Chiller);
    if (ada !== undefined) record.ada = ada;
    if (bottleFiller !== undefined) record.bottleFiller = bottleFiller;
    if (chilled !== undefined) record.chilled = chilled;
    records.push(record);
  }

  // The City has one row for each door. A building's doors become one record.
  const buildings = samePlaces(pages.restroom ?? [], (a, b) => text(a.attributes.ParkName) === text(b.attributes.ParkName));
  for (const doors of buildings) {
    const first = doors[0];
    if (!first) continue;
    const pick = (field: string) => doors.map((door) => text(door.attributes[field])).find((value) => value !== null) ?? null;
    const types = new Set(doors.map((door) => restroomType(door.attributes.TYPE_)).filter((type) => type !== undefined));
    const hours = [pick('Days'), pick('Hours')].filter((part) => part !== null).join(', ');
    const lit = yesNo(pick('LIGHTING'));
    const park = pick('ParkName');
    const address = tidyAddress(pick('Address'));
    const record: CityRecord = {
      id: `restroom:${String(first.attributes.OBJECTID)}`,
      kind: 'restroom',
      ...place(first),
      where: park && address ? `${park}, ${address}` : (park ?? address),
      surveyed: null,
      cityFix: null,
      restrooms: RESTROOM_ORDER.filter((type) => types.has(type)),
    };
    if (hours !== '') record.hours = hours;
    if (lit !== undefined) record.lit = lit;
    records.push(record);
  }

  const sites = (pages.food ?? [])
    .filter((row) => row.attributes.Status === 'Active')
    .map((row) => ({ row, type: foodType(row.attributes.FoodResourceType) }))
    .filter((site): site is { row: Row; type: FoodType } => site.type !== undefined);
  // Some sites are listed twice. The first row of each is kept.
  const listed = samePlaces(
    sites.map((site) => site.row),
    (a, b) => foodType(a.attributes.FoodResourceType) === foodType(b.attributes.FoodResourceType),
  );
  for (const [row] of listed) {
    if (!row) continue;
    const a = row.attributes;
    const type = foodType(a.FoodResourceType);
    const name = text(a.SiteName);
    if (!type || !name) continue;
    const record: CityRecord = {
      id: `food:${String(a.objectid)}`,
      kind: 'food',
      ...place(row),
      where: tidyAddress(a.Address),
      surveyed: null,
      cityFix: null,
      name,
      foodType: type,
    };
    const services = shorten(a.ServicesProvided, 240);
    if (services !== null) record.services = services;
    records.push(record);
  }
  return records;
}

const KIND_ORDER: CityRecordKind[] = ['bus-stop', 'curb-ramp', 'uneven-sidewalk', 'obstruction', 'gap', 'fountain', 'restroom', 'food'];

/** Every record the map shows, from the rows of each page. A page that was not given adds nothing. */
export function buildRecords(pages: Partial<Record<PageKey, Row[]>>): CityRecord[] {
  const records: CityRecord[] = [];
  const place = (row: Row) => ({ lat: round(row.lat, 6), lng: round(row.lng, 6) });
  const heat = pages.heat ?? [];

  for (const { id, row } of untouched(pages.transit ?? [], 0)) {
    const a = row.attributes;
    if (a.AA_OVERALL_Compliant !== 'No') continue;
    const record: CityRecord = {
      id,
      kind: 'bus-stop',
      ...place(row),
      where: corner(a.TS_Street1, a.TS_Street2, a.TS_LocInInt),
      surveyed: surveyDay(a.TS_SurveyDate),
      cityFix: shorten(a.AA_OVERALL_PossibleSol, 200),
    };
    const shelter = yesNo(a.TS_Shelter);
    const bench = yesNo(a.TS_Bench);
    const shade = SHADE[text(a.TS_Shade)?.toLowerCase() ?? ''];
    const surfaceTempF = nearestTemp(row, heat);
    if (shelter !== undefined) record.shelter = shelter;
    if (bench !== undefined) record.bench = bench;
    if (shade !== undefined) record.shade = shade;
    if (surfaceTempF !== undefined) record.surfaceTempF = surfaceTempF;
    records.push(record);
  }

  for (const { id, row } of untouched(pages.ramp ?? [], 3)) {
    const a = row.attributes;
    if (a.RP_Type !== 'NoRamp') continue;
    records.push({
      id,
      kind: 'curb-ramp',
      ...place(row),
      where: corner(a.RP_Street1, a.RP_Street2, a.RP_LocInInt),
      surveyed: surveyDay(a.RP_SurveyDate),
      cityFix: shorten(a.AA_OVERALL_PossibleSol, 200),
    });
  }

  for (const row of (pages.heaving ?? []).filter(awaiting)) {
    const a = row.attributes;
    if (a.BmpDescription !== HIGH_HEAVE) continue;
    const record: CityRecord = {
      id: `8:${String(a.OBJECTID)}`,
      kind: 'uneven-sidewalk',
      ...place(row),
      where: corridorName(a.CorridorID),
      surveyed: null,
      cityFix: null,
    };
    if (typeof a.BumpHt === 'number' && a.BumpHt > 0) record.heightIn = round(a.BumpHt, 1);
    records.push(record);
  }

  for (const row of (pages.obstruction ?? []).filter(awaiting)) {
    const a = row.attributes;
    const detail = OBSTRUCTION_DETAIL[text(a.TypePre) ?? ''];
    if (!detail) continue;
    records.push({
      id: `9:${String(a.OBJECTID)}`,
      kind: 'obstruction',
      ...place(row),
      where: corridorName(a.CorridorID),
      surveyed: null,
      cityFix: null,
      detail,
    });
  }

  for (const row of (pages.gap ?? []).filter(awaiting)) {
    const a = row.attributes;
    records.push({
      id: `7:${String(a.OBJECTID)}`,
      kind: 'gap',
      ...place(row),
      where: corridorName(a.CorridorID),
      surveyed: null,
      cityFix: null,
    });
  }

  records.push(...buildResources(pages));

  // A steady order, so copying the City's data again changes only the lines that really changed.
  return records.sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.id.localeCompare(b.id, 'en', { numeric: true }),
  );
}

export function countByKind(records: CityRecord[]): Record<CityRecordKind, number> {
  const counts: Record<CityRecordKind, number> = {
    'bus-stop': 0,
    'curb-ramp': 0,
    'uneven-sidewalk': 0,
    obstruction: 0,
    gap: 0,
    fountain: 0,
    restroom: 0,
    food: 0,
  };
  for (const record of records) counts[record.kind] += 1;
  return counts;
}
