/**
 * Character-level sequence for inner changes.
 * Ported from VS Code's LinesSliceCharSequence.
 */
import { OffsetRange } from './offsetRange';
import type { ISequence } from './diffAlgorithm';
import type { Range, Position } from './types';
import { createPosition, createRange, rangeFromPositions, isBefore } from './types';
import { CharCode, isSpace, findLastIdxMonotonous, findLastMonotonous, findFirstMonotonous } from './utils';

/**
 * Character boundary categories for scoring diff positions.
 */
const enum CharBoundaryCategory {
  WordLower,
  WordUpper,
  WordNumber,
  End,
  Other,
  Separator,
  Space,
  LineBreakCR,
  LineBreakLF,
}

const categoryScore: Record<CharBoundaryCategory, number> = {
  [CharBoundaryCategory.WordLower]: 0,
  [CharBoundaryCategory.WordUpper]: 0,
  [CharBoundaryCategory.WordNumber]: 0,
  [CharBoundaryCategory.End]: 10,
  [CharBoundaryCategory.Other]: 2,
  [CharBoundaryCategory.Separator]: 30,
  [CharBoundaryCategory.Space]: 3,
  [CharBoundaryCategory.LineBreakCR]: 10,
  [CharBoundaryCategory.LineBreakLF]: 10,
};

function getCategoryBoundaryScore(category: CharBoundaryCategory): number {
  return categoryScore[category];
}

function getCategory(charCode: number): CharBoundaryCategory {
  if (charCode === CharCode.LineFeed) {
    return CharBoundaryCategory.LineBreakLF;
  } else if (charCode === CharCode.CarriageReturn) {
    return CharBoundaryCategory.LineBreakCR;
  } else if (isSpace(charCode)) {
    return CharBoundaryCategory.Space;
  } else if (charCode >= CharCode.a && charCode <= CharCode.z) {
    return CharBoundaryCategory.WordLower;
  } else if (charCode >= CharCode.A && charCode <= CharCode.Z) {
    return CharBoundaryCategory.WordUpper;
  } else if (charCode >= CharCode.Digit0 && charCode <= CharCode.Digit9) {
    return CharBoundaryCategory.WordNumber;
  } else if (charCode === -1) {
    return CharBoundaryCategory.End;
  } else if (charCode === CharCode.Comma || charCode === CharCode.Semicolon) {
    return CharBoundaryCategory.Separator;
  } else {
    return CharBoundaryCategory.Other;
  }
}

function isWordChar(charCode: number): boolean {
  return (
    (charCode >= CharCode.a && charCode <= CharCode.z) ||
    (charCode >= CharCode.A && charCode <= CharCode.Z) ||
    (charCode >= CharCode.Digit0 && charCode <= CharCode.Digit9)
  );
}

function isUpperCase(charCode: number): boolean {
  return charCode >= CharCode.A && charCode <= CharCode.Z;
}

/**
 * A sequence of characters from a range of lines.
 * Used for character-level diff computation within a line range.
 */
export class LinesSliceCharSequence implements ISequence {
  private readonly elements: number[] = [];
  private readonly firstElementOffsetByLineIdx: number[] = [];
  private readonly lineStartOffsets: number[] = [];
  private readonly trimmedWsLengthsByLineIdx: number[] = [];

  constructor(
    public readonly lines: string[],
    private readonly range: Range,
    public readonly considerWhitespaceChanges: boolean
  ) {
    this.firstElementOffsetByLineIdx.push(0);
    for (let lineNumber = this.range.startLineNumber; lineNumber <= this.range.endLineNumber; lineNumber++) {
      let line = lines[lineNumber - 1];
      let lineStartOffset = 0;
      if (lineNumber === this.range.startLineNumber && this.range.startColumn > 1) {
        lineStartOffset = this.range.startColumn - 1;
        line = line.substring(lineStartOffset);
      }
      this.lineStartOffsets.push(lineStartOffset);

      let trimmedWsLength = 0;
      if (!considerWhitespaceChanges) {
        const trimmedStartLine = line.trimStart();
        trimmedWsLength = line.length - trimmedStartLine.length;
        line = trimmedStartLine.trimEnd();
      }
      this.trimmedWsLengthsByLineIdx.push(trimmedWsLength);

      const lineLength =
        lineNumber === this.range.endLineNumber
          ? Math.min(this.range.endColumn - 1 - lineStartOffset - trimmedWsLength, line.length)
          : line.length;
      for (let i = 0; i < lineLength; i++) {
        this.elements.push(line.charCodeAt(i));
      }

      if (lineNumber < this.range.endLineNumber) {
        this.elements.push('\n'.charCodeAt(0));
        this.firstElementOffsetByLineIdx.push(this.elements.length);
      }
    }
  }

