import { describe, expect, it } from 'vitest';
import { awardId } from './awardPoints';

// awardPoints itself talks to DynamoDB, so it is checked by hand, not here.
describe('awardId', () => {
  it('joins the quest type, the thing awarded for, and the player', () => {
    expect(awardId('report-new', 'report-1', 'player-1')).toBe('report-new#report-1#player-1');
  });

  it('is the same every time for the same award, which is what stops a double payment', () => {
    expect(awardId('council', 'item-2', 'player-9')).toBe(awardId('council', 'item-2', 'player-9'));
  });

  it('differs when the player, the quest or the item differs', () => {
    const base = awardId('council', 'item-2', 'player-9');
    expect(awardId('council', 'item-2', 'player-8')).not.toBe(base);
    expect(awardId('council', 'item-3', 'player-9')).not.toBe(base);
    expect(awardId('budget', 'item-2', 'player-9')).not.toBe(base);
  });
});
