import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';

export function MainMenu() {
  const { dispatch } = useGame();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight">
          <span className="text-[#3b82f6]">COUNT</span>
          <span className="text-[#fbbf24]">DOWN</span>
        </h1>
        <p className="text-blue-300 mt-2 text-lg">The classic numbers and letters game</p>
      </div>

      {/* Clock icon */}
      <div className="w-24 h-24 rounded-full border-4 border-[#3b82f6] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-[#2a4a7f] flex items-center justify-center">
          <span className="text-3xl font-bold text-[#fbbf24]">30</span>
        </div>
      </div>

      {/* Game modes */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Button
          variant="gold"
          size="lg"
          className="w-full text-xl py-4"
          onClick={() => dispatch({ type: 'RETURN_TO_MENU' })}
          // This will navigate to difficulty select
        >
          <span onClick={(e) => {
            e.stopPropagation();
            // Navigate to difficulty screen handled by parent
          }}>
            Full Game
          </span>
        </Button>

        <Button
          variant="primary"
          size="lg"
          className="w-full text-xl py-4"
          onClick={() => {/* Handled by parent */}}
        >
          Free Play
        </Button>
      </div>

      <p className="text-blue-400/50 text-sm mt-8">
        15 rounds: 10 letters, 4 numbers, 1 conundrum
      </p>
    </div>
  );
}
