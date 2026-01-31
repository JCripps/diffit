/**
 * Range mapping classes for diff results.
 * Ported from VS Code's rangeMapping.
 */
import { LineRange } from './lineRange';
import {
  type Range,
  type Position,
  createRange,
  createPosition,
  rangeFromPositions,
  getStartPosition,
  getEndPosition,
  isBeforeOrEqual,
  plusRange,
} from './types';
import { groupAdjacentBy } from './utils';

/**
 * Maps a line range in the original text to a line range in the modified text.
 */
export class LineRangeMapping {
  public static inverse(
    mapping: readonly LineRangeMapping[],
    originalLineCount: number,
    modifiedLineCount: number
  ): LineRangeMapping[] {
    const result: LineRangeMapping[] = [];
    let lastOriginalEndLineNumber = 1;
    let lastModifiedEndLineNumber = 1;

    for (const m of mapping) {
      const r = new LineRangeMapping(
        new LineRange(lastOriginalEndLineNumber, m.original.startLineNumber),
        new LineRange(lastModifiedEndLineNumber, m.modified.startLineNumber)
      );
      if (!r.modified.isEmpty) {
        result.push(r);
      }
      lastOriginalEndLineNumber = m.original.endLineNumberExclusive;
      lastModifiedEndLineNumber = m.modified.endLineNumberExclusive;
    }
    const r = new LineRangeMapping(
      new LineRange(lastOriginalEndLineNumber, originalLineCount + 1),
      new LineRange(lastModifiedEndLineNumber, modifiedLineCount + 1)
    );
    if (!r.modified.isEmpty) {
      result.push(r);
    }
    return result;
  }

  /**
   * The line range in the original text.
   */
  public readonly original: LineRange;

  /**
   * The line range in the modified text.
   */
  public readonly modified: LineRange;

  constructor(originalRange: LineRange, modifiedRange: LineRange) {
    this.original = originalRange;
    this.modified = modifiedRange;
  }

  public toString(): string {
    return `{${this.original.toString()}->${this.modified.toString()}}`;
  }

  public flip(): LineRangeMapping {
    return new LineRangeMapping(this.modified, this.original);
  }

  public join(other: LineRangeMapping): LineRangeMapping {
    return new LineRangeMapping(this.original.join(other.original), this.modified.join(other.modified));
  }

  public get changedLineCount(): number {
    return Math.max(this.original.length, this.modified.length);
  }

  /**
   * Converts this line range mapping to a range mapping.
   */
  public toRangeMapping2(original: string[], modified: string[]): RangeMapping {
    if (isValidLineNumber(this.original.endLineNumberExclusive, original) && isValidLineNumber(this.modified.endLineNumberExclusive, modified)) {
      return new RangeMapping(
        createRange(this.original.startLineNumber, 1, this.original.endLineNumberExclusive, 1),
        createRange(this.modified.startLineNumber, 1, this.modified.endLineNumberExclusive, 1)
      );
    }

    if (!this.original.isEmpty && !this.modified.isEmpty) {
      return new RangeMapping(
        rangeFromPositions(
          createPosition(this.original.startLineNumber, 1),
          normalizePosition(createPosition(this.original.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), original)
        ),
        rangeFromPositions(
          createPosition(this.modified.startLineNumber, 1),
          normalizePosition(createPosition(this.modified.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), modified)
        )
      );
    }

    if (this.original.startLineNumber > 1 && this.modified.startLineNumber > 1) {
      return new RangeMapping(
        rangeFromPositions(
          normalizePosition(createPosition(this.original.startLineNumber - 1, Number.MAX_SAFE_INTEGER), original),
          normalizePosition(createPosition(this.original.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), original)
        ),
        rangeFromPositions(
          normalizePosition(createPosition(this.modified.startLineNumber - 1, Number.MAX_SAFE_INTEGER), modified),
          normalizePosition(createPosition(this.modified.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), modified)
        )
      );
    }

    throw new Error('Invalid line range mapping');
  }
}

function normalizePosition(position: Position, content: string[]): Position {
  if (position.lineNumber < 1) {
    return createPosition(1, 1);
  }
  if (position.lineNumber > content.length) {
    return createPosition(content.length, content[content.length - 1].length + 1);
  }
  const line = content[position.lineNumber - 1];
  if (position.column > line.length + 1) {
    return createPosition(position.lineNumber, line.length + 1);
  }
  return position;
}

function isValidLineNumber(lineNumber: number, lines: string[]): boolean {
  return lineNumber >= 1 && lineNumber <= lines.length;
}

/**
 * Maps a line range with inner character-level changes.
 */
export class DetailedLineRangeMapping extends LineRangeMapping {
  public static fromRangeMappings(rangeMappings: RangeMapping[]): DetailedLineRangeMapping {
    const originalRange = LineRange.join(rangeMappings.map((r) => LineRange.fromRangeInclusive(r.originalRange)));
    const modifiedRange = LineRange.join(rangeMappings.map((r) => LineRange.fromRangeInclusive(r.modifiedRange)));
    return new DetailedLineRangeMapping(originalRange, modifiedRange, rangeMappings);
  }

  /**
   * Character-level changes within this line range.
   */
  public readonly innerChanges: RangeMapping[] | undefined;

  constructor(originalRange: LineRange, modifiedRange: LineRange, innerChanges: RangeMapping[] | undefined) {
    super(originalRange, modifiedRange);
    this.innerChanges = innerChanges;
  }

  public override flip(): DetailedLineRangeMapping {
    return new DetailedLineRangeMapping(this.modified, this.original, this.innerChanges?.map((c) => c.flip()));
  }
}

/**
 * Maps a range in the original text to a range in the modified text.
 */
