export interface TabState {
  id: string;
  originalText: string;
  modifiedText: string;
  originalFilePath: string;
  modifiedFilePath: string;
  originalSavedContent: string;
  modifiedSavedContent: string;
  originalLanguage: string;
  modifiedLanguage: string;
  stats: { additions: number; deletions: number; modified: number };
}

export function createEmptyTab(): TabState {
  return {
    id: crypto.randomUUID(),
    originalText: '',
    modifiedText: '',
    originalFilePath: '',
    modifiedFilePath: '',
    originalSavedContent: '',
    modifiedSavedContent: '',
    originalLanguage: 'plaintext',
    modifiedLanguage: 'plaintext',
    stats: { additions: 0, deletions: 0, modified: 0 },
  };
}

export function deriveTabLabel(tab: TabState): string {
  const left = tab.originalFilePath.split('/').pop() || '';
  const right = tab.modifiedFilePath.split('/').pop() || '';
  if (left && right) return `${left} ↔ ${right}`;
  if (left) return left;
  if (right) return right;
  return 'Untitled';
}

export function hasUnsavedChanges(tab: TabState): boolean {
  const originalChanged = tab.originalFilePath !== '' && tab.originalText !== tab.originalSavedContent;
  const modifiedChanged = tab.modifiedFilePath !== '' && tab.modifiedText !== tab.modifiedSavedContent;
  return originalChanged || modifiedChanged;
}
