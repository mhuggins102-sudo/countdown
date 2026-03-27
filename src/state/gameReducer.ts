import type {
  GameState,
  RoundType,
  RoundState,
  Difficulty,
  DifficultyOrOff,
  BtcMode,
  LettersRoundState,
  NumbersRoundState,
  ConundrumRoundState,
  ChallengeData,
  ChallengeRoundResult,
} from '../types/game';
import { ROUND_ORDER, TIMER_DURATION } from '../types/game';

import { selectNumbers, generateTarget } from '../engine/letterPicker';
import { generateBtcLetters, generateBtcNumbers } from '../engine/btcGenerator';
import { CONUNDRUM_WORDS } from '../data/conundrums';
import { shuffle } from '../utils/shuffle';
import { createSeededRng } from '../utils/seededRng';

export type GameAction =
  | { type: 'START_FULL_GAME'; difficulty: Difficulty; timerDuration: number }
  | { type: 'START_FREEPLAY'; roundType: RoundType; timerDuration: number; difficulty: DifficultyOrOff }
  | { type: 'START_CHALLENGE'; seed: number; code: string; timerDuration: number; opponentName?: string; opponentResults?: ChallengeData['opponentResults']; opponentTotalScore?: number }
  | { type: 'INIT_ROUND' }
  | { type: 'PICK_LETTER'; letter: string; isConsonant: boolean }
  | { type: 'PICK_LARGE_COUNT'; count: number }
  | { type: 'PICK_NUMBER'; number: number; isLarge: boolean }
  | { type: 'START_TIMER' }
  | { type: 'TICK' }
  | { type: 'SUBMIT_LETTERS_WORD'; word: string }
  | { type: 'SUBMIT_NUMBERS_ANSWER'; answer: number; steps: import('../types/game').SolutionStep[] }
  | { type: 'SUBMIT_CONUNDRUM_GUESS'; guess: string; timeRemaining: number }
  | { type: 'SET_CONUNDRUM_AI'; solved: boolean; guessTime: number }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'SET_ROUND_RESULTS'; playerScore: number; aiScore: number; extras?: Record<string, unknown> }
  | { type: 'NEXT_ROUND' }
  | { type: 'RETURN_TO_MENU' }
  | { type: 'START_BTC'; btcMode: BtcMode }
  | { type: 'BTC_SUBMIT'; bonus: number }
  | { type: 'BTC_SKIP' };

export const initialState: GameState = {
  mode: 'freeplay',
  difficulty: 'medium',
  currentRound: 0,
  phase: 'picking',
  playerTotalScore: 0,
  aiTotalScore: 0,
  rounds: [],
  currentRoundState: null,
  screen: 'menu',
  timerRunning: false,
  timeRemaining: TIMER_DURATION,
  timerDuration: TIMER_DURATION,
  freeplayType: null,
  challengeData: null,
  btcMode: null,
  btcRoundsCompleted: 0,
  btcLastBonus: 0,
};

function isPlayerPickingRound(roundIndex: number): boolean {
  // Player picks on odd-indexed rounds (1-based: rounds 1, 3, 5...), AI picks on even
  // Using 0-based: player picks on even indices (0, 2, 4...), AI on odd (1, 3, 5...)
  return roundIndex % 2 === 0;
}

function createLettersRound(roundIndex: number, aiOff: boolean): LettersRoundState {
  return {
    type: 'letters',
    letters: [],
    consonantCount: 0,
    vowelCount: 0,
    playerWord: '',
    aiWord: '',
    bestWord: '',
    playerScore: 0,
    aiScore: 0,
    isPlayerPicking: aiOff || isPlayerPickingRound(roundIndex),
  };
}

function createNumbersRound(roundIndex: number, aiOff: boolean, rng?: () => number): NumbersRoundState {
  return {
    type: 'numbers',
    numbers: [],
    largeCount: 0,
    smallCount: 0,
    target: generateTarget(rng),
    playerAnswer: null,
    playerSteps: [],
    aiAnswer: null,
    aiSteps: [],
    solution: [],
    playerScore: 0,
    aiScore: 0,
    isPlayerPicking: aiOff || isPlayerPickingRound(roundIndex),
  };
}

function createConundrumRound(rng?: () => number): ConundrumRoundState {
  const r = rng || Math.random;
  const word = CONUNDRUM_WORDS[Math.floor(r() * CONUNDRUM_WORDS.length)];
  const scrambled = shuffle(word.split(''), r).join('');
  return {
    type: 'conundrum',
    scrambled,
    answer: word,
    playerGuess: '',
    playerTimeRemaining: 0,
    aiSolved: false,
    aiGuessTime: 0,
    playerScore: 0,
    aiScore: 0,
  };
}

