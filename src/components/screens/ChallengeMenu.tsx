import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import { fetchChallenge } from '../../api/challengeApi';
import { generateSeed, seedToCode } from '../../utils/seededRng';

export function ChallengeMenu({ onBack, timerDuration }: { onBack: () => void; timerDuration: number }) {
  const { dispatch } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        setError('Challenge already completed');
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
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                setError('');
              }}
              placeholder="ABC123"
              maxLength={6}
              className="flex-1 bg-[#0a1628] border border-[#2a4a7f] rounded-lg px-4 py-3 text-white text-center text-xl font-mono tracking-widest placeholder:text-blue-400/30 focus:border-[#3b82f6] focus:outline-none"
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

      <Button variant="secondary" onClick={onBack}>
        Back to Menu
      </Button>
    </div>
  );
}
