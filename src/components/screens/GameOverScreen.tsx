import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';

export function GameOverScreen() {
  const { state, dispatch } = useGame();
  const playerWon = state.playerTotalScore > state.aiTotalScore;
  const tied = state.playerTotalScore === state.aiTotalScore;

  // Compute stats
  const lettersRounds = state.rounds.filter((r) => r.type === 'letters');
  const numbersRounds = state.rounds.filter((r) => r.type === 'numbers');
  const bestLettersRound = lettersRounds.reduce(
    (best, r) => (r.type === 'letters' && r.playerScore > best ? r.playerScore : best),
    0,
  );
  const exactNumbers = numbersRounds.filter(
    (r) => r.type === 'numbers' && r.playerAnswer !== null && r.playerAnswer === r.target,
  ).length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
      {/* Result */}
      <div className="text-center">
        <h1 className={`text-5xl md:text-6xl font-extrabold ${
          playerWon ? 'text-green-400' : tied ? 'text-[#fbbf24]' : 'text-red-400'
        }`}>
          {playerWon ? 'You Win!' : tied ? 'Draw!' : 'You Lose!'}
        </h1>
      </div>

      {/* Final scores */}
      <div className="flex gap-8 items-center">
        <div className="text-center">
          <div className="text-sm text-blue-300 uppercase">You</div>
          <div className="text-5xl font-bold text-white">{state.playerTotalScore}</div>
        </div>
        <div className="text-2xl text-blue-400">vs</div>
        <div className="text-center">
          <div className="text-sm text-blue-300 uppercase">AI</div>
          <div className="text-5xl font-bold text-white">{state.aiTotalScore}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[#1a2d50] rounded-xl p-5 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#fbbf24] mb-3">Game Stats</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-blue-200">
            <span>Rounds played</span>
            <span className="text-white font-medium">{state.rounds.length}</span>
          </div>
          <div className="flex justify-between text-blue-200">
            <span>Best letters score</span>
            <span className="text-white font-medium">{bestLettersRound} pts</span>
          </div>
          <div className="flex justify-between text-blue-200">
            <span>Exact number solutions</span>
            <span className="text-white font-medium">{exactNumbers}/{numbersRounds.length}</span>
          </div>
          <div className="flex justify-between text-blue-200">
            <span>Letters rounds won</span>
            <span className="text-white font-medium">
              {lettersRounds.filter((r) => r.playerScore > r.aiScore).length}/{lettersRounds.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="gold" size="lg" onClick={() => dispatch({ type: 'RETURN_TO_MENU' })}>
          Play Again
        </Button>
      </div>
    </div>
  );
}
