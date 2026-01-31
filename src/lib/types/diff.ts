export type ChangeType = 'unchanged' | 'added' | 'removed' | 'modified';

export interface CharChange {
  start: number;    // 0-based column
  end: number;      // 0-based column (exclusive)
  type: 'added' | 'removed';
}

export interface LineDiff {
  content: string;
  lineNumber: number | null;
  changeType: ChangeType;
  charChanges?: CharChange[];
}

export interface DiffResult {
  leftLines: LineDiff[];
  rightLines: LineDiff[];
  stats: {
    additions: number;
    deletions: number;
    modified: number;
  };
  hitTimeout: boolean;
}
