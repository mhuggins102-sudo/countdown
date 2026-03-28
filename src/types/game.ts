export type RoundType = 'letters' | 'numbers' | 'conundrum';
export type RoundPhase = 'picking' | 'playing' | 'reveal';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type DifficultyOrOff = Difficulty | 'off';
export type GameMode = 'freeplay' | 'fullgame' | 'challenge' | 'btc' | 'live';
export type BtcMode = 'letters' | 'numbers' | 'all';
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
  aiSteps: SolutionStep[];
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
  playerTimeRemaining: number;
  aiSolved: boolean;
  aiGuessTime: number;
  playerScore: number;
  aiScore: number;
}

export type RoundState = LettersRoundState | NumbersRoundState | ConundrumRoundState;

/** Per-round result stored for challenge replay */
export interface ChallengeRoundResult {
  roundType: RoundType;
  /** Letters: word submitted; Numbers: answer number; Conundrum: guess */
  answer: string;
  score: number;
  /** Numbers round: player steps */
  steps?: SolutionStep[];
  /** Conundrum: time remaining when submitted */
  timeRemaining?: number;
  /** Letters round: the 9 letters picked */
  letters?: string[];
  /** Numbers round: the 6 numbers picked */
  numbers?: number[];
  /** Numbers round: the target number */
  target?: number;
}

export interface ChallengeData {
  seed: number;
  code: string;
  timerDuration: number;
  /** Player 1's results (present when playing as P2) */
  opponentName: string;
  opponentResults: ChallengeRoundResult[];
  opponentTotalScore: number;
}

export interface GameState {
  mode: GameMode;
  difficulty: DifficultyOrOff;
  currentRound: number;
  phase: RoundPhase;
  playerTotalScore: number;
  aiTotalScore: number;
  rounds: RoundState[];
  currentRoundState: RoundState | null;
  screen: Screen;
  timerRunning: boolean;
  timeRemaining: number;
  timerDuration: number;
  freeplayType: RoundType | null;
  /** Challenge mode data */
  challengeData: ChallengeData | null;
  /** Beat the Clock mode */
  btcMode: BtcMode | null;
  btcRoundsCompleted: number;
  btcRoundKey: number;
  btcLastBonus: number;
  /** Live multiplayer data */
  liveData: LiveData | null;
}

/** Picks submitted by P1 for a live round */
export interface LiveRoundPicks {
  roundIndex: number;
  roundType: RoundType;
  /** Letters round: the 9 letters picked */
  letters?: string[];
  /** Numbers round: the 6 numbers picked */
  numbers?: number[];
  /** Numbers round: the target number */
  target?: number;
}

/** A player's submission for a live round */
export interface LiveRoundSubmission {
  roundIndex: number;
  roundType: RoundType;
  answer: string;
  score: number;
  steps?: SolutionStep[];
  timeRemaining?: number;
}

/** Room record stored in KV */
export interface LiveRoomRecord {
  seed: number;
  code: string;
  timerDuration: number;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished' | 'abandoned';
  p1Name: string;
  p1Id: string;
  p2Name?: string;
  p2Id?: string;
  currentRound: number;
  picks: LiveRoundPicks[];
  p1Results: (LiveRoundSubmission | null)[];
  p2Results: (LiveRoundSubmission | null)[];
  p1TotalScore: number;
  p2TotalScore: number;
  p1LastSeen: number;
  p2LastSeen: number;
}

/** Client-side live game data */
export interface LiveData {
  code: string;
  playerId: string;
  isHost: boolean;
  opponentName: string;
  opponentJoined: boolean;
  /** Picks for the current round (from P1) */
  currentPicks: LiveRoundPicks | null;
  /** Opponent's submission for the current round */
  opponentResult: LiveRoundSubmission | null;
  /** Whether we've submitted our result for the current round */
  submitted: boolean;
  /** Opponent's total score */
  opponentTotalScore: number;
  /** Opponent's last seen timestamp (for disconnect detection) */
  opponentLastSeen: number;
}

export const ROUND_ORDER: RoundType[] = [
  'letters', 'letters', 'numbers',
  'letters', 'letters', 'numbers',
  'letters', 'letters', 'numbers',
  'letters', 'letters', 'numbers',
  'letters', 'letters', 'conundrum',
];

export const TIMER_DURATION = 60;
