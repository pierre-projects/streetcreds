import { describe, expect, it } from 'vitest';
import { CreatePlayerSchema } from './schemas';

const parse = (nickname: unknown, neighborhood: unknown = 'asu-campus') =>
  CreatePlayerSchema.safeParse({ nickname, neighborhood });

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

  it('rejects an unknown neighborhood', () => {
    expect(parse('Sam', 'mesa').success).toBe(false);
  });

  it('rejects a missing nickname or neighborhood', () => {
    expect(CreatePlayerSchema.safeParse({ neighborhood: 'asu-campus' }).success).toBe(false);
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
      expect(badPlace.error.issues[0]?.message).toBe('Pick one of the four neighborhoods.');
    }
  });
});
