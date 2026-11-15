// Council quest content: bundled JSON plus helpers that never leak answerIndex.
import type { CouncilItem, CouncilItemView } from '../../../shared/types';
import councilJson from './council.json';

export const COUNCIL_ITEMS: CouncilItem[] = councilJson as CouncilItem[];

export function getCouncilItem(itemId: string): CouncilItem | undefined {
  return COUNCIL_ITEMS.find((item) => item.id === itemId);
}

/** Public shape for the phone: no answerIndex, plus whether this player already earned it. */
export function toCouncilItemView(item: CouncilItem, answered: boolean): CouncilItemView {
  const { answerIndex: _answerIndex, ...rest } = item;
  return { ...rest, answered };
}

/** True when the player's choice matches the checked answer. Wrong answers may be retried. */
export function isCorrectCouncilAnswer(item: CouncilItem, answerIndex: number): boolean {
  return answerIndex === item.answerIndex;
}
