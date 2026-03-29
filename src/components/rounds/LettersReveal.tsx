import { useEffect, useState, useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import { WaitingOverlay } from '../shared/WaitingOverlay';
import { isValidWord, canFormWord } from '../../engine/wordValidator';
import { findLongestWord } from '../../engine/wordFinder';
import { aiPickWord } from '../../engine/aiOpponent';
import { scoreLettersRound } from '../../engine/scoring';
import type { LettersRoundState } from '../../types/game';
import { useChallengeOpponent } from '../../hooks/useChallengeOpponent';
import { submitLiveResult } from '../../api/liveApi';

export function LettersReveal() {
  const { state, dispatch } = useGame();
  const round = state.currentRoundState as LettersRoundState;
  const { isP1, hasOpponent, opponentName, result: opponentResult } = useChallengeOpponent();
  const [revealed, setRevealed] = useState(false);
  const liveSubmitted = useRef(false);

  const isLive = state.mode === 'live';
  const liveData = state.liveData;
  const liveOpponentResult = liveData?.opponentResult;

  useEffect(() => {
    if (revealed) return;
    setRevealed(true);

    // Compute AI word and best word
    const aiWord = state.difficulty !== 'off'
      ? aiPickWord(round.letters, state.difficulty)
      : '';
    const bestWord = findLongestWord(round.letters);

    if (isLive) {
      // Live mode: defer scoring until both players submit — use 0 as placeholder
      dispatch({
        type: 'SET_ROUND_RESULTS',
        playerScore: 0,
        aiScore: 0,
        extras: { aiWord: '', bestWord, playerWordValid: isValidWord(round.playerWord) && canFormWord(round.playerWord, round.letters) },
      });

      // Submit raw answer to server
      if (liveData && !liveSubmitted.current) {
        liveSubmitted.current = true;
        submitLiveResult(liveData.code, liveData.playerId, {
          roundIndex: state.currentRound,
          roundType: 'letters',
          answer: round.playerWord,
          score: 0, // placeholder — rescored client-side when both results are in
        });
        dispatch({ type: 'LIVE_SET_WAITING', waiting: true });
      }
    } else {
      // AI / Challenge mode: score immediately
      const opponentWord = hasOpponent && opponentResult ? opponentResult.answer : aiWord;
      const scores = scoreLettersRound(round.playerWord, opponentWord, round.letters);

      dispatch({
        type: 'SET_ROUND_RESULTS',
        playerScore: scores.playerScore,
        aiScore: scores.aiScore,
        extras: { aiWord, bestWord, playerWordValid: scores.playerWordValid },
      });
    }
  }, [revealed, round, state.mode, state.difficulty, hasOpponent, opponentResult, isLive, liveData, state.currentRound, dispatch]);

  // Live: rescore when opponent's result arrives
  const rescored = useRef(false);
  useEffect(() => {
    if (!isLive || !liveOpponentResult || rescored.current) return;
    rescored.current = true;
    const scores = scoreLettersRound(round.playerWord, liveOpponentResult.answer, round.letters);
    dispatch({ type: 'LIVE_RESCORE_ROUND', playerScore: scores.playerScore, opponentScore: scores.aiScore });
  }, [isLive, liveOpponentResult, round.playerWord, round.letters, dispatch]);

  if (!revealed || state.phase !== 'reveal') return null;

  const playerValid = round.playerWord.length > 0 && isValidWord(round.playerWord) && canFormWord(round.playerWord, round.letters);

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-blue-300">Round Results</h2>

      {/* Player result */}
      <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
        <div className="text-sm text-blue-400 mb-1">Your word</div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-white">
            {round.playerWord || '(none)'}
          </span>
          <div className="flex items-center gap-2">
            {round.playerWord && (
              <span className={`text-sm ${playerValid ? 'text-green-400' : 'text-red-400'}`}>
                {playerValid ? 'Valid' : 'Invalid'}
              </span>
            )}
            <span className="text-2xl font-bold text-[#fbbf24]">{isP1 || (isLive && !liveOpponentResult) ? '+?' : `+${round.playerScore}`}</span>
          </div>
        </div>
      </div>

      {/* AI result */}
      {state.difficulty !== 'off' && (
        <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
          <div className="text-sm text-blue-400 mb-1">AI's word</div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">
              {round.aiWord || '(none)'}
            </span>
            <span className="text-2xl font-bold text-[#fbbf24]">+{round.aiScore}</span>
          </div>
        </div>
      )}

      {/* Challenger result */}
      {hasOpponent && opponentResult && (() => {
        const oppWord = opponentResult.answer || '';
        const oppValid = oppWord.length > 0 && isValidWord(oppWord) && canFormWord(oppWord, round.letters);
        return (
          <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
            <div className="text-sm text-purple-400 mb-1">{opponentName}'s word</div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">
                {oppWord || '(none)'}
              </span>
              <div className="flex items-center gap-2">
                {oppWord && (
                  <span className={`text-sm ${oppValid ? 'text-green-400' : 'text-red-400'}`}>
                    {oppValid ? 'Valid' : 'Invalid'}
                  </span>
                )}
                <span className="text-2xl font-bold text-[#fbbf24]">+{round.aiScore}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Live opponent result */}
      {isLive && liveOpponentResult && (() => {
        const oppWord = liveOpponentResult.answer || '';
        const oppValid = oppWord.length > 0 && isValidWord(oppWord) && canFormWord(oppWord, round.letters);
        return (
          <div className="bg-[#1a2d50] rounded-xl p-4 w-full max-w-md">
            <div className="text-sm text-emerald-400 mb-1">{liveData?.opponentName || 'Opponent'}'s word</div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">
                {oppWord || '(none)'}
              </span>
              <div className="flex items-center gap-2">
                {oppWord && (
                  <span className={`text-sm ${oppValid ? 'text-green-400' : 'text-red-400'}`}>
                    {oppValid ? 'Valid' : 'Invalid'}
                  </span>
                )}
                <span className="text-2xl font-bold text-[#fbbf24]">+{liveOpponentResult.score}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Waiting for live opponent */}
      {isLive && !liveOpponentResult && <WaitingOverlay />}

      {/* Best word (Dictionary Corner) */}
      <div className="bg-[#0a1628] border border-[#2a4a7f] rounded-xl p-4 w-full max-w-md">
        <div className="text-sm text-[#fbbf24] mb-1">Dictionary Corner</div>
        <div className="text-2xl font-bold text-white">
          {round.bestWord || 'No words found'}
          {round.bestWord && (
            <span className="text-lg text-blue-300 ml-2">
              ({round.bestWord.length} letters)
            </span>
          )}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={() => dispatch({ type: 'NEXT_ROUND' })}
        disabled={isLive && !liveOpponentResult}
      >
        {state.mode === 'freeplay' ? 'Play Again' : state.currentRound >= 14 ? 'See Final Scores' : 'Next Round'}
      </Button>
    </div>
  );
}
