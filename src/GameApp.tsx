import { useState } from 'react';
import { useGame } from './hooks/useGame';
import { ROUND_ORDER, TIMER_DURATION } from './types/game';

// Screens
import { DifficultySelect } from './components/screens/DifficultySelect';
import { FreePlayMenu } from './components/screens/FreePlayMenu';
import { GameOverScreen } from './components/screens/GameOverScreen';

// Round components
import { LettersPicking } from './components/rounds/LettersPicking';
import { LettersPlaying } from './components/rounds/LettersPlaying';
import { LettersReveal } from './components/rounds/LettersReveal';
import { NumbersPicking } from './components/rounds/NumbersPicking';
import { NumbersPlaying } from './components/rounds/NumbersPlaying';
import { NumbersReveal } from './components/rounds/NumbersReveal';
import { ConundrumPlaying } from './components/rounds/ConundrumPlaying';
import { ConundrumReveal } from './components/rounds/ConundrumReveal';

// Shared
import { ScoreBar } from './components/shared/ScoreBar';

type MenuScreen = 'main' | 'difficulty' | 'freeplay';

export function GameApp() {
  const { state, dispatch } = useGame();
  const [menuScreen, setMenuScreen] = useState<MenuScreen>('main');
  const [timerDuration, setTimerDuration] = useState(TIMER_DURATION);

  const goToMainMenu = () => {
    dispatch({ type: 'RETURN_TO_MENU' });
    setMenuScreen('main');
  };

  // Handle menu navigation
  if (state.screen === 'menu') {
    if (menuScreen === 'difficulty') {
      return <DifficultySelect onBack={goToMainMenu} timerDuration={timerDuration} />;
    }
    if (menuScreen === 'freeplay') {
      return <FreePlayMenu onBack={goToMainMenu} timerDuration={timerDuration} />;
    }

    // Main menu with custom handlers
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
        <div className="text-center">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight">
            <span className="text-[#3b82f6]">COUNT</span>
            <span className="text-[#fbbf24]">DOWN</span>
          </h1>
          <p className="text-blue-300 mt-2 text-lg">The classic numbers and letters game</p>
        </div>

        <button
          onClick={() => setTimerDuration((d) => d === 60 ? 30 : 60)}
          className="w-24 h-24 rounded-full border-4 border-[#3b82f6] flex items-center justify-center cursor-pointer hover:border-[#fbbf24] transition-colors active:scale-95 group"
          title="Tap to toggle 30/60 seconds"
        >
          <div className="w-16 h-16 rounded-full border-2 border-[#2a4a7f] group-hover:border-[#fbbf24]/50 flex items-center justify-center transition-colors">
            <span className="text-3xl font-bold text-[#fbbf24]">{timerDuration}</span>
          </div>
        </button>
        <p className="text-blue-400/50 text-xs -mt-4">tap to change timer</p>

        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button
            onClick={() => setMenuScreen('difficulty')}
            className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#fbbf24] hover:to-[#f59e0b] text-[#0a1628] shadow-lg shadow-amber-500/25 font-semibold rounded-lg transition-all duration-200 active:scale-95 px-8 py-4 text-xl"
          >
            Full Game
          </button>
          <button
            onClick={() => setMenuScreen('freeplay')}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-lg shadow-blue-500/25 font-semibold rounded-lg transition-all duration-200 active:scale-95 px-8 py-4 text-xl"
          >
            Free Play
          </button>
        </div>

        <p className="text-blue-400/50 text-sm mt-8">
          15 rounds: 10 letters, 4 numbers, 1 conundrum
        </p>
      </div>
    );
  }

  if (state.screen === 'gameover') {
    return <GameOverScreen onPlayAgain={goToMainMenu} />;
  }

  // Playing screen
  const roundType = state.mode === 'fullgame'
    ? ROUND_ORDER[state.currentRound]
    : state.freeplayType;
  const totalRounds = state.mode === 'fullgame' ? ROUND_ORDER.length : 0;

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Score bar (full game only) */}
      {state.mode === 'fullgame' && (
        <ScoreBar
          playerScore={state.playerTotalScore}
          aiScore={state.aiTotalScore}
          currentRound={state.currentRound}
          totalRounds={totalRounds}
          roundType={roundType || ''}
        />
      )}

      {/* Free play header */}
      {state.mode === 'freeplay' && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-blue-300 capitalize">
            Free Play: {roundType}
          </h2>
          {state.difficulty !== 'off' && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-blue-300">You: <span className="text-white font-bold">{state.playerTotalScore}</span></span>
              <span className="text-blue-300">AI: <span className="text-white font-bold">{state.aiTotalScore}</span></span>
            </div>
          )}
          <button
            onClick={() => {
              dispatch({ type: 'RETURN_TO_MENU' });
              setMenuScreen('freeplay');
            }}
            className="text-blue-400 hover:text-white text-sm transition-colors"
          >
            Back to Menu
          </button>
        </div>
      )}

      {/* Round content */}
      <div className="mt-4">
        {roundType === 'letters' && state.phase === 'picking' && <LettersPicking />}
        {roundType === 'letters' && state.phase === 'playing' && <LettersPlaying />}
        {roundType === 'letters' && state.phase === 'reveal' && <LettersReveal />}

        {roundType === 'numbers' && state.phase === 'picking' && <NumbersPicking />}
        {roundType === 'numbers' && state.phase === 'playing' && <NumbersPlaying />}
        {roundType === 'numbers' && state.phase === 'reveal' && <NumbersReveal />}

        {roundType === 'conundrum' && state.phase === 'playing' && <ConundrumPlaying />}
        {roundType === 'conundrum' && state.phase === 'reveal' && <ConundrumReveal />}
      </div>
    </div>
  );
}
