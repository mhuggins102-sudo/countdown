import { getDictionaryArray } from './wordValidator';

function letterFrequencyMap(letters: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const l of letters) {
    const upper = l.toUpperCase();
    map[upper] = (map[upper] || 0) + 1;
  }
  return map;
}

function canFormFromMap(word: string, available: Record<string, number>): boolean {
  const needed: Record<string, number> = {};
  for (const ch of word) {
    needed[ch] = (needed[ch] || 0) + 1;
    if (needed[ch] > (available[ch] || 0)) return false;
  }
  return true;
}

export function findAllValidWords(letters: string[]): string[] {
  const dict = getDictionaryArray();
  if (!dict) return [];

  const available = letterFrequencyMap(letters);
  const results: string[] = [];

  for (const word of dict) {
    if (word.length > letters.length) continue;
    if (canFormFromMap(word, available)) {
      results.push(word);
    }
  }

  return results; // Already sorted by descending length
}

export function findLongestWord(letters: string[]): string {
  const words = findAllValidWords(letters);
  return words.length > 0 ? words[0] : '';
}

export function findWordsOfLength(letters: string[], minLength: number, maxLength: number): string[] {
  const all = findAllValidWords(letters);
  return all.filter((w) => w.length >= minLength && w.length <= maxLength);
}
