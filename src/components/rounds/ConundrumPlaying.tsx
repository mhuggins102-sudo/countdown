import { useState, useCallback, useEffect, useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import { useTimer } from '../../hooks/useTimer';
import { LetterTile } from '../shared/LetterTile';
import { Timer } from '../shared/Timer';
import { Button } from '../shared/Button';
import { aiSolveConundrum } from '../../engine/aiOpponent';
import type { ConundrumRoundState } from '../../types/game';

export function ConundrumPlaying() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as ConundrumRoundState;
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [aiBuzzed, setAiBuzzed] = useState(false);
  const aiStored = useRef(false);

  const scrambledLetters = round.scrambled.split('');
  const currentWord = selectedIndices.map((i) => scrambledLetters[i]).join('');

  // Calculate and store AI conundrum result on mount
  useEffect(() => {
    if (state.mode === 'fullgame' && !aiStored.current) {
      aiStored.current = true;
      const aiResult = aiSolveConundrum(state.difficulty);
      dispatch({ type: 'SET_CONUNDRUM_AI', solved: aiResult.solved, guessTime: aiResult.guessTime });
    }
  }, [state.mode, state.difficulty, dispatch]);

  // Watch for AI buzz-in: when elapsed time passes aiGuessTime
  useEffect(() => {
    if (aiBuzzed || submitted || !round.aiSolved || round.aiGuessTime === 0) return;
    const elapsed = state.timerDuration - state.timeRemaining;
    if (elapsed >= round.aiGuessTime) {
      // AI buzzes in with correct answer — freeze the game
      setAiBuzzed(true);
      setSubmitted(true);
      dispatch({ type: 'SUBMIT_CONUNDRUM_GUESS', guess: '', timeRemaining: state.timeRemaining });
    }
  }, [state.timeRemaining, state.timerDuration, round.aiGuessTime, round.aiSolved, aiBuzzed, submitted, dispatch]);

  // Transition to reveal after submission or AI buzz-in
  useEffect(() => {
    if (submitted && state.phase === 'playing') {
      const delay = aiBuzzed ? 2500 : 1500;
      const timer = setTimeout(() => {
        dispatch({ type: 'TIMER_EXPIRED' });
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [submitted, aiBuzzed, state.phase, dispatch]);

  const doSubmit = useCallback((guess: string) => {
    if (!submitted) {
      setSubmitted(true);
      dispatch({ type: 'SUBMIT_CONUNDRUM_GUESS', guess, timeRemaining: state.timeRemaining });
    }
  }, [submitted, dispatch, state.timeRemaining]);

  // Auto-submit when all 9 tiles selected and word matches answer
  useEffect(() => {
    if (selectedIndices.length === 9 && !submitted) {
      const word = selectedIndices.map((i) => scrambledLetters[i]).join('');
      if (word.toUpperCase() === round.answer.toUpperCase()) {
        doSubmit(word);
      }
    }
  }, [selectedIndices, scrambledLetters, round.answer, submitted, doSubmit]);

  useTimer(() => {
    if (!submitted) {
      doSubmit(currentWord);
    }
  });

  const handleTileClick = (index: number) => {
    if (submitted) return;
    if (selectedIndices.includes(index)) {
      const pos = selectedIndices.indexOf(index);
      setSelectedIndices(selectedIndices.slice(0, pos));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleUndo = () => {
    if (selectedIndices.length > 0 && !submitted) {
      setSelectedIndices(selectedIndices.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!submitted) {
      setSelectedIndices([]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-xl font-semibold text-[#fbbf24]">CONUNDRUM</h2>

      <Timer timeRemaining={state.timeRemaining} isRunning={state.timerRunning} totalTime={state.timerDuration} />

      {/* AI buzz-in overlay */}
      {aiBuzzed && (
        <div className="bg-red-500/20 border-2 border-red-500 rounded-xl px-6 py-4 text-center animate-fade-in w-full max-w-md">
          <div className="text-red-400 font-bold text-lg">AI buzzed in!</div>
          <div className="text-white text-2xl font-bold tracking-wider mt-1">{round.answer.toUpperCase()}</div>
          <div className="text-red-300 text-sm mt-1">at {Math.round(round.aiGuessTime)}s</div>
        </div>
      )}

      {/* Scrambled letter tiles */}
      <div className="flex gap-2 flex-wrap justify-center">
        {scrambledLetters.map((letter, i) => (
          <LetterTile
            key={i}
            letter={letter}
            size="lg"
            selected={selectedIndices.includes(i)}
            onClick={() => handleTileClick(i)}
            disabled={submitted}
          />
        ))}
      </div>

      {!aiBuzzed && (
        <p className="text-blue-300 text-sm">Tap tiles to unscramble the 9-letter word!</p>
      )}

      {/* Current word display */}
      {!aiBuzzed && (
        <div className="min-h-16 flex items-center gap-1">
          {currentWord.length > 0 ? (
            <div className="flex gap-1">
              {currentWord.split('').map((letter, i) => (
                <span
                  key={i}
                  className="w-10 h-10 bg-[#fbbf24] text-[#0a1628] rounded font-bold text-xl flex items-center justify-center"
                >
                  {letter.toUpperCase()}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-blue-400/50 text-lg">Tap tiles to spell the word</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      {!submitted && (
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={handleClear} disabled={selectedIndices.length === 0}>
            Clear
          </Button>
          <Button variant="secondary" size="sm" onClick={handleUndo} disabled={selectedIndices.length === 0}>
            Undo
          </Button>
          <Button variant="gold" size="lg" onClick={() => doSubmit(currentWord)} disabled={currentWord.length === 0}>
            Submit
          </Button>
        </div>
      )}

      {submitted && !aiBuzzed && (
        <p className="text-blue-300 animate-fade-in">
          Your answer: <span className="font-bold text-white">{currentWord.toUpperCase() || '(no answer)'}</span>
        </p>
      )}
    </div>
  );
}
