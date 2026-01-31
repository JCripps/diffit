<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { monaco } from '$lib/monaco/setup';
  import type * as Monaco from 'monaco-editor';

  interface Props {
    originalText: string;
    modifiedText: string;
    onStatsChange?: (stats: { additions: number; deletions: number; modified: number }) => void;
  }

  let { originalText = $bindable(''), modifiedText = $bindable(''), onStatsChange }: Props = $props();

  let containerEl: HTMLDivElement;
  let diffEditor: Monaco.editor.IStandaloneDiffEditor | null = null;
  let originalModel: Monaco.editor.ITextModel | null = null;
  let modifiedModel: Monaco.editor.ITextModel | null = null;
  let mediaQuery: MediaQueryList | null = null;
  let handleThemeChange: ((e: MediaQueryListEvent) => void) | null = null;

  // Track whether we're updating models programmatically to avoid loops
  let isUpdatingModels = false;

  function getPreferredTheme(): string {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'night-owl-dark'
        : 'night-owl-light';
    }
    return 'night-owl-light';
  }

  function computeStats(lineChanges: Monaco.editor.ILineChange[] | null): { additions: number; deletions: number; modified: number } {
    if (!lineChanges) {
      return { additions: 0, deletions: 0, modified: 0 };
    }

    let additions = 0;
    let deletions = 0;
    let modified = 0;

    for (const change of lineChanges) {
      // In Monaco's ILineChange:
      // - originalEndLineNumber === 0 means no lines in original (pure addition)
      // - modifiedEndLineNumber === 0 means no lines in modified (pure deletion)
      const hasOriginal = change.originalEndLineNumber > 0;
      const hasModified = change.modifiedEndLineNumber > 0;

      const originalCount = hasOriginal
        ? change.originalEndLineNumber - change.originalStartLineNumber + 1
        : 0;
      const modifiedCount = hasModified
        ? change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1
        : 0;

      if (!hasOriginal && hasModified) {
        // Pure addition
        additions += modifiedCount;
      } else if (hasOriginal && !hasModified) {
        // Pure deletion
        deletions += originalCount;
      } else {
        // Both sides have content - it's a modification
        // Count the overlap as modified, excess lines as additions/deletions
        const minCount = Math.min(originalCount, modifiedCount);
        modified += minCount;

        if (modifiedCount > originalCount) {
          additions += modifiedCount - originalCount;
        } else if (originalCount > modifiedCount) {
          deletions += originalCount - modifiedCount;
        }
      }
    }

    return { additions, deletions, modified };
  }

  onMount(() => {
    // Create models
    originalModel = monaco.editor.createModel(originalText, 'text/plain');
    modifiedModel = monaco.editor.createModel(modifiedText, 'text/plain');

    // Create diff editor
    diffEditor = monaco.editor.createDiffEditor(containerEl, {
      theme: getPreferredTheme(),
      automaticLayout: true,
      originalEditable: true,
      readOnly: false,
      renderSideBySide: true,
      enableSplitViewResizing: true,
      ignoreTrimWhitespace: false,
      renderIndicators: true,
      renderMarginRevertIcon: false,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'off',
    });

    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    // Listen for content changes on original model
    originalModel.onDidChangeContent(() => {
      if (!isUpdatingModels && originalModel) {
        originalText = originalModel.getValue();
      }
    });

    // Listen for content changes on modified model
    modifiedModel.onDidChangeContent(() => {
      if (!isUpdatingModels && modifiedModel) {
        modifiedText = modifiedModel.getValue();
      }
    });

    // Listen for diff computation to update stats
    diffEditor.onDidUpdateDiff(() => {
      if (diffEditor && onStatsChange) {
        const lineChanges = diffEditor.getLineChanges();
        const stats = computeStats(lineChanges);
        onStatsChange(stats);
      }
    });

    // Listen for system theme changes
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    handleThemeChange = (e: MediaQueryListEvent) => {
      monaco.editor.setTheme(e.matches ? 'night-owl-dark' : 'night-owl-light');
    };
    mediaQuery.addEventListener('change', handleThemeChange);
  });

  // Sync external changes to models
  $effect(() => {
    if (originalModel && originalModel.getValue() !== originalText) {
      isUpdatingModels = true;
      originalModel.setValue(originalText);
      isUpdatingModels = false;
    }
  });

  $effect(() => {
    if (modifiedModel && modifiedModel.getValue() !== modifiedText) {
      isUpdatingModels = true;
      modifiedModel.setValue(modifiedText);
      isUpdatingModels = false;
    }
  });

  onDestroy(() => {
    if (mediaQuery && handleThemeChange) {
      mediaQuery.removeEventListener('change', handleThemeChange);
    }
    diffEditor?.dispose();
    originalModel?.dispose();
    modifiedModel?.dispose();
  });

  // Exported methods
  export function clear() {
    if (originalModel && modifiedModel) {
      isUpdatingModels = true;
      originalModel.setValue('');
      modifiedModel.setValue('');
      isUpdatingModels = false;
      originalText = '';
      modifiedText = '';
    }
  }

  export function swap() {
    const temp = originalText;
    originalText = modifiedText;
    modifiedText = temp;
  }
</script>

<div bind:this={containerEl} class="w-full h-full"></div>
