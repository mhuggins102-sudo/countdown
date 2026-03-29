import type { ChallengeRoundResult } from '../types/game';

const API_BASE = '/api/challenge';

interface ChallengeRecord {
  seed: number;
  code: string;
  timerDuration: number;
  createdAt: number;
  p1Name: string;
  p1Results: ChallengeRoundResult[];
  p1TotalScore: number;
  p2Name?: string;
  p2Results?: ChallengeRoundResult[];
  p2TotalScore?: number;
}

export async function createChallenge(data: {
  seed: number;
  code: string;
  timerDuration: number;
  playerName: string;
  results: ChallengeRoundResult[];
  totalScore: number;
}): Promise<{ ok: boolean; code: string }> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchChallenge(code: string): Promise<ChallengeRecord | null> {
  const res = await fetch(`${API_BASE}/${code.toUpperCase()}`);
  if (!res.ok) return null;
  return res.json();
}

export async function completeChallenge(code: string, data: {
  playerName: string;
  results: ChallengeRoundResult[];
  totalScore: number;
  p1HeadToHeadScore?: number;
}): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/${code.toUpperCase()}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
