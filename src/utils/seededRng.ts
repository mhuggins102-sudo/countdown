/**
 * Seeded pseudo-random number generator using mulberry32.
 * Produces deterministic sequences from a 32-bit seed.
 */
export function createSeededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a random seed from crypto or Math.random */
export function generateSeed(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return (Math.random() * 4294967296) >>> 0;
}

/** Generate a short alphanumeric game code from a seed */
export function seedToCode(seed: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for clarity
  let code = '';
  let n = seed >>> 0;
  for (let i = 0; i < 6; i++) {
    code += chars[n % chars.length];
    n = Math.floor(n / chars.length);
  }
  return code;
}

/** Convert a game code back to a seed (for URL-based seeds) */
export function codeToSeed(code: string): number {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let seed = 0;
  let multiplier = 1;
  for (let i = 0; i < code.length; i++) {
    const idx = chars.indexOf(code[i]);
    if (idx === -1) return 0;
    seed += idx * multiplier;
    multiplier *= chars.length;
  }
  return seed >>> 0;
}

/** Seeded Fisher-Yates shuffle */
export function seededShuffle<T>(array: T[], rng: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
