import { describe, expect, it } from 'vitest';
import { awardId } from '../points/awardPoints';
import {
  COUNCIL_ITEMS,
  getCouncilItem,
  isCorrectCouncilAnswer,
  toCouncilItemView,
} from './councilItems';

describe('council.json', () => {
  it('has at least three real items with source links', () => {
    expect(COUNCIL_ITEMS.length).toBeGreaterThanOrEqual(3);
    for (const item of COUNCIL_ITEMS) {
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.sourceUrl.startsWith('https://')).toBe(true);
      expect(item.options.length).toBeGreaterThanOrEqual(3);
      expect(item.options.length).toBeLessThanOrEqual(4);
      expect(item.answerIndex).toBeGreaterThanOrEqual(0);
      expect(item.answerIndex).toBeLessThan(item.options.length);
    }
  });
});

describe('toCouncilItemView', () => {
  it('strips answerIndex so the phone never sees the answer', () => {
    const item = COUNCIL_ITEMS[0]!;
    const view = toCouncilItemView(item, false);
    expect(view).not.toHaveProperty('answerIndex');
    expect(JSON.stringify(view)).not.toContain('"answerIndex"');
    expect(view.id).toBe(item.id);
    expect(view.title).toBe(item.title);
    expect(view.summary).toBe(item.summary);
    expect(view.question).toBe(item.question);
    expect(view.options).toEqual(item.options);
    expect(view.sourceUrl).toBe(item.sourceUrl);
    expect(view.answered).toBe(false);
  });

  it('marks answered when the player already earned the award', () => {
    const item = COUNCIL_ITEMS[0]!;
    expect(toCouncilItemView(item, true).answered).toBe(true);
  });
});

describe('isCorrectCouncilAnswer', () => {
  it('accepts only the checked index so a wrong answer can be retried', () => {
    const item = COUNCIL_ITEMS[0]!;
    expect(isCorrectCouncilAnswer(item, item.answerIndex)).toBe(true);
    expect(isCorrectCouncilAnswer(item, item.answerIndex === 0 ? 1 : 0)).toBe(false);
  });
});

describe('award-once id', () => {
  it('uses awardId(council, itemId, playerId) so a second correct answer cannot pay twice', () => {
    const item = getCouncilItem(COUNCIL_ITEMS[0]!.id)!;
    const first = awardId('council', item.id, 'player-1');
    const second = awardId('council', item.id, 'player-1');
    expect(first).toBe(`council#${item.id}#player-1`);
    expect(first).toBe(second);
    expect(awardId('council', item.id, 'player-2')).not.toBe(first);
  });
});
