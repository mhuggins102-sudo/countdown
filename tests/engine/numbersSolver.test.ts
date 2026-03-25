import { describe, it, expect } from 'vitest';
import { solveNumbers } from '../../src/engine/numbersSolver';

describe('numbersSolver', () => {
  it('should find exact solution for simple case', () => {
    const result = solveNumbers([100, 5, 3], 103);
    expect(result.closest).toBe(103);
  });

  it('should find exact solution with multiplication', () => {
    const result = solveNumbers([25, 4], 100);
    expect(result.closest).toBe(100);
  });

  it('should return the target if it exists in the numbers', () => {
    const result = solveNumbers([100, 50, 75, 25, 3, 6], 100);
    expect(result.closest).toBe(100);
  });

  it('should find closest when exact is impossible', () => {
    // With only [1], target 500 - best is 1
    const result = solveNumbers([1], 500);
    expect(result.closest).toBe(1);
  });

  it('should handle a classic Countdown puzzle', () => {
    // 75 + 50 + 100 + 25 + 6 - 3 = 253? Let's see.
    const result = solveNumbers([75, 50, 100, 25, 6, 3], 253);
    // The solver should get very close or exact
    expect(Math.abs(result.closest - 253)).toBeLessThanOrEqual(10);
  });

  it('should handle six small numbers', () => {
    const result = solveNumbers([1, 2, 3, 4, 5, 6], 120);
    // 5 * 4 * 6 = 120
    expect(result.closest).toBe(120);
  });

  it('should produce valid steps', () => {
    const result = solveNumbers([25, 4, 2], 100);
    expect(result.closest).toBe(100);
    // Verify each step uses valid operations
    for (const step of result.steps) {
      expect(['+', '-', '*', '/']).toContain(step.op);
      switch (step.op) {
        case '+': expect(step.result).toBe(step.a + step.b); break;
        case '-': expect(step.result).toBe(step.a - step.b); break;
        case '*': expect(step.result).toBe(step.a * step.b); break;
        case '/': expect(step.result).toBe(step.a / step.b); break;
      }
      expect(step.result).toBeGreaterThan(0);
      expect(Number.isInteger(step.result)).toBe(true);
    }
  });
});
