<script lang="ts">
  import { confirm } from '@tauri-apps/plugin-dialog';
  import { writeTextFile } from '@tauri-apps/plugin-fs';
  import Footer from './Footer.svelte';
  import FileToolbar from './FileToolbar.svelte';
  import MonacoDiffEditor from './MonacoDiffEditor.svelte';

  interface Props {
    originalText?: string;
    modifiedText?: string;
    originalFilePath?: string;
    modifiedFilePath?: string;
    originalSavedContent?: string;
    modifiedSavedContent?: string;
    originalLanguage?: string;
    modifiedLanguage?: string;
    stats?: { additions: number; deletions: number; modified: number };
  }

  let {
    originalText = $bindable(''),
    modifiedText = $bindable(''),
    originalFilePath = $bindable(''),
    modifiedFilePath = $bindable(''),
    originalSavedContent = $bindable(''),
    modifiedSavedContent = $bindable(''),
    originalLanguage = $bindable('plaintext'),
    modifiedLanguage = $bindable('plaintext'),
    stats = $bindable({ additions: 0, deletions: 0, modified: 0 }),
  }: Props = $props();

  let focusedPane = $state<'original' | 'modified'>('original');

  // Computed: check for unsaved changes
  let originalHasChanges = $derived(originalFilePath !== '' && originalText !== originalSavedContent);
  let modifiedHasChanges = $derived(modifiedFilePath !== '' && modifiedText !== modifiedSavedContent);

  let diffEditorComponent: MonacoDiffEditor;

  function handleStatsChange(newStats: { additions: number; deletions: number; modified: number }) {
    stats = newStats;
  }

  function handleFocusChange(side: 'original' | 'modified') {
    focusedPane = side;
  }

  async function handleOriginalLoad(content: string, path: string) {
    if (originalHasChanges) {
      const confirmed = await confirm('You have unsaved changes in the original pane. Load anyway?', {
        title: 'Unsaved Changes',
        kind: 'warning',
      });
      if (!confirmed) return;
    }
    originalText = content;
    originalFilePath = path;
    originalSavedContent = content;
  }

  async function handleModifiedLoad(content: string, path: string) {
    if (modifiedHasChanges) {
      const confirmed = await confirm('You have unsaved changes in the modified pane. Load anyway?', {
        title: 'Unsaved Changes',
        kind: 'warning',
      });
      if (!confirmed) return;
    }
    modifiedText = content;
    modifiedFilePath = path;
    modifiedSavedContent = content;
  }

  async function saveFile(side: 'original' | 'modified') {
    const content = side === 'original' ? originalText : modifiedText;
    const path = side === 'original' ? originalFilePath : modifiedFilePath;

    if (!path) {
      alert('No file loaded to save.');
      return;
    }

    try {
      await writeTextFile(path, content);
      if (side === 'original') {
        originalSavedContent = content;
      } else {
        modifiedSavedContent = content;
      }
    } catch (err) {
      console.error('Failed to save file:', err);
      alert(`Failed to save file: ${err}`);
    }
  }

  function handleOriginalSave() {
    saveFile('original');
  }

  function handleModifiedSave() {
    saveFile('modified');
  }

  // Update language when changed in toolbar
  $effect(() => {
    if (diffEditorComponent) {
      diffEditorComponent.setLanguage('original', originalLanguage);
    }
  });

  $effect(() => {
    if (diffEditorComponent) {
      diffEditorComponent.setLanguage('modified', modifiedLanguage);
    }
  });

  // Expose methods for parent component
  export function saveFocusedPane() {
    saveFile(focusedPane);
  }

  export function getFocusedPane() {
    return focusedPane;
  }

  export function clear() {
    diffEditorComponent?.clear();
    originalFilePath = '';
    modifiedFilePath = '';
    originalSavedContent = '';
    modifiedSavedContent = '';
    originalLanguage = 'plaintext';
    modifiedLanguage = 'plaintext';
  }

  export function swap() {
    diffEditorComponent?.swap();
    const tempPath = originalFilePath;
    const tempSaved = originalSavedContent;
    const tempLang = originalLanguage;

    originalFilePath = modifiedFilePath;
    originalSavedContent = modifiedSavedContent;
    originalLanguage = modifiedLanguage;

    modifiedFilePath = tempPath;
    modifiedSavedContent = tempSaved;
    modifiedLanguage = tempLang;
  }
</script>

<div class="diff-viewer">
  <div class="editor-container">
    <div class="toolbars-row">
      <div class="toolbar-pane">
        <FileToolbar
          bind:filePath={originalFilePath}
          bind:language={originalLanguage}
          hasUnsavedChanges={originalHasChanges}
          onLoad={handleOriginalLoad}
          onSave={handleOriginalSave}
          side="original"
        />
      </div>
      <div class="toolbar-pane">
        <FileToolbar
          bind:filePath={modifiedFilePath}
          bind:language={modifiedLanguage}
          hasUnsavedChanges={modifiedHasChanges}
          onLoad={handleModifiedLoad}
          onSave={handleModifiedSave}
          side="modified"
        />
      </div>
    </div>
    <div class="editor-area">
      <MonacoDiffEditor
        bind:this={diffEditorComponent}
        bind:originalText
        bind:modifiedText
        onStatsChange={handleStatsChange}
        onFocusChange={handleFocusChange}
      />
    </div>
  </div>

  <Footer
    additions={stats.additions}
    deletions={stats.deletions}
    modified={stats.modified}
  />
</div>

<style>
  .diff-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--no-bg-primary);
  }

  .editor-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--no-border);
    background-color: var(--no-bg-elevated);
  }

  .toolbars-row {
    display: flex;
    border-bottom: 1px solid var(--no-border);
  }

  .toolbar-pane {
    flex: 1;
    min-width: 0;
  }

  .toolbar-pane:first-child {
    border-right: 1px solid var(--no-border);
  }

  .editor-area {
    flex: 1;
    min-height: 0;
  }
</style>