  toString(): string {
    return `Slice: "${this.text}"`;
  }

  get text(): string {
    return this.getText(new OffsetRange(0, this.length));
  }

  getText(range: OffsetRange): string {
    return this.elements
      .slice(range.start, range.endExclusive)
      .map((e) => String.fromCharCode(e))
      .join('');
  }

  getElement(offset: number): number {
    return this.elements[offset];
  }

  get length(): number {
    return this.elements.length;
  }

  public getBoundaryScore(length: number): number {
    const prevCategory = getCategory(length > 0 ? this.elements[length - 1] : -1);
    const nextCategory = getCategory(length < this.elements.length ? this.elements[length] : -1);

    if (prevCategory === CharBoundaryCategory.LineBreakCR && nextCategory === CharBoundaryCategory.LineBreakLF) {
      // don't break between \r and \n
      return 0;
    }
    if (prevCategory === CharBoundaryCategory.LineBreakLF) {
      // prefer the linebreak before the change
      return 150;
    }

    let score = 0;
    if (prevCategory !== nextCategory) {
      score += 10;
      if (prevCategory === CharBoundaryCategory.WordLower && nextCategory === CharBoundaryCategory.WordUpper) {
        score += 1;
      }
    }

    score += getCategoryBoundaryScore(prevCategory);
    score += getCategoryBoundaryScore(nextCategory);

    return score;
  }

  public translateOffset(offset: number, preference: 'left' | 'right' = 'right'): Position {
    const i = findLastIdxMonotonous(this.firstElementOffsetByLineIdx, (value) => value <= offset);
    const lineOffset = offset - this.firstElementOffsetByLineIdx[i];
    return createPosition(
      this.range.startLineNumber + i,
      1 +
        this.lineStartOffsets[i] +
        lineOffset +
        (lineOffset === 0 && preference === 'left' ? 0 : this.trimmedWsLengthsByLineIdx[i])
    );
  }

  public translateRange(range: OffsetRange): Range {
    const pos1 = this.translateOffset(range.start, 'right');
    const pos2 = this.translateOffset(range.endExclusive, 'left');
    if (isBefore(pos2, pos1)) {
      return rangeFromPositions(pos2, pos2);
    }
    return rangeFromPositions(pos1, pos2);
  }

  /**
   * Finds the word that contains the character at the given offset.
   */
  public findWordContaining(offset: number): OffsetRange | undefined {
    if (offset < 0 || offset >= this.elements.length) {
      return undefined;
    }

    if (!isWordChar(this.elements[offset])) {
      return undefined;
    }

    // find start
    let start = offset;
    while (start > 0 && isWordChar(this.elements[start - 1])) {
      start--;
    }

    // find end
    let end = offset;
    while (end < this.elements.length && isWordChar(this.elements[end])) {
      end++;
    }

    return new OffsetRange(start, end);
  }

  /**
   * Finds the sub-word that contains the character at the given offset.
   * For example, "fooBar" has sub-words "foo" and "Bar".
   */
  public findSubWordContaining(offset: number): OffsetRange | undefined {
    if (offset < 0 || offset >= this.elements.length) {
      return undefined;
    }

    if (!isWordChar(this.elements[offset])) {
      return undefined;
    }

    // find start
    let start = offset;
    while (start > 0 && isWordChar(this.elements[start - 1]) && !isUpperCase(this.elements[start])) {
      start--;
    }

    // find end
    let end = offset;
    while (end < this.elements.length && isWordChar(this.elements[end]) && !isUpperCase(this.elements[end])) {
      end++;
    }

    return new OffsetRange(start, end);
  }

  public countLinesIn(range: OffsetRange): number {
    return this.translateOffset(range.endExclusive).lineNumber - this.translateOffset(range.start).lineNumber;
  }

  public isStronglyEqual(offset1: number, offset2: number): boolean {
    return this.elements[offset1] === this.elements[offset2];
  }

  public extendToFullLines(range: OffsetRange): OffsetRange {
    const start = findLastMonotonous(this.firstElementOffsetByLineIdx, (x) => x <= range.start) ?? 0;
    const end = findFirstMonotonous(this.firstElementOffsetByLineIdx, (x) => range.endExclusive <= x) ?? this.elements.length;
    return new OffsetRange(start, end);
  }
}
