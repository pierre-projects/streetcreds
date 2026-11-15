import type { Partner } from '../../../../shared/types'

/** Same curated partners as api/src/deals/partners.json (demo fiction). */
export const mockPartners: Partner[] = [
  {
    id: 'mill-coffee',
    name: 'Mill Ave Coffee',
    neighborhood: 'downtown-tempe',
    category: 'cafe',
    lat: 33.4249,
    lng: -111.9402,
    radiusMeters: 200,
    baseCost: 100,
    unlockedCost: 50,
    offer: 'Free drip coffee',
  },
  {
    id: 'campus-bike',
    name: 'Campus Bike Co-op',
    neighborhood: 'asu-campus',
    category: 'bikes',
    lat: 33.4184,
    lng: -111.9312,
    radiusMeters: 200,
    baseCost: 150,
    unlockedCost: 75,
    offer: 'Tube patch',
  },
  {
    id: 'south-books',
    name: 'South Stack Books',
    neighborhood: 'south-tempe',
    category: 'bookstore',
    lat: 33.3918,
    lng: -111.9261,
    radiusMeters: 200,
    baseCost: 80,
    unlockedCost: 40,
    offer: '$2 off any used book',
  },
  {
    id: 'north-pizza',
    name: 'North Slice',
    neighborhood: 'north-tempe',
    category: 'food',
    lat: 33.4512,
    lng: -111.9248,
    radiusMeters: 200,
    baseCost: 120,
    unlockedCost: 60,
    offer: 'Free garlic knots',
  },
]

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const earth = 6_371_000
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)))
}
