interface ScoreBarProps {
  playerScore: number;
  aiScore: number;
  currentRound: number;
  totalRounds: number;
  roundType: string;
  isChallenge?: boolean;
  opponentName?: string;
}

export function ScoreBar({ playerScore, aiScore, currentRound, totalRounds, roundType, isChallenge, opponentName }: ScoreBarProps) {
  const opponentLabel = isChallenge
    ? (opponentName || 'Challenger')
    : 'AI';

  return (
    <div className="flex items-center justify-between bg-[#1a2d50] rounded-xl px-6 py-3 mb-6">
      <div className="flex flex-col items-center">
        <span className="text-xs text-blue-300 uppercase tracking-wider">You</span>
        <span className="text-3xl font-bold text-white tabular-nums">{playerScore}</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-xs text-blue-300 uppercase tracking-wider">
          Round {currentRound + 1}/{totalRounds}
        </span>
        <span className="text-sm text-[#fbbf24] font-semibold capitalize">{roundType}</span>
      </div>

      {isChallenge && !opponentName ? (
        <div className="flex flex-col items-center opacity-40">
          <span className="text-xs text-blue-300 uppercase tracking-wider">vs</span>
          <span className="text-sm text-blue-300">TBD</span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <span className="text-xs text-blue-300 uppercase tracking-wider">{opponentLabel}</span>
          <span className="text-3xl font-bold text-white tabular-nums">{aiScore}</span>
        </div>
      )}
    </div>
  );
}
