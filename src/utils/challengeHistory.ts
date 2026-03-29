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

export interface PendingChallenge {
  code: string;
  createdAt: number;
  playerScore: number;
}

const STORAGE_KEY = 'countdown_challenges';
const PENDING_KEY = 'countdown_pending_challenges';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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
  // Remove from pending if it was there
  removePendingChallenge(challenge.code);
}

export function getPendingChallenges(): PendingChallenge[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as PendingChallenge[];
    // Filter out expired (older than 1 week)
    const valid = all.filter((c) => Date.now() - c.createdAt < ONE_WEEK_MS);
    // Filter out any that have since been completed
    const completed = getCompletedChallenges();
    const completedCodes = new Set(completed.map((c) => c.code));
    return valid.filter((c) => !completedCodes.has(c.code));
  } catch {
    return [];
  }
}

export function savePendingChallenge(challenge: PendingChallenge): void {
  const existing = getPendingChallenges();
  if (existing.some((c) => c.code === challenge.code)) return;
  existing.unshift(challenge);
  localStorage.setItem(PENDING_KEY, JSON.stringify(existing.slice(0, 50)));
}

function removePendingChallenge(code: string): void {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    const all = JSON.parse(raw) as PendingChallenge[];
    const filtered = all.filter((c) => c.code !== code);
    localStorage.setItem(PENDING_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}
