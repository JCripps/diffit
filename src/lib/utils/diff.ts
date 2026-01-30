import { diffLines } from 'diff';
import type { DiffResult, LineDiff } from '$lib/types/diff';

export function computeDiff(leftText: string, rightText: string): DiffResult {
  const changes = diffLines(leftText, rightText);

  const leftLines: LineDiff[] = [];
  const rightLines: LineDiff[] = [];
  let leftLineNum = 1;
  let rightLineNum = 1;
  let additions = 0;
  let deletions = 0;

  for (const change of changes) {
    const lines = change.value.split('\n');
    // Remove trailing empty string from split if the value ends with newline
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    if (change.added) {
      // Added lines only appear on the right
      for (const line of lines) {
        leftLines.push({ content: '', lineNumber: null, changeType: 'added' });
        rightLines.push({ content: line, lineNumber: rightLineNum++, changeType: 'added' });
        additions++;
      }
    } else if (change.removed) {
      // Removed lines only appear on the left
      for (const line of lines) {
        leftLines.push({ content: line, lineNumber: leftLineNum++, changeType: 'removed' });
        rightLines.push({ content: '', lineNumber: null, changeType: 'removed' });
        deletions++;
      }
    } else {
      // Unchanged lines appear on both sides
      for (const line of lines) {
        leftLines.push({ content: line, lineNumber: leftLineNum++, changeType: 'unchanged' });
        rightLines.push({ content: line, lineNumber: rightLineNum++, changeType: 'unchanged' });
      }
    }
  }

  return {
    leftLines,
    rightLines,
    stats: { additions, deletions }
  };
}
