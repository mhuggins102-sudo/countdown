import { useState, useRef, useCallback } from 'react';
import type { SolutionStep } from '../../types/game';
import { getOriginalHighlights, displayOp } from '../../engine/expressionEval';

interface SolutionStepsProps {
  steps: SolutionStep[];
  target: number;
  closest: number;
  originalNumbers: number[];
}

export function SolutionSteps({ steps, target, closest, originalNumbers }: SolutionStepsProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    if (open) {
      setOpen(false);
      // Scroll to top of page — try both methods for mobile compatibility
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
    } else {
      setOpen(true);
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [open]);

  const highlights = getOriginalHighlights(steps, originalNumbers);

  if (steps.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl p-4 text-center w-full max-w-md">
        <p className="text-blue-300">No solution steps needed — number was already available!</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-md">
      <button
        onClick={toggle}
        className="w-full bg-[#0f1d32] border border-[#2a4a7f]/50 rounded-xl px-5 py-4 flex items-center justify-between cursor-pointer hover:border-[#3b82f6]/50 transition-colors"
      >
        <span className="text-sm text-[#fbbf24] font-semibold">Solution</span>
        <span className="text-blue-400 text-sm">{open ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {open && (
        <div className="bg-[#0f1d32] border border-t-0 border-[#2a4a7f]/50 rounded-b-xl px-5 pb-5 pt-2 -mt-2">
          <div className="space-y-2 font-mono text-lg">
            {steps.map((step, i) => {
              const hl = highlights[i];
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 text-white"
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
          <div className="mt-3 pt-3 border-t border-[#2a4a7f]/50">
              {closest === target ? (
                <span className="text-green-400 font-semibold">Exact solution found!</span>
              ) : (
                <span className="text-blue-300">
                  Closest achievable: <span className="text-white font-bold">{closest}</span>
                  {' '}({Math.abs(closest - target)} {closest > target ? 'above' : 'below'} <span className="text-[#fbbf24]">{target}</span>)
                </span>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
