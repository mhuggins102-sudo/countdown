import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import {
  getDailyLeaderboard,
  getAllTimeLeaderboard,
  qualifiesForLeaderboard,
  saveScore,
  type LeaderboardEntry,
} from '../../utils/btcLeaderboard';
import type { BtcMode } from '../../types/game';

export function BtcGameOverScreen({ onPlayAgain }: { onPlayAgain: () => void }) {
  const { state } = useGame();
  const mode = state.btcMode || 'all';
  const score = state.btcRoundsCompleted;

  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [savedTimestamp, setSavedTimestamp] = useState<number | null>(null);
  const [tab, setTab] = useState<'daily' | 'alltime'>('daily');

  const qualifies = qualifiesForLeaderboard(mode, score);
  const showNameEntry = !saved && (qualifies.daily || qualifies.allTime);

  const handleSave = () => {
    if (name.trim().length === 0) return;
    const ts = Date.now();
    saveScore(mode, name.trim(), score, ts);
    setSaved(true);
    setSavedTimestamp(ts);
  };

  const daily = getDailyLeaderboard(mode);
  const allTime = getAllTimeLeaderboard(mode);
  const entries = tab === 'daily' ? daily : allTime;

  const modeLabel: Record<BtcMode, string> = {
    letters: 'Letters',
    numbers: 'Numbers',
    all: 'All Modes',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
      <h1 className="text-4xl font-extrabold text-red-400">Time's Up!</h1>

      {/* Score */}
      <div className="text-center">
        <div className="text-sm text-blue-400 uppercase">Rounds Completed</div>
        <div className="text-6xl font-bold text-[#fbbf24] tabular-nums">{score}</div>
        <div className="text-sm text-blue-300 mt-1 capitalize">{modeLabel[mode]} mode</div>
      </div>

      {/* Name entry */}
      {showNameEntry && (
        <div className="bg-[#1a2d50] rounded-xl p-5 w-full max-w-sm text-center">
          <div className="text-green-400 font-semibold mb-2">
            New {qualifies.allTime ? 'all-time' : 'daily'} high score!
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 15))}
              placeholder="Enter your name"
              maxLength={15}
              className="min-w-0 flex-1 bg-[#0a1628] border border-[#2a4a7f] rounded-lg px-3 py-2 text-white text-center focus:border-[#3b82f6] focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button variant="gold" size="sm" onClick={handleSave} disabled={name.trim().length === 0}>
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-[#1a2d50] rounded-xl p-5 w-full max-w-sm">
        <div className="flex rounded-lg overflow-hidden border border-[#2a4a7f] mb-4">
          <button
            onClick={() => setTab('daily')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === 'daily' ? 'bg-[#3b82f6] text-white' : 'bg-[#0a1628] text-blue-300 hover:bg-[#2a4a7f]'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTab('alltime')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === 'alltime' ? 'bg-[#3b82f6] text-white' : 'bg-[#0a1628] text-blue-300 hover:bg-[#2a4a7f]'
            }`}
          >
            All Time
          </button>
        </div>

        <LeaderboardList
          entries={entries}
          currentScore={score}
          saved={saved}
          savedTimestamp={savedTimestamp}
        />
      </div>

      <Button variant="gold" size="lg" onClick={onPlayAgain}>
        Play Again
      </Button>
    </div>
  );
}

function LeaderboardList({ entries, currentScore, saved, savedTimestamp }: {
  entries: LeaderboardEntry[];
  currentScore: number;
  saved: boolean;
  savedTimestamp: number | null;
}) {
  const top5 = entries.slice(0, 5);

  // Rank of the current score among all entries in this list
  const rank = entries.filter((e) => e.score > currentScore).length + 1;

  if (saved && savedTimestamp) {
    // After save: highlight the saved entry by timestamp
    const savedInTop5 = top5.some((e) => e.timestamp === savedTimestamp);
    const savedEntry = entries.find((e) => e.timestamp === savedTimestamp);

    return (
      <div className="space-y-1">
        {top5.length === 0 ? (
          <p className="text-blue-400 text-center text-sm py-4">No scores yet</p>
        ) : (
          top5.map((entry, i) => (
            <LeaderboardRow
              key={`${entry.timestamp}-${i}`}
              rank={i + 1}
              entry={entry}
              highlight={entry.timestamp === savedTimestamp}
            />
          ))
        )}
        {!savedInTop5 && savedEntry && (
          <>
            <div className="border-t border-[#2a4a7f]/50 my-1" />
            <LeaderboardRow rank={rank} entry={savedEntry} highlight />
          </>
        )}
      </div>
    );
  }

  // Before save: show top 5 + "You" row at projected rank
  // Rank is where this score would land if inserted
  const wouldBeInTop5 = rank <= 5;

  return (
    <div className="space-y-1">
      {top5.length === 0 && currentScore === 0 ? (
        <p className="text-blue-400 text-center text-sm py-4">No scores yet</p>
      ) : (
        <>
          {top5.map((entry, i) => (
            <LeaderboardRow
              key={`${entry.timestamp}-${i}`}
              rank={i + 1}
              entry={entry}
            />
          ))}
          {!wouldBeInTop5 && currentScore > 0 && (
            <>
              <div className="border-t border-[#2a4a7f]/50 my-1" />
              <LeaderboardRow
                rank={rank}
                entry={{ name: 'You', score: currentScore, date: '', timestamp: 0 }}
                highlight
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function LeaderboardRow({ rank, entry, highlight }: { rank: number; entry: LeaderboardEntry; highlight?: boolean }) {
  const medalColors: Record<number, string> = {
    1: 'text-[#fbbf24]',
    2: 'text-gray-300',
    3: 'text-amber-600',
  };

  return (
    <div className={`flex items-center justify-between py-1.5 px-2 rounded ${
      highlight ? 'bg-[#3b82f6]/20 ring-1 ring-[#3b82f6]/50' : 'hover:bg-[#0a1628]/50'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`w-6 text-center font-bold text-sm ${medalColors[rank] || 'text-blue-400'}`}>
          {rank}
        </span>
        <span className="text-white text-sm font-medium truncate max-w-[140px]">{entry.name}</span>
      </div>
      <span className="text-[#fbbf24] font-bold tabular-nums">{entry.score}</span>
    </div>
  );
}
