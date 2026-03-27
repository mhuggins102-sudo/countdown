import { useState, useEffect, useRef } from 'react';
import { useGame } from './hooks/useGame';
import { ROUND_ORDER, TIMER_DURATION } from './types/game';
import { fetchChallenge } from './api/challengeApi';

// Screens
import { DifficultySelect } from './components/screens/DifficultySelect';
import { FreePlayMenu } from './components/screens/FreePlayMenu';
import { ChallengeMenu } from './components/screens/ChallengeMenu';
import { GameOverScreen } from './components/screens/GameOverScreen';
import { ChallengeResultScreen } from './components/screens/ChallengeResultScreen';
import { BtcMenu } from './components/btc/BtcMenu';
import { BtcScreen } from './components/btc/BtcScreen';
import { BtcGameOverScreen } from './components/btc/BtcGameOverScreen';

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

type MenuScreen = 'main' | 'difficulty' | 'freeplay' | 'challenge' | 'btc';

interface CompletedResultView {
  code: string;
  p1Name: string;
  p1Score: number;
  p2Name: string;
  p2Score: number;
}

export function GameApp() {
  const { state, dispatch } = useGame();
  const [menuScreen, setMenuScreen] = useState<MenuScreen>('main');
  const [timerDuration, setTimerDuration] = useState(TIMER_DURATION);
  const [completedResult, setCompletedResult] = useState<CompletedResultView | null>(null);

  const checkedUrl = useRef(false);

  // Handle ?challenge=CODE URL parameter
  useEffect(() => {
    if (checkedUrl.current) return;
    checkedUrl.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('challenge');
    if (!code) return;
    // Clear the URL param
    window.history.replaceState({}, '', window.location.pathname);
    // Fetch and join the challenge
    fetchChallenge(code).then((challenge) => {
      if (!challenge) return;
      if (challenge.p2Results) {
        // Show completed results
        setCompletedResult({
          code: challenge.code,
          p1Name: challenge.p1Name || 'Player 1',
          p1Score: challenge.p1TotalScore,
          p2Name: challenge.p2Name || 'Player 2',
          p2Score: challenge.p2TotalScore ?? 0,
        });
        return;
      }
      dispatch({
        type: 'START_CHALLENGE',
        seed: challenge.seed,
        code: challenge.code,
        timerDuration: challenge.timerDuration,
        opponentName: challenge.p1Name,
        opponentResults: challenge.p1Results,
        opponentTotalScore: challenge.p1TotalScore,
      });
    });
  }, [dispatch]);

  const goToMainMenu = () => {
    dispatch({ type: 'RETURN_TO_MENU' });
    setMenuScreen('main');
    setCompletedResult(null);
  };

  // Show completed challenge result (from URL or join)
  if (completedResult) {
    return (
      <ChallengeResultScreen
        {...completedResult}
        onBack={() => setCompletedResult(null)}
      />
    );
  }

  // Handle menu navigation
  if (state.screen === 'menu') {
    if (menuScreen === 'difficulty') {
      return <DifficultySelect onBack={goToMainMenu} timerDuration={timerDuration} />;
    }
    if (menuScreen === 'freeplay') {
      return <FreePlayMenu onBack={goToMainMenu} timerDuration={timerDuration} />;
    }
    if (menuScreen === 'challenge') {
      return <ChallengeMenu onBack={goToMainMenu} timerDuration={timerDuration} />;
    }
    if (menuScreen === 'btc') {
      return <BtcMenu onBack={goToMainMenu} />;
    }

    // Main menu with custom handlers
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
        <div className="text-center">
          <h1 className="text-[3.5rem] md:text-8xl font-extrabold tracking-tight">
            <span className="text-[#3b82f6]">COUNT</span>
            <span className="text-[#fbbf24]">DOWN</span>
          </h1>
          <p className="text-blue-300 mt-1 text-lg">The classic numbers and letters game</p>
        </div>

        <button
          onClick={() => setTimerDuration((d) => d === 60 ? 45 : d === 45 ? 30 : 60)}
          className="w-24 h-24 rounded-full border-4 border-[#3b82f6] flex items-center justify-center cursor-pointer hover:border-[#fbbf24] transition-colors active:scale-95 group"
          title="Tap to toggle timer"
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
            onClick={() => setMenuScreen('challenge')}
            className="bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:from-[#a78bfa] hover:to-[#8b5cf6] text-white shadow-lg shadow-purple-500/25 font-semibold rounded-lg transition-all duration-200 active:scale-95 px-8 py-4 text-xl"
          >
            Challenge a Friend
          </button>
          <button
            onClick={() => setMenuScreen('btc')}
            className="bg-gradient-to-r from-[#ef4444] to-[#dc2626] hover:from-[#f87171] hover:to-[#ef4444] text-white shadow-lg shadow-red-500/25 font-semibold rounded-lg transition-all duration-200 active:scale-95 px-8 py-4 text-xl"
          >
            Beat the Clock
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
    if (state.mode === 'btc') {
      return <BtcGameOverScreen onPlayAgain={goToMainMenu} />;
    }
    return <GameOverScreen onPlayAgain={goToMainMenu} />;
  }

  // BTC playing screen (has its own layout)
  if (state.mode === 'btc') {
    return <BtcScreen />;
  }

  // Playing screen
  const isMultiRound = state.mode === 'fullgame' || state.mode === 'challenge';
  const roundType = isMultiRound
    ? ROUND_ORDER[state.currentRound]
    : state.freeplayType;
  const totalRounds = isMultiRound ? ROUND_ORDER.length : 0;

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Score bar (full game + challenge) */}
      {isMultiRound && (
        <ScoreBar
          playerScore={state.playerTotalScore}
          opponentScore={state.aiTotalScore}
          currentRound={state.currentRound}
          totalRounds={totalRounds}
          roundType={roundType || ''}
          isChallenge={state.mode === 'challenge'}
          opponentName={state.challengeData?.opponentName}
        />
      )}

      {/* Free play header */}
      {state.mode === 'freeplay' && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-blue-400">Free Play</div>
            <h2 className="text-lg font-semibold text-blue-300 capitalize">{roundType}</h2>
          </div>
          {state.difficulty !== 'off' && (
            <div className="flex flex-col items-center text-sm">
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
