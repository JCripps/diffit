<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { confirm } from '@tauri-apps/plugin-dialog';
  import { writeTextFile } from '@tauri-apps/plugin-fs';
  import Header from './Header.svelte';
  import Footer from './Footer.svelte';
  import FileToolbar from './FileToolbar.svelte';
  import MonacoDiffEditor from './MonacoDiffEditor.svelte';

  let originalText = $state('');
  let modifiedText = $state('');
  let stats = $state({ additions: 0, deletions: 0, modified: 0 });

  // File state
  let originalFilePath = $state('');
  let modifiedFilePath = $state('');
  let originalSavedContent = $state('');
  let modifiedSavedContent = $state('');
  let originalLanguage = $state('plaintext');
  let modifiedLanguage = $state('plaintext');
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

  function handleClear() {
    diffEditorComponent?.clear();
    originalFilePath = '';
    modifiedFilePath = '';
    originalSavedContent = '';
    modifiedSavedContent = '';
    originalLanguage = 'plaintext';
    modifiedLanguage = 'plaintext';
  }

  function handleSwap() {
    diffEditorComponent?.swap();
    // Swap file paths and saved content
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

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveFile(focusedPane);
    }
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

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<div
  class="flex flex-col h-screen p-3"
  style="background-color: var(--no-bg-primary);"
>
  <Header onclear={handleClear} onswap={handleSwap} />

  <main class="flex-1 min-h-0 py-3">
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
  </main>

  <Footer
    additions={stats.additions}
    deletions={stats.deletions}
    modified={stats.modified}
  />
</div>

<style>
  .editor-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 3px;
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
