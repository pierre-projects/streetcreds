// StreetCreds shared contract: constants.
// Imported by both web/ and api/. No dependencies.
// Agreed between Sarah and Pierre. Change only after both say yes.

export const APP_NAME = 'StreetCreds';

export const NEIGHBORHOODS = [
  { id: 'downtown-tempe', name: 'Downtown Tempe' },
  { id: 'asu-campus', name: 'ASU Campus' },
  { id: 'north-tempe', name: 'North Tempe' },
  { id: 'south-tempe', name: 'South Tempe' },
] as const;

export const CATEGORIES = ['pothole', 'streetlight', 'graffiti', 'blocked-sidewalk', 'other'] as const;

export const SEVERITIES = ['low', 'medium', 'high'] as const;

// Points paid for each quest type. The keys are the QuestType values.
export const POINTS = {
  'report-new': 50,
  'report-confirm': 20,
  council: 30,
  budget: 30,
} as const;

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

export const REPORT_LIMIT_PER_HOUR = 5;

// Two reports of the same category closer than this are the same problem (P2).
export const DUPLICATE_RADIUS_M = 30;

/** Default walking distance for a Local Deals proximity unlock. */
export const DEAL_UNLOCK_RADIUS_M = 200;

// Tempe, Arizona. Default center of the map.
export const MAP_CENTER = { lat: 33.4255, lng: -111.94 } as const;
