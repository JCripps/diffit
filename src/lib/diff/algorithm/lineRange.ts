/**
 * A range of lines (1-based).
 * Ported from VS Code's LineRange class.
 */
import { OffsetRange } from './offsetRange';
import { createRange, type Range } from './types';

export class LineRange {
  public static ofLength(startLineNumber: number, length: number): LineRange {
    return new LineRange(startLineNumber, startLineNumber + length);
  }

  public static fromRange(range: Range): LineRange {
    return new LineRange(range.startLineNumber, range.endLineNumber);
  }

  public static fromRangeInclusive(range: Range): LineRange {
    return new LineRange(range.startLineNumber, range.endLineNumber + 1);
  }

  public static join(lineRanges: LineRange[]): LineRange {
    if (lineRanges.length === 0) {
      throw new Error('lineRanges cannot be empty');
    }
    let startLineNumber = lineRanges[0].startLineNumber;
    let endLineNumberExclusive = lineRanges[0].endLineNumberExclusive;
    for (let i = 1; i < lineRanges.length; i++) {
      startLineNumber = Math.min(startLineNumber, lineRanges[i].startLineNumber);
      endLineNumberExclusive = Math.max(endLineNumberExclusive, lineRanges[i].endLineNumberExclusive);
    }
    return new LineRange(startLineNumber, endLineNumberExclusive);
  }

  /**
   * The start line number (1-based, inclusive).
   */
  public readonly startLineNumber: number;

  /**
   * The end line number (1-based, exclusive).
   */
  public readonly endLineNumberExclusive: number;

  constructor(startLineNumber: number, endLineNumberExclusive: number) {
    if (startLineNumber > endLineNumberExclusive) {
      throw new Error(
        `startLineNumber ${startLineNumber} cannot be after endLineNumberExclusive ${endLineNumberExclusive}`
      );
    }
    this.startLineNumber = startLineNumber;
    this.endLineNumberExclusive = endLineNumberExclusive;
  }

  /**
   * Indicates if this line range contains the given line number.
   */
  public contains(lineNumber: number): boolean {
    return this.startLineNumber <= lineNumber && lineNumber < this.endLineNumberExclusive;
  }

  public containsRange(range: LineRange): boolean {
    return (
      this.startLineNumber <= range.startLineNumber &&
      range.endLineNumberExclusive <= this.endLineNumberExclusive
    );
  }

  /**
   * Indicates if this line range is empty.
   */
  get isEmpty(): boolean {
    return this.startLineNumber === this.endLineNumberExclusive;
  }

  /**
   * Moves this line range by the given offset of line numbers.
   */
  public delta(offset: number): LineRange {
    return new LineRange(this.startLineNumber + offset, this.endLineNumberExclusive + offset);
  }

  public deltaLength(offset: number): LineRange {
    return new LineRange(this.startLineNumber, this.endLineNumberExclusive + offset);
  }

  /**
   * The number of lines this line range spans.
   */
  public get length(): number {
    return this.endLineNumberExclusive - this.startLineNumber;
  }

  /**
   * Creates a line range that combines this and the given line range.
   */
  public join(other: LineRange): LineRange {
    return new LineRange(
      Math.min(this.startLineNumber, other.startLineNumber),
      Math.max(this.endLineNumberExclusive, other.endLineNumberExclusive)
    );
  }

  public toString(): string {
    return `[${this.startLineNumber},${this.endLineNumberExclusive})`;
  }

  /**
   * Returns the intersection of this and the other range, or undefined if they don't intersect.
   */
  public intersect(other: LineRange): LineRange | undefined {
    const startLineNumber = Math.max(this.startLineNumber, other.startLineNumber);
    const endLineNumberExclusive = Math.min(this.endLineNumberExclusive, other.endLineNumberExclusive);
    if (startLineNumber <= endLineNumberExclusive) {
      return new LineRange(startLineNumber, endLineNumberExclusive);
    }
    return undefined;
  }

  public intersectsStrict(other: LineRange): boolean {
    return (
      this.startLineNumber < other.endLineNumberExclusive &&
      other.startLineNumber < this.endLineNumberExclusive
    );
  }

  public intersectsOrTouches(other: LineRange): boolean {
    return (
      this.startLineNumber <= other.endLineNumberExclusive &&
      other.startLineNumber <= this.endLineNumberExclusive
    );
  }

  public equals(b: LineRange): boolean {
    return (
      this.startLineNumber === b.startLineNumber &&
      this.endLineNumberExclusive === b.endLineNumberExclusive
    );
  }

  public toInclusiveRange(): Range | null {
    if (this.isEmpty) {
      return null;
    }
    return createRange(this.startLineNumber, 1, this.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER);
  }

  public toExclusiveRange(): Range {
    return createRange(this.startLineNumber, 1, this.endLineNumberExclusive, 1);
  }

  public mapToLineArray<T>(f: (lineNumber: number) => T): T[] {
    const result: T[] = [];
    for (let lineNumber = this.startLineNumber; lineNumber < this.endLineNumberExclusive; lineNumber++) {
      result.push(f(lineNumber));
    }
    return result;
  }

  public forEach(f: (lineNumber: number) => void): void {
    for (let lineNumber = this.startLineNumber; lineNumber < this.endLineNumberExclusive; lineNumber++) {
      f(lineNumber);
    }
  }

  /**
   * Converts this 1-based line range to a 0-based offset range (subtracts 1!).
   */
  public toOffsetRange(): OffsetRange {
    return new OffsetRange(this.startLineNumber - 1, this.endLineNumberExclusive - 1);
  }

  public distanceToRange(other: LineRange): number {
    if (this.endLineNumberExclusive <= other.startLineNumber) {
      return other.startLineNumber - this.endLineNumberExclusive;
    }
    if (other.endLineNumberExclusive <= this.startLineNumber) {
      return this.startLineNumber - other.endLineNumberExclusive;
    }
    return 0;
  }
}
