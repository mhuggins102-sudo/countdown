import { createLetterPool } from '../data/letterFrequencies';
import type { Difficulty } from '../types/game';

export interface LetterPool {
  consonants: string[];
  vowels: string[];
  consonantIndex: number;
  vowelIndex: number;
}

export function createPool(): LetterPool {
  const { consonants, vowels } = createLetterPool();
  return { consonants, vowels, consonantIndex: 0, vowelIndex: 0 };
}

export function drawConsonant(pool: LetterPool): { letter: string; pool: LetterPool } {
  if (pool.consonantIndex >= pool.consonants.length) {
    // Reshuffle if exhausted (unlikely in a single game)
    const newPool = createPool();
    return { letter: newPool.consonants[0], pool: { ...newPool, consonantIndex: 1 } };
  }
  return {
    letter: pool.consonants[pool.consonantIndex],
    pool: { ...pool, consonantIndex: pool.consonantIndex + 1 },
  };
}

export function drawVowel(pool: LetterPool): { letter: string; pool: LetterPool } {
  if (pool.vowelIndex >= pool.vowels.length) {
    const newPool = createPool();
    return { letter: newPool.vowels[0], pool: { ...newPool, vowelIndex: 1 } };
  }
  return {
    letter: pool.vowels[pool.vowelIndex],
    pool: { ...pool, vowelIndex: pool.vowelIndex + 1 },
  };
}

export function selectNumbers(largeCount: number): number[] {
  const largeNumbers = [25, 50, 75, 100];
  const smallNumbers = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

  // Shuffle both pools
  const shuffledLarge = [...largeNumbers].sort(() => Math.random() - 0.5);
  const shuffledSmall = [...smallNumbers].sort(() => Math.random() - 0.5);

  const selected: number[] = [];
  for (let i = 0; i < largeCount; i++) {
    selected.push(shuffledLarge[i]);
  }
  for (let i = 0; i < 6 - largeCount; i++) {
    selected.push(shuffledSmall[i]);
  }

  return selected;
}

export interface NumberPool {
  largeNumbers: number[];
  smallNumbers: number[];
  largeIndex: number;
  smallIndex: number;
}

export function createNumberPool(): NumberPool {
  const largeNumbers = [25, 50, 75, 100].sort(() => Math.random() - 0.5);
  const smallNumbers = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10]
    .sort(() => Math.random() - 0.5);
  return { largeNumbers, smallNumbers, largeIndex: 0, smallIndex: 0 };
}

export function drawLargeNumber(pool: NumberPool): { number: number; pool: NumberPool } {
  const num = pool.largeNumbers[pool.largeIndex];
  return { number: num, pool: { ...pool, largeIndex: pool.largeIndex + 1 } };
}

export function drawSmallNumber(pool: NumberPool): { number: number; pool: NumberPool } {
  const num = pool.smallNumbers[pool.smallIndex];
  return { number: num, pool: { ...pool, smallIndex: pool.smallIndex + 1 } };
}

export function aiPickNumberType(
  currentNumbers: number[],
  largeCount: number,
  smallCount: number,
  difficulty: Difficulty,
): 'large' | 'small' {
  const total = currentNumbers.length;
  const remaining = 6 - total;

  // Can't pick more than 4 large
  if (largeCount >= 4) return 'small';
  // Must fill remaining with what's needed
  if (remaining <= 0) return 'small';

  // AI tendency based on difficulty
  const targetLarge = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 2 : 1;
  if (largeCount < targetLarge && Math.random() < 0.6) return 'large';
  return 'small';
}

export function generateTarget(): number {
  return Math.floor(Math.random() * 900) + 100; // 100-999
}

export function aiPickLetters(
  currentLetters: string[],
  consonantCount: number,
  vowelCount: number,
  _difficulty: Difficulty,
): 'consonant' | 'vowel' {
  const total = currentLetters.length;
  const remaining = 9 - total;
  const minVowelsNeeded = Math.max(0, 3 - vowelCount);
  const minConsonantsNeeded = Math.max(0, 4 - consonantCount);

  // Must pick vowel if we need them and won't have enough picks left
  if (remaining - minVowelsNeeded < 1 && minVowelsNeeded > 0) return 'vowel';
  if (remaining - minConsonantsNeeded < 1 && minConsonantsNeeded > 0) return 'consonant';

  // AI tends toward 4 vowels / 5 consonants
  if (vowelCount < 4 && Math.random() < 0.5) return 'vowel';
  return 'consonant';
}

export function aiPickLargeCount(difficulty: Difficulty): number {
  // AI picks based on difficulty - harder difficulty = fewer large numbers
  switch (difficulty) {
    case 'easy': return Math.random() < 0.7 ? 2 : 1;
    case 'medium': return Math.random() < 0.5 ? 2 : 1;
    case 'hard': return Math.random() < 0.6 ? 1 : 0;
  }
}
