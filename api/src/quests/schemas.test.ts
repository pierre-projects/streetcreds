import { describe, expect, it } from 'vitest';
import { CreateReportSchema, SubmitReportSchema } from './schemas';

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
      lat: 33.42,
      lng: -111.94,
    });
    expect(result.success).toBe(true);
  });

  it('accepts an optional category', () => {
    const result = SubmitReportSchema.safeParse({
      playerId: 'player-1',
      lat: 33.42,
      lng: -111.94,
      category: 'pothole',
    });
    expect(result.success).toBe(true);
  });

  it('rejects latitude out of range with a message a player can read', () => {
    const result = SubmitReportSchema.safeParse({
      playerId: 'player-1',
      lat: 100,
      lng: -111.94,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Latitude must be between -90 and 90.');
    }
  });

  it('rejects longitude out of range with a message a player can read', () => {
    const result = SubmitReportSchema.safeParse({
      playerId: 'player-1',
      lat: 33.42,
      lng: -200,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Longitude must be between -180 and 180.');
    }
  });

  it('rejects an unknown category with a message a player can read', () => {
    const result = SubmitReportSchema.safeParse({
      playerId: 'player-1',
      lat: 33.42,
      lng: -111.94,
      category: 'trash',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Pick one of the problem categories.');
    }
  });
});
