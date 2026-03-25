import { TIMER_DURATION } from '../../types/game';

interface TimerProps {
  timeRemaining: number;
  isRunning: boolean;
  totalTime?: number;
}

export function Timer({ timeRemaining, isRunning, totalTime = TIMER_DURATION }: TimerProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = timeRemaining / totalTime;
  const offset = circumference * (1 - progress);

  const color = timeRemaining <= 5
    ? '#ef4444'
    : timeRemaining <= 10
      ? '#f59e0b'
      : '#3b82f6';

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="#1a2d50"
          strokeWidth="8"
        />
        {/* Progress arc */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-4xl font-bold tabular-nums ${
            timeRemaining <= 5 ? 'text-red-400' : 'text-white'
          } ${isRunning && timeRemaining <= 5 ? 'animate-pulse' : ''}`}
        >
          {timeRemaining}
        </span>
      </div>
    </div>
  );
}
