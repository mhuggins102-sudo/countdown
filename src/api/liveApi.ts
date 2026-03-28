import type { LiveRoomRecord, LiveRoundPicks, LiveRoundSubmission } from '../types/game';

const API_BASE = '/api/live';

export async function createLiveRoom(data: {
  seed: number;
  code: string;
  timerDuration: number;
  playerName: string;
  playerId: string;
}): Promise<{ ok: boolean; code: string }> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function joinLiveRoom(code: string, data: {
  playerName: string;
  playerId: string;
}): Promise<{ ok: boolean; room: LiveRoomRecord } | { error: string }> {
  const res = await fetch(`${API_BASE}/${code.toUpperCase()}/join`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function pollLiveRoom(code: string, playerId: string): Promise<LiveRoomRecord | null> {
  const res = await fetch(`${API_BASE}/${code.toUpperCase()}?playerId=${playerId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function submitPicks(code: string, playerId: string, picks: LiveRoundPicks): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/${code.toUpperCase()}/picks`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, picks }),
  });
  return res.json();
}

export async function submitLiveResult(code: string, playerId: string, result: LiveRoundSubmission): Promise<{ ok: boolean; bothSubmitted: boolean }> {
  const res = await fetch(`${API_BASE}/${code.toUpperCase()}/submit`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, result }),
  });
  return res.json();
}
