import { describe, expect, it } from 'vitest';
import { isBlockedNickname, joinSpacedLetters } from './nickname';

describe('isBlockedNickname', () => {
  it('allows ordinary nicknames', () => {
    for (const name of ['Sam', 'Riya', 'Sun Devil', 'Trash Panda', 'Mr. Clean', 'Jo_Ann']) {
      expect(isBlockedNickname(name)).toBe(false);
    }
  });

  it('allows real names that contain a bad word', () => {
    for (const name of ['Dickson', 'Emily Dickinson', 'Analise', 'Penistone', 'Scunthorpe', 'Cassidy', 'Hancock']) {
      expect(isBlockedNickname(name)).toBe(false);
    }
  });

  it('allows a two-word name that only spells a bad word when joined', () => {
    expect(isBlockedNickname('Shi Tao')).toBe(false);
  });

  // Some words only match at a word edge, which is how the package lets Shitake through.
  // So "xXshitXx" passes; add a word to EXTRA_BLOCKED_WORDS if that becomes a problem.
  it('blocks a bad word in any case or inside a longer name', () => {
    for (const name of ['shit', 'SHIT', 'shitlord', 'xXfuckXx']) {
      expect(isBlockedNickname(name)).toBe(true);
    }
  });

  it('blocks leetspeak, look-alike letters and repeated letters', () => {
    for (const name of ['sh1t', 'a$$hole', 'b1tch', 'shiiiiit']) {
      expect(isBlockedNickname(name)).toBe(true);
    }
  });

  it('blocks a bad word spelled out letter by letter', () => {
    for (const name of ['s h i t', 's.h.i.t', 's_h_i_t', 's-h-i-t']) {
      expect(isBlockedNickname(name)).toBe(true);
    }
  });
});

describe('joinSpacedLetters', () => {
  it('joins runs of single letters and keeps longer words apart', () => {
    expect(joinSpacedLetters('s h i t')).toBe('shit');
    expect(joinSpacedLetters('Shi Tao')).toBe('Shi Tao');
    expect(joinSpacedLetters('Big s h i t energy')).toBe('Big shit energy');
    expect(joinSpacedLetters('  Sam  ')).toBe('Sam');
  });
});
