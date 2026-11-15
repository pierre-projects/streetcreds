// Catches offensive nicknames. Runs on the laptop or in the Lambda, with no outside service.
// The word list and the tricks it sees through (leetspeak, look-alike letters, repeated
// letters) come from the obscenity package. It already allows many real words that contain
// a bad one, such as Scunthorpe or Cassidy.
import { englishDataset, englishRecommendedTransformers, RegExpMatcher } from 'obscenity';

const dataset = englishDataset.build();

// Real names the package blocks by mistake. Add to this list when a real name is refused.
const ALLOWED_NAMES = ['dickson', 'dickinson', 'dickens', 'analise', 'analisa', 'annalise', 'penistone'];

// Words the package misses. Lowercase letters only; a nickname that contains one anywhere,
// once its spaces, digits and punctuation are removed, is refused.
const EXTRA_BLOCKED_WORDS: string[] = [];

const matcher = new RegExpMatcher({
  ...dataset,
  whitelistedTerms: [...(dataset.whitelistedTerms ?? []), ...ALLOWED_NAMES],
  ...englishRecommendedTransformers,
});

/** Shown on the leaderboard in place of a nickname that fails the check. */
export const HIDDEN_NICKNAME = 'Player';

export const NICKNAME_BLOCKED_MESSAGE = 'Pick a different nickname.';

/** True when the nickname contains a word the game does not allow. */
export function isBlockedNickname(nickname: string): boolean {
  if (matcher.hasMatch(nickname) || matcher.hasMatch(joinSpacedLetters(nickname))) {
    return true;
  }
  const lettersOnly = nickname.toLowerCase().replace(/[^a-z]/g, '');
  return EXTRA_BLOCKED_WORDS.some((word) => lettersOnly.includes(word));
}

/**
 * Joins runs of single letters, so "f u c k" and "f.u.c.k" are checked as one word.
 * Longer words stay apart: joining every word would turn a real name like "Shi Tao" into a match.
 */
export function joinSpacedLetters(nickname: string): string {
  let joined = '';
  let previousWasLetter = false;
  for (const part of nickname.split(/[\s._-]+/).filter(Boolean)) {
    const isLetter = part.length === 1;
    joined += joined && !(isLetter && previousWasLetter) ? ` ${part}` : part;
    previousWasLetter = isLetter;
  }
  return joined;
}
