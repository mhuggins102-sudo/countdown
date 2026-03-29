// Official Countdown tile distributions

export const CONSONANT_DISTRIBUTION: Record<string, number> = {
  B: 2, C: 3, D: 6, F: 2, G: 3, H: 2, J: 1, K: 1,
  L: 5, M: 4, N: 8, P: 4, Q: 1, R: 9, S: 9, T: 9,
  V: 1, W: 1, X: 1, Y: 1, Z: 1,
};

export const VOWEL_DISTRIBUTION: Record<string, number> = {
  A: 15, E: 21, I: 13, O: 13, U: 5,
};

export function createLetterPool(rng: () => number = Math.random): { consonants: string[]; vowels: string[] } {
  const consonants: string[] = [];
  const vowels: string[] = [];

  for (const [letter, count] of Object.entries(CONSONANT_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) consonants.push(letter);
  }
  for (const [letter, count] of Object.entries(VOWEL_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) vowels.push(letter);
  }

  return { consonants: shuffle(consonants, rng), vowels: shuffle(vowels, rng) };
}

function shuffle<T>(array: T[], rng: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
