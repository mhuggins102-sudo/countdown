import type { SolutionStep } from '../types/game';

interface SolverResult {
  value: number;
  steps: SolutionStep[];
  distance: number;
}

type Op = '+' | '-' | '*' | '/';

function applyOp(a: number, op: Op, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b > 0 ? a - b : null;
    case '*': return a * b;
    case '/': return b !== 0 && a % b === 0 ? a / b : null;
  }
}

export function solve(numbers: number[], target: number): SolverResult {
  let best: SolverResult = { value: numbers[0], steps: [], distance: Math.abs(numbers[0] - target) };

  // Check if target is already in the numbers
  for (const n of numbers) {
    const dist = Math.abs(n - target);
    if (dist < best.distance) {
      best = { value: n, steps: [], distance: dist };
    }
    if (dist === 0) return best;
  }

  function search(available: number[], steps: SolutionStep[]): boolean {
    if (available.length < 2) return false;

    for (let i = 0; i < available.length; i++) {
      for (let j = 0; j < available.length; j++) {
        if (i === j) continue;

        const a = available[i];
        const b = available[j];
        const ops: Op[] = ['+', '-', '*', '/'];

        for (const op of ops) {
          // Prune commutative duplicates: for + and *, only try a >= b
          if ((op === '+' || op === '*') && a < b) continue;
          // Skip trivial operations
          if (op === '*' && (a === 1 || b === 1)) continue;
          if (op === '+' && b === 0) continue;

          const result = applyOp(a, op, b);
          if (result === null || result <= 0) continue;

          const newSteps: SolutionStep[] = [...steps, { a, op, b, result }];
          const dist = Math.abs(result - target);

          if (dist < best.distance) {
            best = { value: result, steps: newSteps, distance: dist };
            if (dist === 0) return true; // Exact match found
          }

          // Build new available numbers (remove i and j, add result)
          const newAvailable: number[] = [];
          for (let k = 0; k < available.length; k++) {
            if (k !== i && k !== j) newAvailable.push(available[k]);
          }
          newAvailable.push(result);

          if (search(newAvailable, newSteps)) return true;
        }
      }
    }

    return false;
  }

  search(numbers, []);
  return best;
}

/**
 * Remove steps whose results are never used in the chain leading to the final answer.
 * Works backwards from the last step, tracking which values are needed as inputs.
 */
function pruneUnusedSteps(steps: SolutionStep[]): SolutionStep[] {
  if (steps.length === 0) return steps;

  const needed = new Array(steps.length).fill(false);
  needed[steps.length - 1] = true;

  // Track how many of each value we still need to find a source for
  const valueCounts = new Map<number, number>();
  const addNeeded = (val: number) => valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
  const consumeNeeded = (val: number): boolean => {
    const count = valueCounts.get(val) || 0;
    if (count > 0) { valueCounts.set(val, count - 1); return true; }
    return false;
  };

  // Seed with inputs of the final step
  addNeeded(steps[steps.length - 1].a);
  addNeeded(steps[steps.length - 1].b);

  // Walk backwards — if a step's result is needed, mark it and require its inputs
  for (let i = steps.length - 2; i >= 0; i--) {
    if (consumeNeeded(steps[i].result)) {
      needed[i] = true;
      addNeeded(steps[i].a);
      addNeeded(steps[i].b);
    }
  }

  return steps.filter((_, i) => needed[i]);
}

export function solveNumbers(numbers: number[], target: number): { closest: number; steps: SolutionStep[] } {
  const result = solve(numbers, target);
  return { closest: result.value, steps: pruneUnusedSteps(result.steps) };
}
