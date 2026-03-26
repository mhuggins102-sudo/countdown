import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import { fetchChallenge } from '../../api/challengeApi';
import { generateSeed, seedToCode } from '../../utils/seededRng';
import { getCompletedChallenges, saveCompletedChallenge, type CompletedChallenge } from '../../utils/challengeHistory';
import { ChallengeResultScreen } from './ChallengeResultScreen';

type View = 'menu' | 'history' | 'result';

interface CompletedResult {
  code: string;
  p1Name: string;
  p1Score: number;
  p2Name: string;
  p2Score: number;
}

export function ChallengeMenu({ onBack, timerDuration }: { onBack: () => void; timerDuration: number }) {
  const { dispatch } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>('menu');
  const [completedResult, setCompletedResult] = useState<CompletedResult | null>(null);

  const handleCreate = () => {
    const seed = generateSeed();
    const code = seedToCode(seed);
    dispatch({
      type: 'START_CHALLENGE',
      seed,
      code,
      timerDuration,
    });
  };

  const handleJoin = async () => {
    const code = joinCode.toUpperCase().trim();
    if (code.length !== 6) {
      setError('Enter a 6-character code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const challenge = await fetchChallenge(code);
      if (!challenge) {
        setError('Challenge not found');
        setLoading(false);
        return;
      }
      if (challenge.p2Results) {
        const result = {
          code: challenge.code,
          p1Name: challenge.p1Name || 'Player 1',
          p1Score: challenge.p1TotalScore,
          p2Name: challenge.p2Name || 'Player 2',
          p2Score: challenge.p2TotalScore ?? 0,
        };
        // Save to history as P1 (they're the ones checking the code they created)
        saveCompletedChallenge({
          ...result,
          completedAt: Date.now(),
          asPlayer: 1,
        });
        setCompletedResult(result);
        setView('result');
        setLoading(false);
        return;
      }

      dispatch({
        type: 'START_CHALLENGE',
        seed: challenge.seed,
        code: challenge.code,
        timerDuration: challenge.timerDuration,
        opponentName: challenge.p1Name,
        opponentResults: challenge.p1Results,
        opponentTotalScore: challenge.p1TotalScore,
      });
    } catch {
      setError('Could not connect. Try again.');
      setLoading(false);
    }
  };

  // Completed challenge result screen
  if (view === 'result' && completedResult) {
    return (
      <ChallengeResultScreen
        {...completedResult}
        onBack={() => { setView('menu'); setJoinCode(''); }}
      />
    );
  }

  // Completed challenges history
  if (view === 'history') {
    return <ChallengeHistory onBack={() => setView('menu')} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <h1 className="text-4xl font-bold text-white">Challenge</h1>

      {/* Create challenge */}
      <div className="w-full max-w-sm">
        <button
          onClick={handleCreate}
          className="w-full bg-[#1a2d50] hover:bg-[#2a4a7f] border border-[#2a4a7f] hover:border-[#3b82f6] rounded-xl p-5 text-left transition-all group"
        >
          <div className="text-xl font-bold text-white group-hover:text-[#fbbf24]">Create Challenge</div>
          <div className="text-sm text-blue-300 mt-1">
            Play a full game, then send the code to a friend
          </div>
        </button>
      </div>

      {/* Join challenge */}
      <div className="w-full max-w-sm">
        <div className="bg-[#1a2d50] border border-[#2a4a7f] rounded-xl p-5">
          <div className="text-xl font-bold text-white mb-3">Join Challenge</div>
          <div className="text-sm text-blue-300 mb-3">
            Enter a friend's challenge code
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                setError('');
              }}
              placeholder="ABC123"
              maxLength={6}
              className="min-w-0 flex-1 bg-[#0a1628] border border-[#2a4a7f] rounded-lg px-3 py-3 text-white text-center text-xl font-mono tracking-wider placeholder:text-blue-400/30 focus:border-[#3b82f6] focus:outline-none"
            />
            <Button
              variant="primary"
              size="lg"
              onClick={handleJoin}
              disabled={joinCode.length !== 6 || loading}
            >
              {loading ? '...' : 'Go'}
            </Button>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>

      {/* Completed challenges */}
      <div className="w-full max-w-sm">
        <button
          onClick={() => setView('history')}
          className="w-full bg-[#1a2d50] hover:bg-[#2a4a7f] border border-[#2a4a7f] hover:border-[#3b82f6] rounded-xl p-4 text-center transition-all"
        >
          <span className="text-blue-300 font-semibold">Completed Challenges</span>
        </button>
      </div>

      <Button variant="secondary" onClick={onBack}>
        Back to Menu
      </Button>
    </div>
  );
}

function ChallengeHistory({ onBack }: { onBack: () => void }) {
  const challenges = getCompletedChallenges();

  const wins = challenges.filter((c) =>
    (c.asPlayer === 1 && c.p1Score > c.p2Score) ||
    (c.asPlayer === 2 && c.p2Score > c.p1Score)
  ).length;
  const losses = challenges.filter((c) =>
    (c.asPlayer === 1 && c.p1Score < c.p2Score) ||
    (c.asPlayer === 2 && c.p2Score < c.p1Score)
  ).length;
  const draws = challenges.filter((c) => c.p1Score === c.p2Score).length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
      <h1 className="text-3xl font-bold text-white">Completed Challenges</h1>

      {/* Overall record */}
      {challenges.length > 0 && (
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">{wins}</div>
            <div className="text-xs text-blue-300 uppercase">Wins</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{losses}</div>
            <div className="text-xs text-blue-300 uppercase">Losses</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#fbbf24]">{draws}</div>
            <div className="text-xs text-blue-300 uppercase">Draws</div>
          </div>
        </div>
      )}

      {/* Challenge list */}
      <div className="w-full max-w-sm space-y-2">
        {challenges.length === 0 ? (
          <p className="text-blue-400 text-center text-sm">No completed challenges yet</p>
        ) : (
          challenges.map((c) => <ChallengeRow key={`${c.code}-${c.asPlayer}`} challenge={c} />)
        )}
      </div>

      <Button variant="secondary" onClick={onBack}>
        Back
      </Button>
    </div>
  );
}

function ChallengeRow({ challenge }: { challenge: CompletedChallenge }) {
  const yourScore = challenge.asPlayer === 1 ? challenge.p1Score : challenge.p2Score;
  const theirScore = challenge.asPlayer === 1 ? challenge.p2Score : challenge.p1Score;
  const won = yourScore > theirScore;
  const lost = yourScore < theirScore;

  return (
    <div className="bg-[#1a2d50] border border-[#2a4a7f] rounded-lg px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
          won ? 'bg-green-500/20 text-green-400' :
          lost ? 'bg-red-500/20 text-red-400' :
          'bg-[#fbbf24]/20 text-[#fbbf24]'
        }`}>
          {won ? 'W' : lost ? 'L' : 'D'}
        </span>
        <span className="text-sm font-mono text-blue-300 tracking-wider">{challenge.code}</span>
      </div>
      <div className="text-sm font-bold text-white tabular-nums">
        {yourScore} - {theirScore}
      </div>
    </div>
  );
}
