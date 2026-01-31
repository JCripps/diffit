/**
 * VS Code Diff Algorithm - Public API
 *
 * This module provides a sophisticated diff implementation ported from VS Code,
 * featuring:
 * - Myers O(ND) algorithm for large files
 * - Dynamic Programming algorithm for small files (< 1700 total lines)
 * - Character-level diff refinement within changed regions
 * - Heuristic optimizations for better diff quality
 */

// Core types
export type { DiffOptions, Range, Position } from './types';
export { defaultDiffOptions, createRange, createPosition, rangeFromPositions } from './types';

// Range classes
export { OffsetRange } from './offsetRange';
export { LineRange } from './lineRange';

// Diff algorithm interfaces
export type { ISequence, ITimeout, IDiffAlgorithm } from './diffAlgorithm';
export { SequenceDiff, OffsetPair, DiffAlgorithmResult, InfiniteTimeout, DateTimeout } from './diffAlgorithm';

// Algorithm implementations
export { MyersDiffAlgorithm } from './myers';
export { DynamicProgrammingDiffing } from './dynamicProgramming';

// Sequence implementations
export { LineSequence } from './lineSequence';
export { LinesSliceCharSequence } from './charSequence';

// Range mappings
export { LineRangeMapping, DetailedLineRangeMapping, RangeMapping, ArrayText } from './rangeMapping';

// Main diff computer
export { DefaultLinesDiffComputer } from './diffComputer';
export type { LinesDiff } from './diffComputer';

// Convenience function for computing diffs
import { DefaultLinesDiffComputer, type LinesDiff } from './diffComputer';
import { defaultDiffOptions, type DiffOptions } from './types';

const defaultComputer = new DefaultLinesDiffComputer();

/**
 * Computes the diff between two texts.
 *
 * @param originalText - The original text
 * @param modifiedText - The modified text
 * @param options - Optional diff options
 * @returns The diff result with line-level and character-level changes
 *
 * @example
 * ```typescript
 * const result = computeDiff(
 *   'const foo = 1;',
 *   'const bar = 1;'
 * );
 * // result.changes contains the differences
 * ```
 */
export function computeDiff(
  originalText: string,
  modifiedText: string,
  options: Partial<DiffOptions> = {}
): LinesDiff {
  const originalLines = originalText.split(/\r\n|\r|\n/);
  const modifiedLines = modifiedText.split(/\r\n|\r|\n/);

  const fullOptions: DiffOptions = {
    ...defaultDiffOptions,
    ...options,
  };

  return defaultComputer.computeDiff(originalLines, modifiedLines, fullOptions);
}

/**
 * Computes the diff between two arrays of lines.
 *
 * @param originalLines - The original lines
 * @param modifiedLines - The modified lines
 * @param options - Optional diff options
 * @returns The diff result with line-level and character-level changes
 */
export function computeDiffLines(
  originalLines: string[],
  modifiedLines: string[],
  options: Partial<DiffOptions> = {}
): LinesDiff {
  const fullOptions: DiffOptions = {
    ...defaultDiffOptions,
    ...options,
  };

  return defaultComputer.computeDiff(originalLines, modifiedLines, fullOptions);
}