export class RangeMapping {
  public static join(rangeMappings: RangeMapping[]): RangeMapping {
    if (rangeMappings.length === 0) {
      throw new Error('Cannot join an empty list of range mappings');
    }
    let result = rangeMappings[0];
    for (let i = 1; i < rangeMappings.length; i++) {
      result = result.join(rangeMappings[i]);
    }
    return result;
  }

  public static assertSorted(rangeMappings: RangeMapping[]): void {
    for (let i = 1; i < rangeMappings.length; i++) {
      const previous = rangeMappings[i - 1];
      const current = rangeMappings[i];
      if (
        !(
          isBeforeOrEqual(getEndPosition(previous.originalRange), getStartPosition(current.originalRange)) &&
          isBeforeOrEqual(getEndPosition(previous.modifiedRange), getStartPosition(current.modifiedRange))
        )
      ) {
        throw new Error('Range mappings must be sorted');
      }
    }
  }

  /**
   * The original range.
   */
  readonly originalRange: Range;

  /**
   * The modified range.
   */
  readonly modifiedRange: Range;

  constructor(originalRange: Range, modifiedRange: Range) {
    this.originalRange = originalRange;
    this.modifiedRange = modifiedRange;
  }

  public toString(): string {
    return `{${rangeToString(this.originalRange)}->${rangeToString(this.modifiedRange)}}`;
  }

  public flip(): RangeMapping {
    return new RangeMapping(this.modifiedRange, this.originalRange);
  }

  public join(other: RangeMapping): RangeMapping {
    return new RangeMapping(plusRange(this.originalRange, other.originalRange), plusRange(this.modifiedRange, other.modifiedRange));
  }
}

function rangeToString(range: Range): string {
  return `[${range.startLineNumber}:${range.startColumn}-${range.endLineNumber}:${range.endColumn}]`;
}

/**
 * Simple text interface for getting line lengths.
 */
export interface ITextModel {
  getLineLength(lineNumber: number): number;
  readonly lineCount: number;
}

/**
 * Simple ArrayText implementation.
 */
export class ArrayText implements ITextModel {
  constructor(private readonly lines: string[]) {}

  getLineLength(lineNumber: number): number {
    return this.lines[lineNumber - 1]?.length ?? 0;
  }

  get lineCount(): number {
    return this.lines.length;
  }

  get length(): { lineCount: number } {
    return { lineCount: this.lines.length };
  }

  getValueOfRange(range: Range): string {
    if (range.startLineNumber === range.endLineNumber) {
      return this.lines[range.startLineNumber - 1].substring(range.startColumn - 1, range.endColumn - 1);
    }
    const lines: string[] = [];
    lines.push(this.lines[range.startLineNumber - 1].substring(range.startColumn - 1));
    for (let i = range.startLineNumber + 1; i < range.endLineNumber; i++) {
      lines.push(this.lines[i - 1]);
    }
    lines.push(this.lines[range.endLineNumber - 1].substring(0, range.endColumn - 1));
    return lines.join('\n');
  }
}

/**
 * Creates DetailedLineRangeMapping from RangeMappings.
 */
export function lineRangeMappingFromRangeMappings(
  alignments: readonly RangeMapping[],
  originalLines: ArrayText,
  modifiedLines: ArrayText,
  dontAssertStartLine: boolean = false
): DetailedLineRangeMapping[] {
  const changes: DetailedLineRangeMapping[] = [];
  for (const g of groupAdjacentBy(
    alignments.map((a) => getLineRangeMapping(a, originalLines, modifiedLines)),
    (a1, a2) => a1.original.intersectsOrTouches(a2.original) || a1.modified.intersectsOrTouches(a2.modified)
  )) {
    const first = g[0];
    const last = g[g.length - 1];

    changes.push(
      new DetailedLineRangeMapping(
        first.original.join(last.original),
        first.modified.join(last.modified),
        g.map((a) => a.innerChanges![0])
      )
    );
  }

  return changes;
}

function getLineRangeMapping(
  rangeMapping: RangeMapping,
  originalLines: ArrayText,
  modifiedLines: ArrayText
): DetailedLineRangeMapping {
  let lineStartDelta = 0;
  let lineEndDelta = 0;

  if (
    rangeMapping.modifiedRange.endColumn === 1 &&
    rangeMapping.originalRange.endColumn === 1 &&
    rangeMapping.originalRange.startLineNumber + lineStartDelta <= rangeMapping.originalRange.endLineNumber &&
    rangeMapping.modifiedRange.startLineNumber + lineStartDelta <= rangeMapping.modifiedRange.endLineNumber
  ) {
    lineEndDelta = -1;
  }

  if (
    rangeMapping.modifiedRange.startColumn - 1 >= modifiedLines.getLineLength(rangeMapping.modifiedRange.startLineNumber) &&
    rangeMapping.originalRange.startColumn - 1 >= originalLines.getLineLength(rangeMapping.originalRange.startLineNumber) &&
    rangeMapping.originalRange.startLineNumber <= rangeMapping.originalRange.endLineNumber + lineEndDelta &&
    rangeMapping.modifiedRange.startLineNumber <= rangeMapping.modifiedRange.endLineNumber + lineEndDelta
  ) {
    lineStartDelta = 1;
  }

  const originalLineRange = new LineRange(
    rangeMapping.originalRange.startLineNumber + lineStartDelta,
    rangeMapping.originalRange.endLineNumber + 1 + lineEndDelta
  );
  const modifiedLineRange = new LineRange(
    rangeMapping.modifiedRange.startLineNumber + lineStartDelta,
    rangeMapping.modifiedRange.endLineNumber + 1 + lineEndDelta
  );

  return new DetailedLineRangeMapping(originalLineRange, modifiedLineRange, [rangeMapping]);
}
