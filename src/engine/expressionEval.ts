import type { SolutionStep } from '../types/game';

export type ExprItem =
  | { type: 'number'; value: number; tileIndex: number }
  | { type: 'op'; value: '+' | '-' | '*' | '/' }
  | { type: 'paren'; value: '(' | ')' };

interface EvalResult {
  value: number;
  steps: SolutionStep[];
}

// Shunting-yard algorithm to convert infix expression to RPN
function toRPN(items: ExprItem[]): ExprItem[] | null {
  const output: ExprItem[] = [];
  const opStack: ExprItem[] = [];

  const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

  for (const item of items) {
    if (item.type === 'number') {
      output.push(item);
    } else if (item.type === 'op') {
      while (
        opStack.length > 0 &&
        opStack[opStack.length - 1].type === 'op' &&
        precedence[(opStack[opStack.length - 1] as { type: 'op'; value: string }).value] >= precedence[item.value]
      ) {
        output.push(opStack.pop()!);
      }
      opStack.push(item);
    } else if (item.type === 'paren' && item.value === '(') {
      opStack.push(item);
    } else if (item.type === 'paren' && item.value === ')') {
      while (opStack.length > 0 && !(opStack[opStack.length - 1].type === 'paren')) {
        output.push(opStack.pop()!);
      }
      if (opStack.length === 0) return null; // Mismatched parens
      opStack.pop(); // Remove the '('
    }
  }

  while (opStack.length > 0) {
    const top = opStack.pop()!;
    if (top.type === 'paren') return null; // Mismatched parens
    output.push(top);
  }

  return output;
}

function applyOp(a: number, op: string, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '-': {
      const result = a - b;
      return result > 0 ? result : null; // Must be positive
    }
    case '*': return a * b;
    case '/': return b !== 0 && a % b === 0 ? a / b : null;
    default: return null;
  }
}

// Evaluate RPN and produce solution steps
function evalRPN(rpn: ExprItem[]): EvalResult | null {
  const stack: number[] = [];
  const steps: SolutionStep[] = [];

  for (const item of rpn) {
    if (item.type === 'number') {
      stack.push(item.value);
    } else if (item.type === 'op') {
      if (stack.length < 2) return null;
      const b = stack.pop()!;
      const a = stack.pop()!;
      const result = applyOp(a, item.value, b);
      if (result === null) return null;
      stack.push(result);
      steps.push({ a, op: item.value as '+' | '-' | '*' | '/', b, result });
    }
  }

  if (stack.length !== 1) return null;
  return { value: stack[0], steps };
}

export function evaluateExpression(items: ExprItem[]): EvalResult | null {
  if (items.length === 0) return null;

  // Single number — no steps needed
  if (items.length === 1 && items[0].type === 'number') {
    return { value: items[0].value, steps: [] };
  }

  const rpn = toRPN(items);
  if (!rpn) return null;

  return evalRPN(rpn);
}

// Check if the expression has balanced parentheses and valid structure
export function isExpressionComplete(items: ExprItem[]): boolean {
  if (items.length === 0) return false;

  // Check balanced parens
  let depth = 0;
  for (const item of items) {
    if (item.type === 'paren' && item.value === '(') depth++;
    if (item.type === 'paren' && item.value === ')') depth--;
    if (depth < 0) return false;
  }
  if (depth !== 0) return false;

  // Must end with a number or )
  const last = items[items.length - 1];
  if (last.type === 'op') return false;
  if (last.type === 'paren' && last.value === '(') return false;

  // Must have at least one operator
  return items.some((item) => item.type === 'op');
}

// Get which original puzzle numbers are used in each step of a solution
export function getOriginalHighlights(
  steps: SolutionStep[],
  originalNumbers: number[],
): { aIsOriginal: boolean; bIsOriginal: boolean }[] {
  const remaining = [...originalNumbers];

  return steps.map((step) => {
    let aIsOriginal = false;
    let bIsOriginal = false;

    const aIdx = remaining.indexOf(step.a);
    if (aIdx !== -1) {
      aIsOriginal = true;
      remaining.splice(aIdx, 1);
    }

    const bIdx = remaining.indexOf(step.b);
    if (bIdx !== -1) {
      bIsOriginal = true;
      remaining.splice(bIdx, 1);
    }

    return { aIsOriginal, bIsOriginal };
  });
}

export function displayOp(op: string): string {
  if (op === '*') return '\u00d7';
  if (op === '/') return '\u00f7';
  return op;
}
