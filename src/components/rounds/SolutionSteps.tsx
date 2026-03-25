import { useState, useEffect } from 'react';
import type { SolutionStep } from '../../types/game';
import { getOriginalHighlights, displayOp } from '../../engine/expressionEval';

interface SolutionStepsProps {
  steps: SolutionStep[];
  target: number;
  closest: number;
  originalNumbers: number[];
}

export function SolutionSteps({ steps, target, closest, originalNumbers }: SolutionStepsProps) {
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    if (visibleSteps < steps.length) {
      const timer = setTimeout(() => {
        setVisibleSteps((v) => v + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [visibleSteps, steps.length]);

  const highlights = getOriginalHighlights(steps, originalNumbers);

  if (steps.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl p-4 text-center">
        <p className="text-blue-300">No solution steps needed — number was already available!</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f1d32] border border-[#2a4a7f]/50 rounded-xl p-5 w-full max-w-md">
      <div className="text-sm text-[#fbbf24] mb-3 font-semibold">Solution</div>
      <div className="space-y-2 font-mono text-lg">
        {steps.slice(0, visibleSteps).map((step, i) => {
          const hl = highlights[i];
          return (
            <div
              key={i}
              className="animate-fade-in flex items-center gap-2 text-white"
            >
              <span
                className={
                  hl.aIsOriginal
                    ? 'bg-[#fbbf24]/20 text-[#fbbf24] px-1.5 py-0.5 rounded font-bold'
                    : 'text-blue-300'
                }
              >
                {step.a}
              </span>
              <span className="text-[#fbbf24]">{displayOp(step.op)}</span>
              <span
                className={
                  hl.bIsOriginal
                    ? 'bg-[#fbbf24]/20 text-[#fbbf24] px-1.5 py-0.5 rounded font-bold'
                    : 'text-blue-300'
                }
              >
                {step.b}
              </span>
              <span className="text-blue-400">=</span>
              <span className={`font-bold ${step.result === target ? 'text-green-400' : 'text-white'}`}>
                {step.result}
              </span>
            </div>
          );
        })}
      </div>
      {visibleSteps >= steps.length && (
        <div className="mt-3 pt-3 border-t border-[#2a4a7f]/50 animate-fade-in">
          {closest === target ? (
            <span className="text-green-400 font-semibold">Exact solution found!</span>
          ) : (
            <span className="text-blue-300">
              Closest achievable: <span className="text-white font-bold">{closest}</span>
              {' '}(off by {Math.abs(closest - target)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
