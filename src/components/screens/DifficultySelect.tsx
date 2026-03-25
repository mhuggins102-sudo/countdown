import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import type { Difficulty } from '../../types/game';

export function DifficultySelect({ onBack, timerDuration }: { onBack: () => void; timerDuration: number }) {
  const { dispatch } = useGame();

  const difficulties: { level: Difficulty; label: string; desc: string }[] = [
    { level: 'easy', label: 'Easy', desc: 'AI finds short words and misses numbers often' },
    { level: 'medium', label: 'Medium', desc: 'AI is a competent opponent' },
    { level: 'hard', label: 'Hard', desc: 'AI rarely misses and finds long words' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <h1 className="text-4xl font-bold text-white">Choose Difficulty</h1>
      <p className="text-blue-300">How strong should your AI opponent be?</p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {difficulties.map(({ level, label, desc }) => (
          <button
            key={level}
            onClick={() => dispatch({ type: 'START_FULL_GAME', difficulty: level, timerDuration })}
            className="bg-[#1a2d50] hover:bg-[#2a4a7f] border border-[#2a4a7f] hover:border-[#3b82f6] rounded-xl p-4 text-left transition-all group"
          >
            <div className="text-xl font-bold text-white group-hover:text-[#fbbf24]">{label}</div>
            <div className="text-sm text-blue-300 mt-1">{desc}</div>
          </button>
        ))}
      </div>

      <Button variant="secondary" onClick={onBack}>
        Back
      </Button>
    </div>
  );
}
