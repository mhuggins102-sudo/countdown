import { describe, it, expect } from 'vitest';
import { scoreNumbersRound } from '../../src/engine/scoring';

describe('scoreNumbersRound', () => {
  it('should give 10 points for exact match', () => {
    const result = scoreNumbersRound(500, 480, 500);
    expect(result.playerScore).toBe(10);
    expect(result.aiScore).toBe(0);
  });

  it('should give 7 points for within 5', () => {
    const result = scoreNumbersRound(503, 520, 500);
    expect(result.playerScore).toBe(7);
    expect(result.aiScore).toBe(0);
  });

  it('should give 5 points for within 10', () => {
    const result = scoreNumbersRound(508, 520, 500);
    expect(result.playerScore).toBe(5);
    expect(result.aiScore).toBe(0);
  });

  it('should give 0 points if both are more than 10 away', () => {
    const result = scoreNumbersRound(520, 480, 500);
    expect(result.playerScore).toBe(0);
    expect(result.aiScore).toBe(0);
  });

  it('should give both players points if equidistant', () => {
    const result = scoreNumbersRound(503, 497, 500);
    expect(result.playerScore).toBe(7);
    expect(result.aiScore).toBe(7);
  });

  it('should only score the closer player', () => {
    const result = scoreNumbersRound(502, 505, 500);
    expect(result.playerScore).toBe(7);
    expect(result.aiScore).toBe(0);
  });

  it('should handle null player answer', () => {
    const result = scoreNumbersRound(null, 500, 500);
    expect(result.playerScore).toBe(0);
    expect(result.aiScore).toBe(10);
  });
});
