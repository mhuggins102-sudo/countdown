export interface CompletedChallenge {
  code: string;
  completedAt: number;
  /** Which player you were */
  asPlayer: 1 | 2;
  p1Name: string;
  p1Score: number;
  p2Name: string;
  p2Score: number;
}

const STORAGE_KEY = 'countdown_challenges';

export function getCompletedChallenges(): CompletedChallenge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CompletedChallenge[];
  } catch {
    return [];
  }
}

export function saveCompletedChallenge(challenge: CompletedChallenge): void {
  const existing = getCompletedChallenges();
  // Don't duplicate
  if (existing.some((c) => c.code === challenge.code && c.asPlayer === challenge.asPlayer)) return;
  existing.unshift(challenge);
  // Keep at most 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
}
