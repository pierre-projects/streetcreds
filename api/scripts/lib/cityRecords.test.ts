import { describe, expect, it } from 'vitest';
import {
  buildRecords,
  corridorName,
  countByKind,
  haversineMeters,
  identifyPage,
  type PageKey,
  PAGES,
  type PageSpec,
  parsePage,
  queryUrl,
  type Row,
  surveyDay,
} from './cityRecords';

function spec(key: PageKey): PageSpec {
  const found = PAGES.find((page) => page.key === key);
  if (!found) throw new Error(`no page ${key}`);
  return found;
}

const WGS84 = { wkid: 4326, latestWkid: 4326 };

function page(features: unknown[], extra: Record<string, unknown> = {}) {
  return { spatialReference: WGS84, features, ...extra };
}

function row(attributes: Record<string, unknown>, lat = 33.42, lng = -111.94): Row {
  return { attributes, lat, lng };
}

describe('queryUrl', () => {
  it('asks for latitude and longitude, as JSON, and never for a person', () => {
    for (const each of PAGES) {
      const url = new URL(queryUrl(each));
      expect(url.searchParams.get('outSR')).toBe('4326');
      expect(url.searchParams.get('f')).toBe('json');
      expect(url.searchParams.get('outFields')).not.toMatch(/\*|Surveyor|Contact|Reviw|Review|email/i);
    }
  });
});

describe('identifyPage', () => {
  it('tells the pages apart by their fields', () => {
    expect(identifyPage(page([{ attributes: { OBJECTID: 1, TS_Street1: 'CENTER' } }]))).toBe('transit');
    expect(identifyPage(page([{ attributes: { OBJECTID: 1, RP_Street1: 'MILL' } }]))).toBe('ramp');
    expect(identifyPage(page([{ attributes: { OBJECTID: 1, Depth: 2 } }]))).toBe('gap');
    expect(identifyPage(page([{ attributes: { OBJECTID: 1, BumpHt: 1.2 } }]))).toBe('heaving');
    expect(identifyPage(page([{ attributes: { OBJECTID: 1, TypePre: 'Vegetation_Obs' } }]))).toBe('obstruction');
    expect(identifyPage(page([{ attributes: { OBJECTID_1: 1, busstop__4: 120 } }]))).toBe('heat');
    expect(identifyPage(page([{ attributes: { OBJECTID: 1, Bottle_Filler: 'Y' } }]))).toBe('fountain');
    expect(identifyPage(page([{ attributes: { OBJECTID: 1, TYPE_: 'Family Restroom' } }]))).toBe('restroom');
    expect(identifyPage(page([{ attributes: { objectid: 1, FoodResourceType: 'Produce Pickup' } }]))).toBe('food');
  });

  it('gives null for anything else', () => {
    expect(identifyPage(page([{ attributes: { OBJECTID: 1, name: 'x' } }]))).toBeNull();
    expect(identifyPage(page([]))).toBeNull();
    expect(identifyPage('<html>Just a moment...</html>')).toBeNull();
  });
});

describe('parsePage', () => {
  const gap = spec('gap');
  const feature = (id: number, x = -111.94, y = 33.42) => ({ attributes: { OBJECTID: id, Depth: 1 }, geometry: { x, y } });

  it('returns each row with its place', () => {
    expect(parsePage(gap, page([feature(1), feature(2, -111.93, 33.41)]))).toEqual([
      { attributes: { OBJECTID: 1, Depth: 1 }, lat: 33.42, lng: -111.94 },
      { attributes: { OBJECTID: 2, Depth: 1 }, lat: 33.41, lng: -111.93 },
    ]);
  });

  it('leaves out a row with no place', () => {
    expect(parsePage(gap, page([feature(1), { attributes: { OBJECTID: 2, Depth: 1 }, geometry: null }]))).toHaveLength(1);
  });

  it("refuses an error from the City's server", () => {
    expect(() => parsePage(gap, { error: { code: 400, message: 'Invalid query' } })).toThrow(/Invalid query/);
  });

  it('refuses coordinates that are not latitude and longitude', () => {
    expect(() => parsePage(gap, page([feature(1)], { spatialReference: { wkid: 2868 } }))).toThrow(/outSR=4326/);
  });

  it('refuses a page that was cut off', () => {
    expect(() => parsePage(gap, page([feature(1)], { exceededTransferLimit: true }))).toThrow(/cut off/);
  });

  it('refuses a repeated row', () => {
    expect(() => parsePage(gap, page([feature(1), feature(1)]))).toThrow(/appears twice/);
  });

  it('refuses a point outside Tempe', () => {
    expect(() => parsePage(gap, page([feature(1, 700000, 880000)]))).toThrow(/outside Tempe/);
  });
});

