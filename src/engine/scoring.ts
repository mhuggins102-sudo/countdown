import { isValidWord, canFormWord } from './wordValidator';

export interface LettersScore {
  playerScore: number;
  aiScore: number;
  playerWordValid: boolean;
  aiWordValid: boolean;
}

export function scoreLettersRound(
  playerWord: string,
  aiWord: string,
  availableLetters: string[],
): LettersScore {
  const playerValid = playerWord.length > 0 && isValidWord(playerWord) && canFormWord(playerWord, availableLetters);
  const aiValid = aiWord.length > 0 && isValidWord(aiWord) && canFormWord(aiWord, availableLetters);

  const playerLen = playerValid ? playerWord.length : 0;
  const aiLen = aiValid ? aiWord.length : 0;

  // 9-letter word scores 18 (double)
  const playerPoints = playerLen === 9 ? 18 : playerLen;
  const aiPoints = aiLen === 9 ? 18 : aiLen;

  if (playerLen === 0 && aiLen === 0) {
    return { playerScore: 0, aiScore: 0, playerWordValid: playerValid, aiWordValid: aiValid };
  }

  if (playerLen === aiLen) {
    // Both score if tied
    return { playerScore: playerPoints, aiScore: aiPoints, playerWordValid: playerValid, aiWordValid: aiValid };
  }

  if (playerLen > aiLen) {
    return { playerScore: playerPoints, aiScore: 0, playerWordValid: playerValid, aiWordValid: aiValid };
  }

  return { playerScore: 0, aiScore: aiPoints, playerWordValid: playerValid, aiWordValid: aiValid };
}

export interface NumbersScore {
  playerScore: number;
  aiScore: number;
  playerDistance: number;
  aiDistance: number;
}

function numbersPointsForDistance(distance: number): number {
  if (distance === 0) return 10;
  if (distance <= 5) return 7;
  if (distance <= 10) return 5;
  return 0;
}

export function scoreNumbersRound(
  playerAnswer: number | null,
  aiAnswer: number | null,
  target: number,
): NumbersScore {
  const playerDist = playerAnswer !== null ? Math.abs(playerAnswer - target) : Infinity;
  const aiDist = aiAnswer !== null ? Math.abs(aiAnswer - target) : Infinity;

  const playerPts = numbersPointsForDistance(playerDist);
  const aiPts = numbersPointsForDistance(aiDist);

  // Only the closer player scores, unless tied
  if (playerDist === aiDist) {
    return { playerScore: playerPts, aiScore: aiPts, playerDistance: playerDist, aiDistance: aiDist };
  }

  if (playerDist < aiDist) {
    return { playerScore: playerPts, aiScore: 0, playerDistance: playerDist, aiDistance: aiDist };
  }

  return { playerScore: 0, aiScore: aiPts, playerDistance: playerDist, aiDistance: aiDist };
}

export interface ConundrumScore {
  playerScore: number;
  aiScore: number;
}

/** Check if a conundrum guess is correct: must be a valid 9-letter word using exactly the scrambled letters */
export function isConundrumCorrect(guess: string, answer: string): boolean {
  if (guess.length === 0) return false;
  // Exact match is always correct (handles case where dictionary isn't loaded)
  if (guess.toUpperCase() === answer.toUpperCase()) return true;
  // Otherwise: must be a valid dictionary word that can be formed from the answer's letters
  if (guess.length !== 9) return false;
  return isValidWord(guess) && canFormWord(guess, answer.split(''));
}

export function scoreConundrumRound(
  playerGuess: string,
  aiSolved: boolean,
  answer: string,
  playerSubmittedFirst: boolean,
): ConundrumScore {
  const playerCorrect = isConundrumCorrect(playerGuess, answer);

  if (playerCorrect && playerSubmittedFirst) {
    return { playerScore: 10, aiScore: 0 };
  }

  if (aiSolved && !playerCorrect) {
    return { playerScore: 0, aiScore: 10 };
  }

  if (playerCorrect && !playerSubmittedFirst && aiSolved) {
    // AI got it first
    return { playerScore: 0, aiScore: 10 };
  }

  if (playerCorrect && !aiSolved) {
    return { playerScore: 10, aiScore: 0 };
  }

  return { playerScore: 0, aiScore: 0 };
}
