interface ScoreBarProps {
  playerScore: number;
  opponentScore: number;
  currentRound: number;
  totalRounds: number;
  roundType: string;
  isChallenge?: boolean;
  opponentName?: string;
}

export function ScoreBar({ playerScore, opponentScore, currentRound, totalRounds, roundType, isChallenge, opponentName }: ScoreBarProps) {
  const isP1 = isChallenge && !opponentName;
  const opponentLabel = isChallenge
    ? (opponentName || 'Challenger')
    : 'AI';

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center bg-[#1a2d50] rounded-xl px-4 py-3 mb-6">
      <div className="flex flex-col items-start pl-1">
        <span className="text-xs text-blue-300 uppercase tracking-wider">You</span>
        <span className="text-3xl font-bold text-white tabular-nums">{isP1 ? '?' : playerScore}</span>
      </div>

      <div className="flex flex-col items-center justify-center px-3">
        <span className="text-xs text-blue-300 uppercase tracking-wider">
          Round {currentRound + 1}/{totalRounds}
        </span>
        <span className="text-sm text-[#fbbf24] font-semibold capitalize">{roundType}</span>
      </div>

      {isP1 ? (
        <div className="flex flex-col items-end pr-1 opacity-40">
          <span className="text-xs text-blue-300 uppercase tracking-wider">vs</span>
          <span className="text-sm text-blue-300">TBD</span>
        </div>
      ) : (
        <div className="flex flex-col items-end pr-1">
          <span className="text-xs text-blue-300 uppercase tracking-wider">{opponentLabel}</span>
          <span className="text-3xl font-bold text-white tabular-nums">{opponentScore}</span>
        </div>
      )}
    </div>
  );
}