describe('surveyDay and corridorName', () => {
  it('reads the survey date the City writes', () => {
    expect(surveyDay('7/26/2017 13:04')).toBe('2017-07-26');
    expect(surveyDay('2/1/2016 10:56')).toBe('2016-02-01');
    expect(surveyDay('')).toBeNull();
    expect(surveyDay(null)).toBeNull();
  });

  it('turns a corridor id into a street name', () => {
    expect(corridorName('E_BASELINE_RD_135')).toBe('E BASELINE RD');
    expect(corridorName(null)).toBeNull();
  });
});

describe('haversineMeters', () => {
  it('measures a short distance in Tempe', () => {
    // One thousandth of a degree of latitude is about 111 m anywhere.
    expect(haversineMeters({ lat: 33.42, lng: -111.94 }, { lat: 33.421, lng: -111.94 })).toBeCloseTo(111.2, 0);
    expect(haversineMeters({ lat: 33.42, lng: -111.94 }, { lat: 33.42, lng: -111.94 })).toBe(0);
  });
});

describe('buildRecords', () => {
  const stop = (id: number, adaId: string, status: string, more: Record<string, unknown> = {}) =>
    row({
      OBJECTID: id,
      ADA_ID: adaId,
      TS_Street1: 'CENTER',
      TS_Street2: 'PRIEST',
      TS_LocInInt: 'NE',
      TS_SurveyDate: '7/26/2017 13:04',
      TS_Shelter: 'No',
      TS_Bench: 'Yes',
      TS_Shade: 'None',
      RepairStatus: status,
      AA_OVERALL_Compliant: 'No',
      AA_OVERALL_PossibleSol: 'Adjust Sign Height.',
      ...more,
    });

  it('builds a bus stop, with the temperature of the heat-study stop beside it', () => {
    const records = buildRecords({
      transit: [stop(1, '660515171927', 'AW')],
      // About 11 m away, and one far too far away to be the same stop.
      heat: [row({ OBJECTID_1: 1, busstop__4: 121.6 }, 33.4201, -111.94), row({ OBJECTID_1: 2, busstop__4: 104 }, 33.43, -111.94)],
    });
    expect(records).toEqual([
      {
        id: '660515171927',
        kind: 'bus-stop',
        lat: 33.42,
        lng: -111.94,
        where: 'CENTER & PRIEST, NE corner',
        surveyed: '2017-07-26',
        cityFix: 'Adjust Sign Height.',
        shelter: false,
        bench: true,
        shade: 'none',
        surfaceTempF: 122,
      },
    ]);
  });

  it('leaves out a stop the City has worked on, even when one of its rows is still awaiting repair', () => {
    const records = buildRecords({ transit: [stop(1, 'A', 'AW'), stop(2, 'A', 'RP'), stop(3, 'B', 'AW')] });
    expect(records.map((record) => record.id)).toEqual(['B']);
  });

  it('leaves out a stop that meets the ADA', () => {
    expect(buildRecords({ transit: [stop(1, 'A', 'AW', { AA_OVERALL_Compliant: 'Yes' })] })).toEqual([]);
  });

  it('keeps only corners with no ramp that are awaiting repair', () => {
    const ramp = (id: number, adaId: string, type: string, status: string) =>
      row({ OBJECTID: id, ADA_ID: adaId, RP_Street1: 'S MILL AVE', RP_Street2: 'W BROADWAY RD', RP_LocInInt: 'SW', RP_Type: type, RP_SurveyDate: '5/19/2017 13:26', RepairStatus: status, AA_OVERALL_PossibleSol: null });
    const records = buildRecords({ ramp: [ramp(1, 'A', 'NoRamp', 'AW'), ramp(2, 'B', 'NoRamp', 'RD'), ramp(3, 'C', 'PerpRamp', 'AW')] });
    expect(records).toEqual([
      { id: 'A', kind: 'curb-ramp', lat: 33.42, lng: -111.94, where: 'S MILL AVE & W BROADWAY RD, SW corner', surveyed: '2017-05-19', cityFix: null },
    ]);
  });

  it('builds sidewalk findings from the corridor layers', () => {
    const records = buildRecords({
      heaving: [
        row({ OBJECTID: 5, BmpDescription: 'Heaving >= 1 in', BumpHt: 1.26, CorridorID: 'S_MILL_AVE_130', RepairStatus: 'AW' }),
        row({ OBJECTID: 6, BmpDescription: 'Heaving < 1 in', BumpHt: 0.4, CorridorID: 'S_MILL_AVE_130', RepairStatus: 'AW' }),
        row({ OBJECTID: 7, BmpDescription: 'Heaving >= 1 in', BumpHt: 2, CorridorID: 'S_MILL_AVE_130', RepairStatus: 'RE' }),
      ],
      obstruction: [
        row({ OBJECTID: 1, TypePre: 'Vegetation_Obs', CorridorID: 'E_BASELINE_RD_135', RepairStatus: 'AW' }),
        row({ OBJECTID: 2, TypePre: 'Commercial_Driveway', CorridorID: 'E_BASELINE_RD_135', RepairStatus: 'AW' }),
      ],
      gap: [row({ OBJECTID: 9, Width: 3, Depth: 2, CorridorID: 'W_UNIVERSITY_DR_115', RepairStatus: 'AW' })],
    });
    expect(records).toEqual([
      { id: '8:5', kind: 'uneven-sidewalk', lat: 33.42, lng: -111.94, where: 'S MILL AVE', surveyed: null, cityFix: null, heightIn: 1.3 },
      { id: '9:1', kind: 'obstruction', lat: 33.42, lng: -111.94, where: 'E BASELINE RD', surveyed: null, cityFix: null, detail: 'plants' },
      { id: '7:9', kind: 'gap', lat: 33.42, lng: -111.94, where: 'W UNIVERSITY DR', surveyed: null, cityFix: null },
    ]);
    expect(countByKind(records)).toEqual({
      'bus-stop': 0,
      'curb-ramp': 0,
      'uneven-sidewalk': 1,
      obstruction: 1,
      gap: 1,
      fountain: 0,
      restroom: 0,
      food: 0,
    });
  });

  it('builds a drinking fountain', () => {
    const records = buildRecords({ fountain: [row({ OBJECTID: 2, ADA: 'Y', Bottle_Filler: 'N', Chiller: null, Park: 'Clark ' })] });
    expect(records).toEqual([
      { id: 'fountain:2', kind: 'fountain', lat: 33.42, lng: -111.94, where: 'Clark', surveyed: null, cityFix: null, ada: true, bottleFiller: false },
    ]);
  });

  it('makes one restroom of the doors of one building', () => {
    const door = (id: number, type: string, park: string, lat: number, more: Record<string, unknown> = {}) =>
      row({ OBJECTID: id, TYPE_: type, LIGHTING: 'Yes', ParkName: park, Address: null, Days: '7 days a week', Hours: '6 a.m. - 12 a.m.', ...more }, lat);
    const records = buildRecords({
      restroom: [
        door(1, 'Male Restroom', 'Jaycee Park', 33.42527, { Address: '5th St. and Hardy Dr., Tempe, AZ 85281' }),
        // About 3 m from the first: the same building.
        door(2, 'Female Restroom', 'Jaycee Park', 33.4253),
        // About 360 m away: another building in the same park.
        door(3, 'Family', 'Jaycee Park', 33.4285, { Days: null, Hours: null, LIGHTING: 'No' }),
      ],
    });
    expect(records).toEqual([
      {
        id: 'restroom:1',
        kind: 'restroom',
        lat: 33.42527,
        lng: -111.94,
        where: 'Jaycee Park, 5th St. and Hardy Dr., Tempe, AZ 85281',
        surveyed: null,
        cityFix: null,
        restrooms: ['female', 'male'],
        hours: '7 days a week, 6 a.m. - 12 a.m.',
        lit: true,
      },
      { id: 'restroom:3', kind: 'restroom', lat: 33.4285, lng: -111.94, where: 'Jaycee Park', surveyed: null, cityFix: null, restrooms: ['family'], lit: false },
    ]);
  });

  it('keeps active places to get food, once each', () => {
    const site = (id: number, type: string | null, name: string, status: string, lat = 33.42) =>
      row({ objectid: id, FoodResourceType: type, SiteName: name, Status: status, Address: '2146 E. Apache Blvd. ,Tempe,Arizona,85281', ServicesProvided: 'Food boxes, Monday 9am-11am' }, lat);
    const records = buildRecords({
      food: [
        site(1, 'Food Distribution & Emergency Food Access', 'Community Pantry', 'Active'),
        site(2, 'Food Distribution & Emergency Food Access', 'Community Pantry (again)', 'Active'),
        site(3, 'Produce Pickup', 'Farm Bags', 'Inactive', 33.43),
        site(4, 'School Garden', 'School Garden', 'Active', 33.44),
        site(5, null, 'No type', 'Active', 33.45),
        site(6, 'Farm Express Bus Stop', 'Farm Express Bus', 'Active', 33.46),
      ],
    });
    expect(records).toEqual([
      {
        id: 'food:1',
        kind: 'food',
        lat: 33.42,
        lng: -111.94,
        where: '2146 E. Apache Blvd., Tempe, Arizona, 85281',
        surveyed: null,
        cityFix: null,
        name: 'Community Pantry',
        foodType: 'distribution',
        services: 'Food boxes, Monday 9am-11am',
      },
      expect.objectContaining({ id: 'food:6', foodType: 'farm-bus', name: 'Farm Express Bus' }),
    ]);
  });
});

describe('a page that lists places beyond Tempe', () => {
  const food = spec('food');
  const feature = (id: number, x: number, y: number) => ({ attributes: { objectid: id, FoodResourceType: 'Produce Pickup' }, geometry: { x, y } });

  it('leaves out the rows outside Tempe', () => {
    expect(parsePage(food, page([feature(1, -111.94, 33.42), feature(2, -73.94, 42.82)]))).toHaveLength(1);
  });

  it('is refused when every row is outside', () => {
    expect(() => parsePage(food, page([feature(1, 700000, 880000)]))).toThrow(/every row is outside/);
  });
});
