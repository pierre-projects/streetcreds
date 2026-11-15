import { describe, expect, it } from 'vitest';
import { CreatePlayerSchema, GoogleSignInSchema } from './schemas';
import { locationMessages } from '../../../shared/location';

const location = { lat: 33.418, lng: -111.934, accuracyMeters: 20, capturedAt: new Date().toISOString() };
const parse = (nickname: unknown, fix: unknown = location) =>
  CreatePlayerSchema.safeParse({ nickname, location: fix });

describe('CreatePlayerSchema', () => {
  it('rejects a nickname of 1 character', () => {
    expect(parse('A').success).toBe(false);
  });

  it('accepts a nickname of 2 characters', () => {
    expect(parse('Al').success).toBe(true);
  });

  it('accepts a nickname of 20 characters', () => {
    expect(parse('A'.repeat(20)).success).toBe(true);
  });

  it('rejects a nickname of 21 characters', () => {
    expect(parse('A'.repeat(21)).success).toBe(false);
  });

  it('trims the nickname before measuring it', () => {
    const padded = parse('  Sam  ');
    expect(padded.success && padded.data.nickname).toBe('Sam');
    expect(parse(' A ').success).toBe(false);
  });

  it('rejects an offensive nickname with a message a player can read', () => {
    const result = parse('sh1t');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Pick a different nickname.');
    }
    expect(parse('Dickson').success).toBe(true);
  });

  it('rejects a missing location even when a neighborhood is supplied', () => {
    expect(CreatePlayerSchema.safeParse({ nickname: 'Sam', neighborhood: 'asu-campus' }).success).toBe(false);
    expect(parse('Sam', 'mesa').success).toBe(false);
  });

  it('rejects a missing nickname or location', () => {
    expect(CreatePlayerSchema.safeParse({ location }).success).toBe(false);
    expect(CreatePlayerSchema.safeParse({ nickname: 'Sam' }).success).toBe(false);
    expect(CreatePlayerSchema.safeParse(null).success).toBe(false);
  });

  it('gives a message a player can read', () => {
    const result = parse('A');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Nickname must be 2 to 20 characters.');
    }
    const badPlace = parse('Sam', 'mesa');
    if (!badPlace.success) {
      expect(badPlace.error.issues[0]?.message).toBe(locationMessages.required);
    }
  });

  it('never passes a supplied neighborhood to the route', () => {
    const result = CreatePlayerSchema.parse({ nickname: 'Sam', location, neighborhood: 'south-tempe' });
    expect(result).not.toHaveProperty('neighborhood');
    expect(result.location).toEqual(location);
  });
});

describe('CreatePlayerSchema with Google', () => {
  it('joins as a guest when there is no credential', () => {
    expect(CreatePlayerSchema.parse({ nickname: 'Sam', location })).not.toHaveProperty('credential');
  });

  it('passes a credential through for "Continue with Google"', () => {
    expect(CreatePlayerSchema.parse({ nickname: 'Sam', location, credential: 'a.b.c' }).credential).toBe('a.b.c');
  });

  it('rejects an empty credential', () => {
    expect(CreatePlayerSchema.safeParse({ nickname: 'Sam', location, credential: '' }).success).toBe(false);
  });
});

describe('GoogleSignInSchema', () => {
  it('accepts a credential on its own, from a device with no player', () => {
    expect(GoogleSignInSchema.parse({ credential: 'a.b.c' })).toEqual({ credential: 'a.b.c' });
  });

  it('accepts the guest player on the device', () => {
    expect(GoogleSignInSchema.parse({ credential: 'a.b.c', playerId: 'guest-1' }).playerId).toBe('guest-1');
  });

  it('rejects a missing or empty credential with a message a player can read', () => {
    for (const body of [{}, { credential: '' }, { credential: 42 }, null]) {
      const result = GoogleSignInSchema.safeParse(body);
      expect(result.success).toBe(false);
    }
    const result = GoogleSignInSchema.safeParse({ credential: '' });
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Google sign-in did not work. Try again.');
  });

  it('rejects an empty player id', () => {
    expect(GoogleSignInSchema.safeParse({ credential: 'a.b.c', playerId: '' }).success).toBe(false);
  });
});
