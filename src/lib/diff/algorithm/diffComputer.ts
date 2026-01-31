/**
 * Main diff computer that orchestrates the diff algorithm.
 * Ported from VS Code's DefaultLinesDiffComputer.
 */
import { OffsetRange } from './offsetRange';
import { LineRange } from './lineRange';
import { DateTimeout, InfiniteTimeout, type ITimeout, SequenceDiff } from './diffAlgorithm';
import { MyersDiffAlgorithm } from './myers';
import { DynamicProgrammingDiffing } from './dynamicProgramming';
import { LineSequence } from './lineSequence';
import { LinesSliceCharSequence } from './charSequence';
import {
  optimizeSequenceDiffs,
  removeVeryShortMatchingLinesBetweenDiffs,
  extendDiffsToEntireWordIfAppropriate,
  removeShortMatches,
  removeVeryShortMatchingTextBetweenLongDiffs,
} from './heuristics';
import {
  DetailedLineRangeMapping,
  RangeMapping,
  ArrayText,
  lineRangeMappingFromRangeMappings,
  LineRangeMapping,
} from './rangeMapping';
import { createRange } from './types';
import type { DiffOptions } from './types';

/**
 * Result of computing a diff between two texts.
 */
export interface LinesDiff {
  readonly changes: DetailedLineRangeMapping[];
  readonly hitTimeout: boolean;
}

/**
 * Computes the diff between two sets of lines.
 */
export class DefaultLinesDiffComputer {
  private readonly dynamicProgrammingDiffing = new DynamicProgrammingDiffing();
  private readonly myersDiffingAlgorithm = new MyersDiffAlgorithm();

  computeDiff(originalLines: string[], modifiedLines: string[], options: DiffOptions): LinesDiff {
    // Handle trivial cases
    if (originalLines.length <= 1 && this.arraysEqual(originalLines, modifiedLines)) {
      return { changes: [], hitTimeout: false };
    }

    if (
      (originalLines.length === 1 && originalLines[0].length === 0) ||
      (modifiedLines.length === 1 && modifiedLines[0].length === 0)
    ) {
      return {
        changes: [
          new DetailedLineRangeMapping(
            new LineRange(1, originalLines.length + 1),
            new LineRange(1, modifiedLines.length + 1),
            [
              new RangeMapping(
                createRange(1, 1, originalLines.length, originalLines[originalLines.length - 1].length + 1),
                createRange(1, 1, modifiedLines.length, modifiedLines[modifiedLines.length - 1].length + 1)
              ),
            ]
          ),
        ],
        hitTimeout: false,
      };
    }

    const timeout =
      options.maxComputationTimeMs === 0 ? InfiniteTimeout.instance : new DateTimeout(options.maxComputationTimeMs);
    const considerWhitespaceChanges = !options.ignoreTrimWhitespace;

    // Create hash map for line comparison
    const perfectHashes = new Map<string, number>();
    function getOrCreateHash(text: string): number {
      let hash = perfectHashes.get(text);
      if (hash === undefined) {
        hash = perfectHashes.size;
        perfectHashes.set(text, hash);
      }
      return hash;
    }

    const originalLinesHashes = originalLines.map((l) => getOrCreateHash(l.trim()));
    const modifiedLinesHashes = modifiedLines.map((l) => getOrCreateHash(l.trim()));

    const sequence1 = new LineSequence(originalLinesHashes, originalLines);
    const sequence2 = new LineSequence(modifiedLinesHashes, modifiedLines);

    // Choose algorithm based on file size
    const lineAlignmentResult = (() => {
      if (sequence1.length + sequence2.length < 1700) {
        // Use DP algorithm for small files
        return this.dynamicProgrammingDiffing.compute(
          sequence1,
          sequence2,
          timeout,
          (offset1, offset2) =>
            originalLines[offset1] === modifiedLines[offset2]
              ? modifiedLines[offset2].length === 0
                ? 0.1
                : 1 + Math.log(1 + modifiedLines[offset2].length)
              : 0.99
        );
      }

      // Use Myers algorithm for larger files
      return this.myersDiffingAlgorithm.compute(sequence1, sequence2, timeout);
    })();

    let lineAlignments = lineAlignmentResult.diffs;
    let hitTimeout = lineAlignmentResult.hitTimeout;

    // Apply optimizations
    lineAlignments = optimizeSequenceDiffs(sequence1, sequence2, lineAlignments);
    lineAlignments = removeVeryShortMatchingLinesBetweenDiffs(sequence1, sequence2, lineAlignments);

    const alignments: RangeMapping[] = [];

    // Process whitespace-only changes in equal regions
    const scanForWhitespaceChanges = (equalLinesCount: number, seq1LastStart: number, seq2LastStart: number) => {
      if (!considerWhitespaceChanges) {
        return;
      }

      for (let i = 0; i < equalLinesCount; i++) {
        const seq1Offset = seq1LastStart + i;
        const seq2Offset = seq2LastStart + i;
        if (originalLines[seq1Offset] !== modifiedLines[seq2Offset]) {
          const characterDiffs = this.refineDiff(
            originalLines,
            modifiedLines,
            new SequenceDiff(new OffsetRange(seq1Offset, seq1Offset + 1), new OffsetRange(seq2Offset, seq2Offset + 1)),
            timeout,
            considerWhitespaceChanges,
            options
          );
          for (const a of characterDiffs.mappings) {
            alignments.push(a);
          }
          if (characterDiffs.hitTimeout) {
            hitTimeout = true;
          }
        }
      }
    };

    let seq1LastStart = 0;
    let seq2LastStart = 0;

    for (const diff of lineAlignments) {
      const equalLinesCount = diff.seq1Range.start - seq1LastStart;

      scanForWhitespaceChanges(equalLinesCount, seq1LastStart, seq2LastStart);

      seq1LastStart = diff.seq1Range.endExclusive;
      seq2LastStart = diff.seq2Range.endExclusive;

      const characterDiffs = this.refineDiff(
        originalLines,
        modifiedLines,
        diff,
        timeout,
        considerWhitespaceChanges,
        options
      );
      if (characterDiffs.hitTimeout) {
        hitTimeout = true;
      }
      for (const a of characterDiffs.mappings) {
        alignments.push(a);
      }
    }

    scanForWhitespaceChanges(originalLines.length - seq1LastStart, seq1LastStart, seq2LastStart);

    const original = new ArrayText(originalLines);
    const modified = new ArrayText(modifiedLines);

    const changes = lineRangeMappingFromRangeMappings(alignments, original, modified);

    return { changes, hitTimeout };
  }

