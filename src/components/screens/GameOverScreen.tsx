import { useState, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { Button } from '../shared/Button';
import { createChallenge, completeChallenge } from '../../api/challengeApi';
import { saveCompletedChallenge } from '../../utils/challengeHistory';
import type { ChallengeRoundResult, RoundState } from '../../types/game';

function roundToResult(round: RoundState): ChallengeRoundResult {
  switch (round.type) {
    case 'letters':
      return {
        roundType: 'letters',
        answer: round.playerWord,
        score: round.playerScore,
        letters: round.letters,
      };
    case 'numbers':
      return {
        roundType: 'numbers',
        answer: String(round.playerAnswer ?? ''),
        score: round.playerScore,
        steps: round.playerSteps,
        numbers: round.numbers,
        target: round.target,
      };
    case 'conundrum':
      return {
        roundType: 'conundrum',
        answer: round.playerGuess,
        score: round.playerScore,
        timeRemaining: round.playerTimeRemaining,
      };
  }
}

export function GameOverScreen({ onPlayAgain }: { onPlayAgain: () => void }) {
  const { state } = useGame();
  const isChallenge = state.mode === 'challenge';
  const hasOpponent = isChallenge && !!state.challengeData?.opponentResults?.length;
  const isP1 = isChallenge && !hasOpponent;

  // For P2 challenge, aiTotalScore accumulated P1's head-to-head scores during reveal
  const opponentScore = state.aiTotalScore;
  const opponentLabel = hasOpponent
    ? (state.challengeData!.opponentName || 'Challenger')
    : 'AI';

  const playerWon = state.playerTotalScore > opponentScore;
  const tied = state.playerTotalScore === opponentScore;

  // Challenge upload state
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const challengeCode = state.challengeData?.code || '';

  // Auto-upload challenge results
  useEffect(() => {
    if (!isChallenge || uploaded || uploading) return;
    setUploading(true);

    const results = state.rounds.map(roundToResult);

    if (isP1) {
      // P1: create the challenge
      createChallenge({
        seed: state.challengeData!.seed,
        code: state.challengeData!.code,
        timerDuration: state.challengeData!.timerDuration,
        playerName: 'Player 1',
        results,
        totalScore: state.playerTotalScore,
      }).then(() => {
        setUploaded(true);
        setUploading(false);
      }).catch(() => setUploading(false));
    } else {
      // P2: complete the challenge
      completeChallenge(state.challengeData!.code, {
        playerName: 'Player 2',
        results,
        totalScore: state.playerTotalScore,
      }).then(() => {
        // Save to local history
        saveCompletedChallenge({
          code: state.challengeData!.code,
          completedAt: Date.now(),
          asPlayer: 2,
          p1Name: state.challengeData!.opponentName || 'Player 1',
          p1Score: opponentScore,
          p2Name: 'Player 2',
          p2Score: state.playerTotalScore,
        });
        setUploaded(true);
        setUploading(false);
      }).catch(() => setUploading(false));
    }
  }, [isChallenge, isP1, uploaded, uploading, state]);

  const handleCopy = async () => {
    const url = `${window.location.origin}?challenge=${challengeCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        {isP1 ? (
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#fbbf24]">Game Complete!</h1>
        ) : (
          <h1 className={`text-5xl md:text-6xl font-extrabold ${
            playerWon ? 'text-green-400' : tied ? 'text-[#fbbf24]' : 'text-red-400'
          }`}>
            {playerWon ? 'You Win!' : tied ? 'Draw!' : 'You Lose!'}
          </h1>
        )}
      </div>

      {/* Final scores — only for P2 or non-challenge */}
      {!isP1 && (
        <div className="flex gap-8 items-center">
          <div className="text-center">
            <div className="text-sm text-blue-300 uppercase">You</div>
            <div className="text-5xl font-bold text-white">{state.playerTotalScore}</div>
          </div>
          <div className="text-2xl text-blue-400">vs</div>
          <div className="text-center">
            <div className="text-sm text-blue-300 uppercase">{opponentLabel}</div>
            <div className="text-5xl font-bold text-white">{opponentScore}</div>
          </div>
        </div>
      )}

      {/* Challenge share section (P1 only) */}
      {isP1 && (
        <div className="bg-[#1a2d50] rounded-xl p-5 w-full max-w-md text-center">
          <h3 className="text-lg font-semibold text-[#fbbf24] mb-2">Share Your Challenge</h3>
          <p className="text-blue-300 text-sm mb-4">
            Send this code to a friend so they can play the same game
          </p>
          <div className="text-4xl font-mono font-bold text-white tracking-[0.3em] mb-4">
            {challengeCode}
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCopy}
            disabled={uploading}
          >
            {uploading ? 'Saving...' : copied ? 'Copied!' : 'Copy Challenge Link'}
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="bg-[#1a2d50] rounded-xl p-5 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#fbbf24] mb-3">Game Stats</h3>
        <div className="space-y-2 text-sm">
          {isP1 && (
            <div className="flex justify-between text-blue-200">
              <span>Your total score</span>
              <span className="text-white font-medium">{state.playerTotalScore} pts</span>
            </div>
          )}
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
          {!isP1 && (
            <div className="flex justify-between text-blue-200">
              <span>Letters rounds won</span>
              <span className="text-white font-medium">
                {lettersRounds.filter((r) => r.playerScore > r.aiScore).length}/{lettersRounds.length}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="gold" size="lg" onClick={onPlayAgain}>
          {isChallenge ? 'Back to Menu' : 'Play Again'}
        </Button>
      </div>
    </div>
  );
}
