import type {
  GameState,
  RoundType,
  Difficulty,
  DifficultyOrOff,
  LettersRoundState,
  NumbersRoundState,
  ConundrumRoundState,
} from '../types/game';
import { ROUND_ORDER, TIMER_DURATION } from '../types/game';

import { selectNumbers, generateTarget } from '../engine/letterPicker';
import { CONUNDRUM_WORDS } from '../data/conundrums';
import { shuffle } from '../utils/shuffle';

export type GameAction =
  | { type: 'START_FULL_GAME'; difficulty: Difficulty; timerDuration: number }
  | { type: 'START_FREEPLAY'; roundType: RoundType; timerDuration: number; difficulty: DifficultyOrOff }
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
  | { type: 'RETURN_TO_MENU' };

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

function createNumbersRound(roundIndex: number, aiOff: boolean): NumbersRoundState {
  return {
    type: 'numbers',
    numbers: [],
    largeCount: 0,
    smallCount: 0,
    target: generateTarget(),
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

function createConundrumRound(): ConundrumRoundState {
  const word = CONUNDRUM_WORDS[Math.floor(Math.random() * CONUNDRUM_WORDS.length)];
  const scrambled = shuffle(word.split('')).join('');
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

function createRoundState(roundType: RoundType, roundIndex: number, aiOff: boolean) {
  switch (roundType) {
    case 'letters': return createLettersRound(roundIndex, aiOff);
    case 'numbers': return createNumbersRound(roundIndex, aiOff);
    case 'conundrum': return createConundrumRound();
  }
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

    case 'INIT_ROUND': {
      const roundType = state.mode === 'fullgame'
        ? ROUND_ORDER[state.currentRound]
        : state.freeplayType!;
      return {
        ...state,
        phase: 'picking',
        timerRunning: false,
        timeRemaining: state.timerDuration,
        currentRoundState: createRoundState(roundType, state.currentRound, state.difficulty === 'off'),
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
      const numbers = selectNumbers(action.count);
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
      const newTime = state.timeRemaining - 1;
      if (newTime <= 0) {
        return {
          ...state,
          timeRemaining: 0,
          timerRunning: false,
        };
      }
      return { ...state, timeRemaining: newTime };

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
      const totalRounds = state.mode === 'fullgame' ? ROUND_ORDER.length : Infinity;

      if (nextRound >= totalRounds) {
        return {
          ...state,
          screen: 'gameover',
          currentRoundState: null,
        };
      }

      const roundType = state.mode === 'fullgame'
        ? ROUND_ORDER[nextRound]
        : state.freeplayType!;

      return {
        ...state,
        currentRound: nextRound,
        phase: roundType === 'conundrum' ? 'playing' : 'picking',
        timerRunning: roundType === 'conundrum',
        timeRemaining: state.timerDuration,
        currentRoundState: createRoundState(roundType, nextRound, state.difficulty === 'off'),
      };
    }

    case 'RETURN_TO_MENU':
      return { ...initialState };

    default:
      return state;
  }
}
