import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import type { DifficultyOrOff } from '../../types/game';

export function FreePlayMenu({ onBack, timerDuration }: { onBack: () => void; timerDuration: number }) {
  const { dispatch } = useGame();
  const [difficulty, setDifficulty] = useState<DifficultyOrOff>('off');

  const difficulties: { value: DifficultyOrOff; label: string }[] = [
    { value: 'off', label: 'Off' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  const startRound = (roundType: 'letters' | 'numbers' | 'conundrum') => {
    dispatch({ type: 'START_FREEPLAY', timerDuration, roundType, difficulty });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <h1 className="text-4xl font-bold text-white">Free Play</h1>
      <p className="text-blue-300">Practice individual round types</p>

      {/* AI Difficulty selector */}
      <div className="w-full max-w-sm">
        <div className="text-sm text-blue-400 mb-2 text-center">AI Opponent</div>
        <div className="flex rounded-lg overflow-hidden border border-[#2a4a7f]">
          {difficulties.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                difficulty === d.value
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#1a2d50] text-blue-300 hover:bg-[#2a4a7f]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => startRound('letters')}
          className="bg-[#1a2d50] hover:bg-[#2a4a7f] border border-[#2a4a7f] hover:border-[#3b82f6] rounded-xl p-5 text-left transition-all group"
        >
          <div className="text-xl font-bold text-white group-hover:text-[#fbbf24]">Letters Round</div>
          <div className="text-sm text-blue-300 mt-1">
            Pick 9 letters and find the longest word
          </div>
        </button>

        <button
          onClick={() => startRound('numbers')}
          className="bg-[#1a2d50] hover:bg-[#2a4a7f] border border-[#2a4a7f] hover:border-[#3b82f6] rounded-xl p-5 text-left transition-all group"
        >
          <div className="text-xl font-bold text-white group-hover:text-[#fbbf24]">Numbers Round</div>
          <div className="text-sm text-blue-300 mt-1">
            Use 6 numbers to reach a target with basic arithmetic
          </div>
        </button>

        <button
          onClick={() => startRound('conundrum')}
          className="bg-[#1a2d50] hover:bg-[#2a4a7f] border border-[#2a4a7f] hover:border-[#3b82f6] rounded-xl p-5 text-left transition-all group"
        >
          <div className="text-xl font-bold text-white group-hover:text-[#fbbf24]">Conundrum</div>
          <div className="text-sm text-blue-300 mt-1">
            Unscramble a 9-letter word before time runs out
          </div>
        </button>
      </div>

      <Button variant="secondary" onClick={onBack}>
        Back to Menu
      </Button>
    </div>
  );
}
