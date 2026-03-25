export type RoundType = 'letters' | 'numbers' | 'conundrum';
export type RoundPhase = 'picking' | 'playing' | 'reveal';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'freeplay' | 'fullgame';
export type Screen = 'menu' | 'difficulty' | 'freeplay' | 'playing' | 'gameover';

export interface SolutionStep {
  a: number;
  op: '+' | '-' | '*' | '/';
  b: number;
  result: number;
}

export interface LettersRoundState {
  type: 'letters';
  letters: string[];
  consonantCount: number;
  vowelCount: number;
  playerWord: string;
  aiWord: string;
  bestWord: string;
  playerScore: number;
  aiScore: number;
  isPlayerPicking: boolean;
}

export interface NumbersRoundState {
  type: 'numbers';
  numbers: number[];
  largeCount: number;
  smallCount: number;
  target: number;
  playerAnswer: number | null;
  playerSteps: SolutionStep[];
  aiAnswer: number | null;
  solution: SolutionStep[];
  playerScore: number;
  aiScore: number;
  isPlayerPicking: boolean;
}

export interface ConundrumRoundState {
  type: 'conundrum';
  scrambled: string;
  answer: string;
  playerGuess: string;
  aiSolved: boolean;
  aiGuessTime: number;
  playerScore: number;
  aiScore: number;
}

export type RoundState = LettersRoundState | NumbersRoundState | ConundrumRoundState;

export interface GameState {
  mode: GameMode;
  difficulty: Difficulty;
  currentRound: number;
  phase: RoundPhase;
  playerTotalScore: number;
  aiTotalScore: number;
  rounds: RoundState[];
  currentRoundState: RoundState | null;
  screen: Screen;
  timerRunning: boolean;
  timeRemaining: number;
  freeplayType: RoundType | null;
}

export const ROUND_ORDER: RoundType[] = [
  'letters', 'letters', 'numbers',
  'letters', 'letters', 'numbers',
  'letters', 'letters', 'numbers',
  'letters', 'letters', 'numbers',
  'letters', 'letters', 'conundrum',
];

export const TIMER_DURATION = 30;
export const NUMBERS_TIMER_DURATION = 60;
