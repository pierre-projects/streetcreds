import { describe, expect, it } from 'vitest';
import { distanceMeters } from './distance';

describe('distanceMeters', () => {
  it('is ~0 for the same point', () => {
    expect(distanceMeters({ lat: 33.4255, lng: -111.94 }, { lat: 33.4255, lng: -111.94 })).toBeLessThan(1);
  });

  it('is under 200 m for a short Mill Ave walk', () => {
    const cafe = { lat: 33.4249, lng: -111.9402 };
    const nearby = { lat: 33.4255, lng: -111.9402 };
    expect(distanceMeters(cafe, nearby)).toBeLessThan(200);
  });

  it('is over 200 m across campus', () => {
    const cafe = { lat: 33.4249, lng: -111.9402 };
    const campus = { lat: 33.4184, lng: -111.9312 };
    expect(distanceMeters(cafe, campus)).toBeGreaterThan(200);
  });
});
