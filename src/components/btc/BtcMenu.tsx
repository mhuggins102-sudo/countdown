import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import type { BtcMode } from '../../types/game';

export function BtcMenu({ onBack }: { onBack: () => void }) {
  const { dispatch } = useGame();

  const startBtc = (btcMode: BtcMode) => {
    dispatch({ type: 'START_BTC', btcMode });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <h1 className="text-4xl font-bold text-white">Beat the Clock</h1>
      <p className="text-blue-300 text-sm text-center max-w-sm">
        Start with 60 seconds. Solve puzzles to earn bonus time. How many rounds can you complete?
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => startBtc('letters')}
          className="bg-[#1a2d50] hover:bg-[#2a4a7f] border border-[#2a4a7f] hover:border-[#3b82f6] rounded-xl p-5 text-left transition-all group"
        >
          <div className="text-xl font-bold text-white group-hover:text-[#fbbf24]">Letters</div>
          <div className="text-sm text-blue-300 mt-1">
            Find words of 4+ letters to earn time
          </div>
        </button>

        <button
          onClick={() => startBtc('numbers')}
          className="bg-[#1a2d50] hover:bg-[#2a4a7f] border border-[#2a4a7f] hover:border-[#3b82f6] rounded-xl p-5 text-left transition-all group"
        >
          <div className="text-xl font-bold text-white group-hover:text-[#fbbf24]">Numbers</div>
          <div className="text-sm text-blue-300 mt-1">
            Get close to the target to earn time
          </div>
        </button>

        <button
          onClick={() => startBtc('all')}
          className="bg-[#1a2d50] hover:bg-[#2a4a7f] border border-[#2a4a7f] hover:border-[#3b82f6] rounded-xl p-5 text-left transition-all group"
        >
          <div className="text-xl font-bold text-white group-hover:text-[#fbbf24]">All</div>
          <div className="text-sm text-blue-300 mt-1">
            Letters, numbers, and conundrums — random mix
          </div>
        </button>
      </div>

      <Button variant="secondary" onClick={onBack}>
        Back to Menu
      </Button>
    </div>
  );
}
