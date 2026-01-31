import { computeDiff as vscodeComputeDiff } from '$lib/diff/algorithm';
import type { DiffResult, LineDiff, CharChange } from '$lib/types/diff';

export function computeDiff(leftText: string, rightText: string): DiffResult {
  const leftLines: LineDiff[] = [];
  const rightLines: LineDiff[] = [];
  let additions = 0;
  let deletions = 0;
  let modified = 0;

  // Handle empty inputs
  if (!leftText && !rightText) {
    return {
      leftLines: [{ content: '', lineNumber: 1, changeType: 'unchanged' }],
      rightLines: [{ content: '', lineNumber: 1, changeType: 'unchanged' }],
      stats: { additions: 0, deletions: 0, modified: 0 },
      hitTimeout: false,
    };
  }

  const originalLines = leftText.split(/\r\n|\r|\n/);
  const modifiedLines = rightText.split(/\r\n|\r|\n/);

  // Compute diff using VS Code algorithm
  const diffResult = vscodeComputeDiff(leftText, rightText, {
    ignoreTrimWhitespace: false,
    maxComputationTimeMs: 1000,
    computeMoves: false,
    extendToSubwords: true,
  });

  // Build a map of line numbers to their changes
  const leftLineChanges = new Map<number, { type: 'removed' | 'modified'; charChanges?: CharChange[] }>();
  const rightLineChanges = new Map<number, { type: 'added' | 'modified'; charChanges?: CharChange[] }>();

  for (const change of diffResult.changes) {
    const isModification = !change.original.isEmpty && !change.modified.isEmpty;

    // Process original (left) lines
    for (let lineNum = change.original.startLineNumber; lineNum < change.original.endLineNumberExclusive; lineNum++) {
      if (isModification) {
        const charChanges: CharChange[] = [];
        // Extract character-level changes for this line
        if (change.innerChanges) {
          for (const inner of change.innerChanges) {
            if (inner.originalRange.startLineNumber <= lineNum && inner.originalRange.endLineNumber >= lineNum) {
              // Calculate the character range for this line
              const startCol = inner.originalRange.startLineNumber === lineNum
                ? inner.originalRange.startColumn - 1
                : 0;
              const endCol = inner.originalRange.endLineNumber === lineNum
                ? inner.originalRange.endColumn - 1
                : originalLines[lineNum - 1].length;

              if (startCol < endCol) {
                charChanges.push({
                  start: startCol,
                  end: endCol,
                  type: 'removed',
                });
              }
            }
          }
        }
        leftLineChanges.set(lineNum, { type: 'modified', charChanges: charChanges.length > 0 ? charChanges : undefined });
      } else {
        leftLineChanges.set(lineNum, { type: 'removed' });
      }
    }

    // Process modified (right) lines
    for (let lineNum = change.modified.startLineNumber; lineNum < change.modified.endLineNumberExclusive; lineNum++) {
      if (isModification) {
        const charChanges: CharChange[] = [];
        // Extract character-level changes for this line
        if (change.innerChanges) {
          for (const inner of change.innerChanges) {
            if (inner.modifiedRange.startLineNumber <= lineNum && inner.modifiedRange.endLineNumber >= lineNum) {
              const startCol = inner.modifiedRange.startLineNumber === lineNum
                ? inner.modifiedRange.startColumn - 1
                : 0;
              const endCol = inner.modifiedRange.endLineNumber === lineNum
                ? inner.modifiedRange.endColumn - 1
                : modifiedLines[lineNum - 1].length;

              if (startCol < endCol) {
                charChanges.push({
                  start: startCol,
                  end: endCol,
                  type: 'added',
                });
              }
            }
          }
        }
        rightLineChanges.set(lineNum, { type: 'modified', charChanges: charChanges.length > 0 ? charChanges : undefined });
      } else {
        rightLineChanges.set(lineNum, { type: 'added' });
      }
    }
  }

  // Build output arrays with proper alignment
  let leftIdx = 0;
  let rightIdx = 0;

  while (leftIdx < originalLines.length || rightIdx < modifiedLines.length) {
    const leftLineNum = leftIdx + 1;
    const rightLineNum = rightIdx + 1;

    const leftChange = leftLineChanges.get(leftLineNum);
    const rightChange = rightLineChanges.get(rightLineNum);

    if (leftChange?.type === 'removed' && !rightChange) {
      // Pure deletion
      leftLines.push({
        content: originalLines[leftIdx],
        lineNumber: leftLineNum,
        changeType: 'removed',
      });
      rightLines.push({
        content: '',
        lineNumber: null,
        changeType: 'removed',
      });
      deletions++;
      leftIdx++;
    } else if (!leftChange && rightChange?.type === 'added') {
      // Pure addition
      leftLines.push({
        content: '',
        lineNumber: null,
        changeType: 'added',
      });
      rightLines.push({
        content: modifiedLines[rightIdx],
        lineNumber: rightLineNum,
        changeType: 'added',
      });
      additions++;
      rightIdx++;
    } else if (leftChange?.type === 'modified' || rightChange?.type === 'modified') {
      // Modified line
      leftLines.push({
        content: leftIdx < originalLines.length ? originalLines[leftIdx] : '',
        lineNumber: leftIdx < originalLines.length ? leftLineNum : null,
        changeType: 'modified',
        charChanges: leftChange?.charChanges,
      });
      rightLines.push({
        content: rightIdx < modifiedLines.length ? modifiedLines[rightIdx] : '',
        lineNumber: rightIdx < modifiedLines.length ? rightLineNum : null,
        changeType: 'modified',
        charChanges: rightChange?.charChanges,
      });
      modified++;
      leftIdx++;
      rightIdx++;
    } else {
      // Unchanged line
      leftLines.push({
        content: leftIdx < originalLines.length ? originalLines[leftIdx] : '',
        lineNumber: leftIdx < originalLines.length ? leftLineNum : null,
        changeType: 'unchanged',
      });
      rightLines.push({
        content: rightIdx < modifiedLines.length ? modifiedLines[rightIdx] : '',
        lineNumber: rightIdx < modifiedLines.length ? rightLineNum : null,
        changeType: 'unchanged',
      });
      leftIdx++;
      rightIdx++;
    }
  }

  return {
    leftLines,
    rightLines,
    stats: { additions, deletions, modified },
    hitTimeout: diffResult.hitTimeout,
  };
}
