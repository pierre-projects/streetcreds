import { describe, expect, it } from 'vitest';
import { CreateReportSchema, SubmitReportSchema } from './schemas';
import { locationMessages } from '../../../shared/location';

const location = { lat: 33.42, lng: -111.94, accuracyMeters: 20, capturedAt: new Date().toISOString() };

describe('CreateReportSchema', () => {
  it('accepts a valid body', () => {
    const result = CreateReportSchema.safeParse({
      playerId: 'player-1',
      photoKey: 'reports/player-1/photo.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing playerId with a message a player can read', () => {
    const result = CreateReportSchema.safeParse({ photoKey: 'reports/player-1/photo.jpg' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('A player id is required.');
    }
  });

  it('rejects an empty photoKey with a message a player can read', () => {
    const result = CreateReportSchema.safeParse({ playerId: 'player-1', photoKey: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('A photo key is required.');
    }
  });
});

describe('SubmitReportSchema', () => {
  it('accepts a valid body without category', () => {
    const result = SubmitReportSchema.safeParse({
      playerId: 'player-1',
      location,
    });
    expect(result.success).toBe(true);
  });

  it('accepts an optional category', () => {
    const result = SubmitReportSchema.safeParse({
      playerId: 'player-1',
      location,
      category: 'pothole',
    });
    expect(result.success).toBe(true);
  });

  it('rejects latitude out of range with a message a player can read', () => {
    const result = SubmitReportSchema.safeParse({
      playerId: 'player-1',
      location: { ...location, lat: 100 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(locationMessages.invalid);
    }
  });

  it('rejects longitude out of range with a message a player can read', () => {
    const result = SubmitReportSchema.safeParse({
      playerId: 'player-1',
      location: { ...location, lng: -200 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(locationMessages.invalid);
    }
  });

  it('rejects an unknown category with a message a player can read', () => {
    const result = SubmitReportSchema.safeParse({
      playerId: 'player-1',
      location,
      category: 'trash',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Pick one of the problem categories.');
    }
  });

  it('rejects the old arbitrary-pin request, even for an existing player', () => {
    const result = SubmitReportSchema.safeParse({ playerId: 'existing-player', lat: 33.42, lng: -111.94 });
    expect(result.success).toBe(false);
  });

  it.each([
    { ...location, accuracyMeters: -1 },
    { ...location, capturedAt: 'yesterday' },
    { ...location, lat: '33.42' },
    { ...location, accuracyMeters: undefined },
  ])('rejects a malformed reading: %j', (fix) => {
    expect(SubmitReportSchema.safeParse({ playerId: 'player-1', location: fix }).success).toBe(false);
  });
});
