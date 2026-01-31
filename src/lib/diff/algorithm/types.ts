/**
 * Core types for the diff algorithm.
 * Ported from VS Code's diff implementation.
 */

/**
 * Position in a text document (1-based line numbers, 1-based columns)
 */
export interface Position {
  readonly lineNumber: number;
  readonly column: number;
}

/**
 * Creates a new Position
 */
export function createPosition(lineNumber: number, column: number): Position {
  return { lineNumber, column };
}

/**
 * Checks if position a is before position b
 */
export function isBefore(a: Position, b: Position): boolean {
  if (a.lineNumber < b.lineNumber) {
    return true;
  }
  if (b.lineNumber < a.lineNumber) {
    return false;
  }
  return a.column < b.column;
}

/**
 * Checks if position a is before or equal to position b
 */
export function isBeforeOrEqual(a: Position, b: Position): boolean {
  if (a.lineNumber < b.lineNumber) {
    return true;
  }
  if (b.lineNumber < a.lineNumber) {
    return false;
  }
  return a.column <= b.column;
}

/**
 * Range in a text document (1-based line numbers, 1-based columns)
 */
export interface Range {
  readonly startLineNumber: number;
  readonly startColumn: number;
  readonly endLineNumber: number;
  readonly endColumn: number;
}

/**
 * Creates a new Range
 */
export function createRange(
  startLineNumber: number,
  startColumn: number,
  endLineNumber: number,
  endColumn: number
): Range {
  return { startLineNumber, startColumn, endLineNumber, endColumn };
}

/**
 * Creates a Range from two Positions
 */
export function rangeFromPositions(start: Position, end: Position): Range {
  return {
    startLineNumber: start.lineNumber,
    startColumn: start.column,
    endLineNumber: end.lineNumber,
    endColumn: end.column,
  };
}

/**
 * Gets the start position of a range
 */
export function getStartPosition(range: Range): Position {
  return { lineNumber: range.startLineNumber, column: range.startColumn };
}

/**
 * Gets the end position of a range
 */
export function getEndPosition(range: Range): Position {
  return { lineNumber: range.endLineNumber, column: range.endColumn };
}

/**
 * Combines two ranges into one that spans both
 */
export function plusRange(a: Range, b: Range): Range {
  let startLineNumber: number;
  let startColumn: number;
  let endLineNumber: number;
  let endColumn: number;

  if (b.startLineNumber < a.startLineNumber) {
    startLineNumber = b.startLineNumber;
    startColumn = b.startColumn;
  } else if (b.startLineNumber === a.startLineNumber) {
    startLineNumber = b.startLineNumber;
    startColumn = Math.min(b.startColumn, a.startColumn);
  } else {
    startLineNumber = a.startLineNumber;
    startColumn = a.startColumn;
  }

  if (b.endLineNumber > a.endLineNumber) {
    endLineNumber = b.endLineNumber;
    endColumn = b.endColumn;
  } else if (b.endLineNumber === a.endLineNumber) {
    endLineNumber = b.endLineNumber;
    endColumn = Math.max(b.endColumn, a.endColumn);
  } else {
    endLineNumber = a.endLineNumber;
    endColumn = a.endColumn;
  }

  return { startLineNumber, startColumn, endLineNumber, endColumn };
}

/**
 * Options for diff computation
 */
export interface DiffOptions {
  /**
   * When true, trims whitespace when comparing lines
   */
  ignoreTrimWhitespace: boolean;

  /**
   * Maximum time in milliseconds for diff computation (0 = infinite)
   */
  maxComputationTimeMs: number;

  /**
   * Whether to compute moved regions
   */
  computeMoves: boolean;

  /**
   * Whether to extend diffs to subword boundaries
   */
  extendToSubwords: boolean;
}

/**
 * Default diff options
 */
export const defaultDiffOptions: DiffOptions = {
  ignoreTrimWhitespace: true,
  maxComputationTimeMs: 1000,
  computeMoves: false,
  extendToSubwords: true,
};