function createRoundState(roundType: RoundType, roundIndex: number, aiOff: boolean, rng?: () => number) {
  switch (roundType) {
    case 'letters': return createLettersRound(roundIndex, aiOff);
    case 'numbers': return createNumbersRound(roundIndex, aiOff, rng);
    case 'conundrum': return createConundrumRound(rng);
  }
}

/**
 * Create a seeded RNG that's advanced to the correct position for a given round.
 * Each round consumes some random values, so we create a fresh RNG from seed
 * and derive a per-round sub-seed.
 */
function rngForRound(seed: number, roundIndex: number): () => number {
  // Create a master RNG and derive a sub-seed for each round
  const master = createSeededRng(seed);
  // Skip ahead by consuming values for prior rounds
  for (let i = 0; i <= roundIndex; i++) {
    master(); // consume one value per round as sub-seed source
  }
  // Use the last consumed value as the sub-seed for this round
  return createSeededRng(Math.floor(master() * 4294967296));
}

/**
 * When P2 plays a challenge, set up the round to reveal P1's picks via animation.
 * Letters/numbers start empty with isPlayerPicking=false so picking components auto-reveal.
 * Numbers rounds also get P1's target.
 */
function applyOpponentPicks(
  roundState: RoundState,
  opponentResult: ChallengeRoundResult | undefined,
): { round: RoundState; skipPicking: boolean } {
  if (!opponentResult) return { round: roundState, skipPicking: false };

  if (roundState.type === 'letters') {
    return {
      round: { ...roundState, isPlayerPicking: false },
      skipPicking: false,
    };
  }

  if (roundState.type === 'numbers' && opponentResult.target != null) {
    return {
      round: {
        ...roundState,
        target: opponentResult.target,
        isPlayerPicking: false,
      },
      skipPicking: false,
    };
  }

  return { round: roundState, skipPicking: false };
}

/** Pick a random round type for BTC based on mode and game probabilities */
function pickBtcRoundType(btcMode: BtcMode): RoundType {
  if (btcMode === 'letters') return 'letters';
  if (btcMode === 'numbers') return 'numbers';
  // 'all' mode: 10/15 letters, 4/15 numbers, 1/15 conundrum
  const r = Math.random() * 15;
  if (r < 10) return 'letters';
  if (r < 14) return 'numbers';
  return 'conundrum';
}

