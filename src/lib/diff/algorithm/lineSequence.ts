/**
 * Line sequence for diff comparison.
 * Ported from VS Code's LineSequence class.
 */
import { OffsetRange } from './offsetRange';
import type { ISequence } from './diffAlgorithm';
import { CharCode } from './utils';

/**
 * A sequence of lines that can be compared using the diff algorithm.
 */
export class LineSequence implements ISequence {
  constructor(
    private readonly trimmedHash: number[],
    private readonly lines: string[]
  ) {}

  getElement(offset: number): number {
    return this.trimmedHash[offset];
  }

  get length(): number {
    return this.trimmedHash.length;
  }

  getBoundaryScore(length: number): number {
    const indentationBefore = length === 0 ? 0 : getIndentation(this.lines[length - 1]);
    const indentationAfter = length === this.lines.length ? 0 : getIndentation(this.lines[length]);
    return 1000 - (indentationBefore + indentationAfter);
  }

  getText(range: OffsetRange): string {
    return this.lines.slice(range.start, range.endExclusive).join('\n');
  }

  isStronglyEqual(offset1: number, offset2: number): boolean {
    return this.lines[offset1] === this.lines[offset2];
  }
}

/**
 * Gets the indentation level (number of leading whitespace characters) of a string.
 */
function getIndentation(str: string): number {
  let i = 0;
  while (i < str.length && (str.charCodeAt(i) === CharCode.Space || str.charCodeAt(i) === CharCode.Tab)) {
    i++;
  }
  return i;
}
