import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';

export function FreePlayMenu({ onBack }: { onBack: () => void }) {
  const { dispatch } = useGame();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <h1 className="text-4xl font-bold text-white">Free Play</h1>
      <p className="text-blue-300">Practice individual round types</p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => dispatch({ type: 'START_FREEPLAY', roundType: 'letters' })}
          className="bg-[#1a2d50] hover:bg-[#2a4a7f] border border-[#2a4a7f] hover:border-[#3b82f6] rounded-xl p-5 text-left transition-all group"
        >
          <div className="text-xl font-bold text-white group-hover:text-[#fbbf24]">Letters Round</div>
          <div className="text-sm text-blue-300 mt-1">
            Pick 9 letters and find the longest word in 60 seconds
          </div>
        </button>

        <button
          onClick={() => dispatch({ type: 'START_FREEPLAY', roundType: 'numbers' })}
          className="bg-[#1a2d50] hover:bg-[#2a4a7f] border border-[#2a4a7f] hover:border-[#3b82f6] rounded-xl p-5 text-left transition-all group"
        >
          <div className="text-xl font-bold text-white group-hover:text-[#fbbf24]">Numbers Round</div>
          <div className="text-sm text-blue-300 mt-1">
            Use 6 numbers to reach a target with basic arithmetic
          </div>
        </button>
      </div>

      <Button variant="secondary" onClick={onBack}>
        Back to Menu
      </Button>
    </div>
  );
}
