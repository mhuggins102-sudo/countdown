import { useEffect, useRef, useState } from 'react';

interface BtcTimerProps {
  timeRemaining: number;
  isRunning: boolean;
}

export function BtcTimer({ timeRemaining, isRunning }: BtcTimerProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Progress: full when >= 60, otherwise fraction of 60
  const progress = Math.min(timeRemaining / 60, 1);
  const offset = circumference * (1 - progress);

  const color = timeRemaining <= 5
    ? '#ef4444'
    : timeRemaining <= 10
      ? '#f59e0b'
      : '#3b82f6';

  // Animated display number (counts up when bonus added)
  const [displayTime, setDisplayTime] = useState(timeRemaining);
  const prevTimeRef = useRef(timeRemaining);
  const animFrameRef = useRef<number>(0);

  // Bonus/penalty popup state
  const [bonusPopup, setBonusPopup] = useState<{ amount: number; key: number; isBonus: boolean } | null>(null);
  const bonusKeyRef = useRef(0);

  useEffect(() => {
    const prev = prevTimeRef.current;
    const diff = timeRemaining - prev;
    prevTimeRef.current = timeRemaining;

    if (diff > 1 || diff < -1) {
      // Bonus or penalty was applied — animate the count
      const startVal = prev;
      const endVal = timeRemaining;
      const absDiff = Math.abs(diff);
      const duration = Math.min(500, absDiff * 30); // ~30ms per second, max 500ms
      const startTime = performance.now();

      // Show popup
      bonusKeyRef.current += 1;
      setBonusPopup({ amount: diff, key: bonusKeyRef.current, isBonus: diff > 0 });
      setTimeout(() => setBonusPopup(null), 1500);

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        setDisplayTime(Math.round(startVal + (endVal - startVal) * t));
        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      setDisplayTime(timeRemaining);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [timeRemaining]);

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
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-4xl font-bold tabular-nums ${
            timeRemaining <= 5 ? 'text-red-400' : 'text-white'
          } ${isRunning && timeRemaining <= 5 ? 'animate-pulse' : ''}`}
        >
          {displayTime}
        </span>
      </div>

      {/* Bonus/penalty popup */}
      {bonusPopup && (
        <div
          key={bonusPopup.key}
          className={`absolute -top-2 left-1/2 -translate-x-1/2 font-bold text-2xl pointer-events-none ${
            bonusPopup.isBonus ? 'text-green-400 animate-btc-bonus' : 'text-red-400 animate-btc-penalty'
          }`}
        >
          {bonusPopup.isBonus ? '+' : ''}{bonusPopup.amount}s
        </div>
      )}
    </div>
  );
}
