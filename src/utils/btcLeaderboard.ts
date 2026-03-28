import type { BtcMode } from '../types/game';

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

const STORAGE_KEY = 'countdown_btc_leaderboard';
const MAX_ENTRIES = 10;

function getStorageKey(mode: BtcMode): string {
  return `${STORAGE_KEY}_${mode}`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getLeaderboard(mode: BtcMode): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(getStorageKey(mode));
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function getDailyLeaderboard(mode: BtcMode): LeaderboardEntry[] {
  const today = todayStr();
  return getLeaderboard(mode).filter((e) => e.date === today);
}

export function getAllTimeLeaderboard(mode: BtcMode): LeaderboardEntry[] {
  return getLeaderboard(mode).slice(0, MAX_ENTRIES);
}

/** Check if a score qualifies for the daily or all-time top 10 */
export function qualifiesForLeaderboard(mode: BtcMode, score: number): { daily: boolean; allTime: boolean } {
  const daily = getDailyLeaderboard(mode);
  const allTime = getAllTimeLeaderboard(mode);

  const dailyQualifies = daily.length < MAX_ENTRIES || score > daily[daily.length - 1].score;
  const allTimeQualifies = allTime.length < MAX_ENTRIES || score > allTime[allTime.length - 1].score;

  return { daily: dailyQualifies, allTime: allTimeQualifies };
}

/** Save a new score. Returns updated leaderboard. */
export function saveScore(mode: BtcMode, name: string, score: number, timestamp?: number): void {
  const all = getLeaderboard(mode);
  const entry: LeaderboardEntry = {
    name,
    score,
    date: todayStr(),
    timestamp: timestamp || Date.now(),
  };
  all.push(entry);
  // Sort descending by score, then by timestamp (earlier is better for ties)
  all.sort((a, b) => b.score - a.score || a.timestamp - b.timestamp);
  // Keep top 100 all-time to allow daily filtering
  localStorage.setItem(getStorageKey(mode), JSON.stringify(all.slice(0, 100)));
}