/** Create a fully populated round for BTC (no picking phase) */
function createBtcRound(roundType: RoundType): RoundState {
  if (roundType === 'letters') {
    const letters = generateBtcLetters();
    return {
      type: 'letters',
      letters,
      consonantCount: letters.filter((l) => !'AEIOU'.includes(l)).length,
      vowelCount: letters.filter((l) => 'AEIOU'.includes(l)).length,
      playerWord: '',
      aiWord: '',
      bestWord: '',
      playerScore: 0,
      aiScore: 0,
      isPlayerPicking: false,
    };
  }
  if (roundType === 'numbers') {
    const { numbers, target, largeCount } = generateBtcNumbers();
    return {
      type: 'numbers',
      numbers,
      largeCount,
      smallCount: 6 - largeCount,
      target,
      playerAnswer: null,
      playerSteps: [],
      aiAnswer: null,
      aiSteps: [],
      solution: [],
      playerScore: 0,
      aiScore: 0,
      isPlayerPicking: false,
    };
  }
  // conundrum
  return createConundrumRound();
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_FULL_GAME':
      return {
        ...initialState,
        mode: 'fullgame',
        difficulty: action.difficulty,
        screen: 'playing',
        currentRound: 0,
        phase: 'picking',
        timerDuration: action.timerDuration,
        timeRemaining: action.timerDuration,
        currentRoundState: createRoundState(ROUND_ORDER[0], 0, false),
      };

    case 'START_FREEPLAY':
      return {
        ...initialState,
        mode: 'freeplay',
        difficulty: action.difficulty,
        screen: 'playing',
        freeplayType: action.roundType,
        currentRound: 0,
        phase: action.roundType === 'conundrum' ? 'playing' : 'picking',
        timerRunning: action.roundType === 'conundrum',
        timerDuration: action.timerDuration,
        timeRemaining: action.timerDuration,
        currentRoundState: createRoundState(action.roundType, 0, action.difficulty === 'off'),
      };

    case 'START_CHALLENGE': {
      const rng = rngForRound(action.seed, 0);
      const opponentResults = action.opponentResults || [];
      const isP2 = opponentResults.length > 0;
      const baseRound = createRoundState(ROUND_ORDER[0], 0, true, rng);
      const { round: roundState, skipPicking } = isP2
        ? applyOpponentPicks(baseRound, opponentResults[0])
        : { round: baseRound, skipPicking: false };
      const roundType = ROUND_ORDER[0];
      const startPlaying = skipPicking || roundType === 'conundrum';

      return {
        ...initialState,
        mode: 'challenge',
        difficulty: 'off', // No AI in challenge mode
        screen: 'playing',
        currentRound: 0,
        phase: startPlaying ? 'playing' : 'picking',
        timerRunning: startPlaying,
        timerDuration: action.timerDuration,
        timeRemaining: action.timerDuration,
        currentRoundState: roundState,
        challengeData: {
          seed: action.seed,
          code: action.code,
          timerDuration: action.timerDuration,
          opponentName: action.opponentName || '',
          opponentResults,
          opponentTotalScore: action.opponentTotalScore || 0,
        },
      };
    }

    case 'INIT_ROUND': {
      const roundType = state.mode === 'fullgame' || state.mode === 'challenge'
        ? ROUND_ORDER[state.currentRound]
        : state.freeplayType!;
      const rng = state.challengeData
        ? rngForRound(state.challengeData.seed, state.currentRound)
        : undefined;
      const baseRound = createRoundState(roundType, state.currentRound, state.difficulty === 'off', rng);
      const isP2 = !!state.challengeData?.opponentResults?.length;
      const { round: roundState, skipPicking } = isP2
        ? applyOpponentPicks(baseRound, state.challengeData!.opponentResults[state.currentRound])
        : { round: baseRound, skipPicking: false };
      const startPlaying = skipPicking || roundType === 'conundrum';

      return {
        ...state,
        phase: startPlaying ? 'playing' : 'picking',
        timerRunning: startPlaying,
        timeRemaining: state.timerDuration,
        currentRoundState: roundState,
      };
    }

    case 'PICK_LETTER': {
      if (state.currentRoundState?.type !== 'letters') return state;
      const letters = state.currentRoundState;
      const newLetters = [...letters.letters, action.letter];
      const newConsonantCount = letters.consonantCount + (action.isConsonant ? 1 : 0);
      const newVowelCount = letters.vowelCount + (action.isConsonant ? 0 : 1);

      const shouldStartTimer = newLetters.length >= 9;

      return {
        ...state,
        phase: shouldStartTimer ? 'playing' : 'picking',
        timerRunning: shouldStartTimer,
        timeRemaining: shouldStartTimer ? state.timerDuration : state.timeRemaining,
        currentRoundState: {
          ...letters,
          letters: newLetters,
          consonantCount: newConsonantCount,
          vowelCount: newVowelCount,
        },
      };
    }

    case 'PICK_LARGE_COUNT': {
      if (state.currentRoundState?.type !== 'numbers') return state;
      const rng = state.challengeData
        ? rngForRound(state.challengeData.seed, state.currentRound)
        : undefined;
      const numbers = selectNumbers(action.count, rng);
      return {
        ...state,
        phase: 'playing',
        timerRunning: true,
        timeRemaining: state.timerDuration,
        currentRoundState: {
          ...state.currentRoundState,
          numbers,
          largeCount: action.count,
          smallCount: 6 - action.count,
        },
      };
    }

    case 'PICK_NUMBER': {
      if (state.currentRoundState?.type !== 'numbers') return state;
      const numRound = state.currentRoundState;
      const newNumbers = [...numRound.numbers, action.number];
      const newLargeCount = numRound.largeCount + (action.isLarge ? 1 : 0);
      const newSmallCount = numRound.smallCount + (action.isLarge ? 0 : 1);

      const allPicked = newNumbers.length >= 6;

      return {
        ...state,
        phase: allPicked ? 'playing' : 'picking',
        timerRunning: allPicked,
        timeRemaining: allPicked ? state.timerDuration : state.timeRemaining,
        currentRoundState: {
          ...numRound,
          numbers: newNumbers,
          largeCount: newLargeCount,
          smallCount: newSmallCount,
        },
      };
    }

    case 'START_TIMER':
      return {
        ...state,
        phase: 'playing',
        timerRunning: true,
        timeRemaining: state.timerDuration,
      };

    case 'TICK':
      if (!state.timerRunning) return state;
      const newTickTime = state.timeRemaining - 1;
      if (newTickTime <= 0) {
        if (state.mode === 'btc') {
          return { ...state, timeRemaining: 0, timerRunning: false, screen: 'gameover' };
        }
        return { ...state, timeRemaining: 0, timerRunning: false };
      }
      return { ...state, timeRemaining: newTickTime };

    case 'SUBMIT_LETTERS_WORD': {
      if (state.currentRoundState?.type !== 'letters') return state;
      return {
        ...state,
        timerRunning: false,
        currentRoundState: {
          ...state.currentRoundState,
          playerWord: action.word.toUpperCase(),
        },
      };
    }

    case 'SUBMIT_NUMBERS_ANSWER': {
      if (state.currentRoundState?.type !== 'numbers') return state;
      return {
        ...state,
        timerRunning: false,
        currentRoundState: {
          ...state.currentRoundState,
          playerAnswer: action.answer,
          playerSteps: action.steps,
        },
      };
    }

    case 'SUBMIT_CONUNDRUM_GUESS': {
      if (state.currentRoundState?.type !== 'conundrum') return state;
      return {
        ...state,
        timerRunning: false,
        currentRoundState: {
          ...state.currentRoundState,
          playerGuess: action.guess.toUpperCase(),
          playerTimeRemaining: action.timeRemaining,
        },
      };
    }

    case 'SET_CONUNDRUM_AI': {
      if (state.currentRoundState?.type !== 'conundrum') return state;
      return {
        ...state,
        currentRoundState: {
          ...state.currentRoundState,
          aiSolved: action.solved,
          aiGuessTime: action.guessTime,
        },
      };
    }

    case 'TIMER_EXPIRED':
      return {
        ...state,
        timerRunning: false,
        timeRemaining: 0,
        phase: 'reveal',
      };

    case 'SET_ROUND_RESULTS': {
      if (!state.currentRoundState) return state;
      const updatedRound = {
        ...state.currentRoundState,
        playerScore: action.playerScore,
        aiScore: action.aiScore,
        ...(action.extras || {}),
      } as typeof state.currentRoundState;

      return {
        ...state,
        phase: 'reveal',
        playerTotalScore: state.playerTotalScore + action.playerScore,
        aiTotalScore: state.aiTotalScore + action.aiScore,
        currentRoundState: updatedRound,
        rounds: [...state.rounds, updatedRound],
      };
    }

    case 'NEXT_ROUND': {
      const nextRound = state.currentRound + 1;
      const isMultiRound = state.mode === 'fullgame' || state.mode === 'challenge';
      const totalRounds = isMultiRound ? ROUND_ORDER.length : Infinity;

      if (nextRound >= totalRounds) {
        return {
          ...state,
          screen: 'gameover',
          currentRoundState: null,
        };
      }

      const roundType = isMultiRound
        ? ROUND_ORDER[nextRound]
        : state.freeplayType!;

      const rng = state.challengeData
        ? rngForRound(state.challengeData.seed, nextRound)
        : undefined;

      const baseRound = createRoundState(roundType, nextRound, state.difficulty === 'off', rng);
      const isP2 = !!state.challengeData?.opponentResults?.length;
      const { round: roundState, skipPicking } = isP2
        ? applyOpponentPicks(baseRound, state.challengeData!.opponentResults[nextRound])
        : { round: baseRound, skipPicking: false };
      const startPlaying = skipPicking || roundType === 'conundrum';

      return {
        ...state,
        currentRound: nextRound,
        phase: startPlaying ? 'playing' : 'picking',
        timerRunning: startPlaying,
        timeRemaining: state.timerDuration,
        currentRoundState: roundState,
      };
    }

    case 'START_BTC': {
      const roundType = pickBtcRoundType(action.btcMode);
      return {
        ...initialState,
        mode: 'btc',
        difficulty: 'off',
        screen: 'playing',
        phase: 'playing',
        timerRunning: true,
        timerDuration: 60,
        timeRemaining: 60,
        btcMode: action.btcMode,
        btcRoundsCompleted: 0,
        btcLastBonus: 0,
        currentRoundState: createBtcRound(roundType),
      };
    }

    case 'BTC_SUBMIT': {
      if (state.mode !== 'btc' || !state.btcMode) return state;
      const newTime = state.timeRemaining + action.bonus;
      const nextType = pickBtcRoundType(state.btcMode);
      return {
        ...state,
        timeRemaining: newTime,
        btcRoundsCompleted: state.btcRoundsCompleted + 1,
        btcLastBonus: action.bonus,
        currentRoundState: createBtcRound(nextType),
      };
    }

    case 'BTC_SKIP': {
      if (state.mode !== 'btc' || !state.btcMode) return state;
      const skipPenalty = -10;
      const newTime = state.timeRemaining + skipPenalty;
      if (newTime <= 0) {
        return { ...state, timeRemaining: 0, timerRunning: false, screen: 'gameover' };
      }
      const nextType = pickBtcRoundType(state.btcMode);
      return {
        ...state,
        timeRemaining: newTime,
        btcLastBonus: skipPenalty,
        currentRoundState: createBtcRound(nextType),
      };
    }

    case 'RETURN_TO_MENU':
      return { ...initialState };

    default:
      return state;
  }
}