  private refineDiff(
    originalLines: string[],
    modifiedLines: string[],
    diff: SequenceDiff,
    timeout: ITimeout,
    considerWhitespaceChanges: boolean,
    options: DiffOptions
  ): { mappings: RangeMapping[]; hitTimeout: boolean } {
    const lineRangeMapping = toLineRangeMapping(diff);
    const rangeMapping = lineRangeMapping.toRangeMapping2(originalLines, modifiedLines);

    const slice1 = new LinesSliceCharSequence(originalLines, rangeMapping.originalRange, considerWhitespaceChanges);
    const slice2 = new LinesSliceCharSequence(modifiedLines, rangeMapping.modifiedRange, considerWhitespaceChanges);

    const diffResult =
      slice1.length + slice2.length < 500
        ? this.dynamicProgrammingDiffing.compute(slice1, slice2, timeout)
        : this.myersDiffingAlgorithm.compute(slice1, slice2, timeout);

    let diffs = diffResult.diffs;
    diffs = optimizeSequenceDiffs(slice1, slice2, diffs);
    diffs = extendDiffsToEntireWordIfAppropriate(slice1, slice2, diffs, (seq, idx) => seq.findWordContaining(idx));

    if (options.extendToSubwords) {
      diffs = extendDiffsToEntireWordIfAppropriate(
        slice1,
        slice2,
        diffs,
        (seq, idx) => seq.findSubWordContaining(idx),
        true
      );
    }

    diffs = removeShortMatches(slice1, slice2, diffs);
    diffs = removeVeryShortMatchingTextBetweenLongDiffs(slice1, slice2, diffs);

    const result = diffs.map((d) => new RangeMapping(slice1.translateRange(d.seq1Range), slice2.translateRange(d.seq2Range)));

    return {
      mappings: result,
      hitTimeout: diffResult.hitTimeout,
    };
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
}

function toLineRangeMapping(sequenceDiff: SequenceDiff): LineRangeMapping {
  return new LineRangeMapping(
    new LineRange(sequenceDiff.seq1Range.start + 1, sequenceDiff.seq1Range.endExclusive + 1),
    new LineRange(sequenceDiff.seq2Range.start + 1, sequenceDiff.seq2Range.endExclusive + 1)
  );
}
