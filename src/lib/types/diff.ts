export type ChangeType = 'unchanged' | 'added' | 'removed';

export interface LineDiff {
  content: string;
  lineNumber: number | null;
  changeType: ChangeType;
}

export interface DiffResult {
  leftLines: LineDiff[];
  rightLines: LineDiff[];
  stats: {
    additions: number;
    deletions: number;
  };
}
