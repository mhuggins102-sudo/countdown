/**
 * Auto-generates letters and numbers for Beat the Clock mode.
 * No player picking — tiles appear instantly.
 */

import { createPool, drawConsonant, drawVowel, type LetterPool } from './letterPicker';
import { selectNumbers, generateTarget } from './letterPicker';

/**
 * Generate 9 letters with a random vowel/consonant distribution.
 * Valid distributions: 3V/6C, 4V/5C, 5V/4C — equally likely.
 */
export function generateBtcLetters(): string[] {
  const vowelCounts = [3, 4, 5];
  const vowelCount = vowelCounts[Math.floor(Math.random() * vowelCounts.length)];
  const consonantCount = 9 - vowelCount;

  let pool: LetterPool = createPool();
  const letters: string[] = [];

  for (let i = 0; i < consonantCount; i++) {
    const result = drawConsonant(pool);
    letters.push(result.letter);
    pool = result.pool;
  }
  for (let i = 0; i < vowelCount; i++) {
    const result = drawVowel(pool);
    letters.push(result.letter);
    pool = result.pool;
  }

  // Shuffle so vowels and consonants are mixed
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  return letters;
}

/**
 * Generate 6 numbers with a random large/small distribution.
 * Large count 0-4, equally likely.
 */
export function generateBtcNumbers(): { numbers: number[]; target: number; largeCount: number } {
  const largeCount = Math.floor(Math.random() * 5); // 0-4
  const numbers = selectNumbers(largeCount);
  const target = generateTarget();
  return { numbers, target, largeCount };
}

/** Time bonus for a letters word of given length */
export function lettersBtcBonus(wordLength: number): number {
  if (wordLength <= 4) return -5;
  if (wordLength === 5) return 5;
  if (wordLength === 6) return 10;
  if (wordLength === 7) return 20;
  if (wordLength === 8) return 30;
  // 9 letters
  return 40;
}

/** Time bonus for a numbers answer at given distance from target */
export function numbersBtcBonus(distance: number): number {
  if (distance === 0) return 30;
  if (distance <= 1) return 25;
  if (distance <= 2) return 20;
  if (distance <= 3) return 15;
  if (distance <= 5) return 10;
  if (distance <= 10) return 5;
  if (distance <= 14) return 0;
  return -5;
}

/** Conundrum always gives 30s for a correct answer */
export const CONUNDRUM_BTC_BONUS = 30;
