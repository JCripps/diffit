<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import { readTextFile } from '@tauri-apps/plugin-fs';
  import { FolderOpen, Save, Loader2, ChevronDown } from 'lucide-svelte';

  interface Props {
    filePath: string;
    language: string;
    hasUnsavedChanges: boolean;
    hasContent?: boolean;
    disabled?: boolean;
    onLoad: (content: string, path: string) => void;
    onSave: () => void;
    side: 'original' | 'modified';
  }

  let {
    filePath = $bindable(''),
    language = $bindable('plaintext'),
    hasUnsavedChanges,
    hasContent = false,
    disabled = false,
    onLoad,
    onSave,
    side
  }: Props = $props();

  // Common Monaco language options
  const languages = [
    { id: 'plaintext', label: 'Plain Text' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'json', label: 'JSON' },
    { id: 'markdown', label: 'Markdown' },
    { id: 'python', label: 'Python' },
    { id: 'rust', label: 'Rust' },
    { id: 'go', label: 'Go' },
    { id: 'java', label: 'Java' },
    { id: 'c', label: 'C' },
    { id: 'cpp', label: 'C++' },
    { id: 'csharp', label: 'C#' },
    { id: 'php', label: 'PHP' },
    { id: 'ruby', label: 'Ruby' },
    { id: 'swift', label: 'Swift' },
    { id: 'kotlin', label: 'Kotlin' },
    { id: 'sql', label: 'SQL' },
    { id: 'shell', label: 'Shell' },
    { id: 'yaml', label: 'YAML' },
    { id: 'xml', label: 'XML' },
    { id: 'svelte', label: 'Svelte' },
  ];

  let inputPath = $state(filePath);
  let isLoading = $state(false);

  // Sync inputPath when filePath changes externally
  $effect(() => {
    inputPath = filePath;
  });

  async function handleBrowse() {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
      });

      if (selected) {
        await loadFileFromPath(selected);
      }
    } catch (err) {
      console.error('Failed to open file dialog:', err);
    }
  }

  async function loadFileFromPath(path: string) {
    if (!path.trim()) return;

    isLoading = true;
    try {
      const content = await readTextFile(path);
      onLoad(content, path);
      inputPath = path;

      // Try to detect language from file extension
      const ext = path.split('.').pop()?.toLowerCase();
      if (ext) {
        const detectedLang = detectLanguageFromExtension(ext);
        if (detectedLang) {
          language = detectedLang;
        }
      }
    } catch (err) {
      console.error('Failed to load file:', err);
      alert(`Failed to load file: ${err}`);
    } finally {
      isLoading = false;
    }
  }

  function detectLanguageFromExtension(ext: string): string | null {
    const extMap: Record<string, string> = {
      'js': 'javascript',
      'mjs': 'javascript',
      'cjs': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'jsx': 'javascript',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'c': 'c',
      'h': 'c',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'svelte': 'svelte',
      'vue': 'vue',
      'toml': 'toml',
    };
    return extMap[ext] || null;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      loadFileFromPath(inputPath);
    }
  }
</script>

<div class="file-toolbar">
  <span class="side-label">
    <span class="side-dot" class:side-dot-modified={side === 'modified'}></span>
    {side === 'original' ? 'Original' : 'Modified'}
  </span>

  <div class="toolbar-group path-group">
    <div class="input-wrapper" data-tooltip={inputPath || null}>
      <input
        type="text"
        bind:value={inputPath}
        onkeydown={handleKeyDown}
        placeholder="Enter file path or browse..."
        class="path-input"
        {disabled}
      />
      {#if hasUnsavedChanges}
        <span class="unsaved-dot"></span>
      {/if}
    </div>

    <button
      onclick={handleBrowse}
      class="toolbar-btn icon-btn"
      disabled={disabled || isLoading}
      title="Browse for file"
    >
      {#if isLoading}
        <Loader2 size={14} class="spinning" />
      {:else}
        <FolderOpen size={14} />
      {/if}
    </button>
  </div>

  <div class="toolbar-group">
    <div class="select-wrapper">
      <select
        bind:value={language}
        class="language-select"
        {disabled}
        title="Syntax highlighting language"
      >
        {#each languages as lang}
          <option value={lang.id}>{lang.label}</option>
        {/each}
      </select>
      <span class="select-icon"><ChevronDown size={12} /></span>
    </div>

    <button
      onclick={onSave}
      class="toolbar-btn icon-btn save-btn"
      disabled={disabled || !hasContent || (!!filePath && !hasUnsavedChanges)}
      title={!hasContent ? 'No content to save' : !filePath ? 'Save as... (Ctrl+S)' : !hasUnsavedChanges ? 'No changes to save' : 'Save file (Ctrl+S)'}
    >
      <Save size={14} />
    </button>
  </div>
</div>

<style>
  .file-toolbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.375rem 0.5rem;
    background-color: var(--no-bg-secondary);
    border-bottom: 1px solid var(--no-border-subtle);
  }

  .side-label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--no-fg-muted);
    flex-shrink: 0;
    min-width: 5rem;
  }

  .side-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--no-fg-muted);
    opacity: 0.6;
  }

  .side-dot-modified {
    background-color: var(--no-accent-blue);
    opacity: 1;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .path-group {
    flex: 1;
    min-width: 0;
  }

  .input-wrapper {
    flex: 1;
    min-width: 0;
    position: relative;
  }

  .input-wrapper[data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    padding: 0.375rem 0.5rem;
    font-size: 0.6875rem;
    font-family: var(--font-mono);
    color: var(--no-fg-primary);
    background-color: var(--no-bg-tertiary, var(--no-bg-secondary));
    border: 1px solid var(--no-border-subtle);
    border-radius: 4px;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .path-input {
    width: 100%;
    padding: 0.3125rem 0.5rem;
    font-size: 0.75rem;
    font-family: var(--font-mono);
    color: var(--no-fg-primary);
    background-color: var(--no-bg-primary);
    border: 1px solid var(--no-border-subtle);
    border-radius: 3px;
    outline: none;
    direction: rtl;
    text-align: left;
  }

  .path-input::placeholder {
    color: var(--no-fg-muted);
  }

  .path-input:focus {
    border-color: var(--no-accent-blue);
    box-shadow: 0 0 0 1px var(--no-focus-ring);
  }

  .path-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .unsaved-dot {
    position: absolute;
    right: 0.375rem;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    background-color: var(--no-accent-blue);
    border-radius: 50%;
  }

  .toolbar-btn {
    padding: 0.3125rem;
    font-size: 0.75rem;
    color: var(--no-fg-secondary);
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 3px;
    cursor: pointer;
    transition: all 100ms ease;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toolbar-btn:hover:not(:disabled) {
    background-color: var(--no-hover-bg);
    color: var(--no-fg-primary);
  }

  .toolbar-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--no-focus-ring);
  }

  .toolbar-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .save-btn:not(:disabled) {
    color: var(--no-accent-blue);
  }

  .save-btn:hover:not(:disabled) {
    background-color: var(--no-active-bg);
  }

  .select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .language-select {
    padding: 0.3125rem 1.375rem 0.3125rem 0.5rem;
    font-size: 0.6875rem;
    color: var(--no-fg-secondary);
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 3px;
    cursor: pointer;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
  }

  .select-icon {
    position: absolute;
    right: 0.25rem;
    pointer-events: none;
    color: var(--no-fg-muted);
    display: flex;
    align-items: center;
  }

  .language-select:hover:not(:disabled) {
    background-color: var(--no-hover-bg);
    color: var(--no-fg-primary);
  }

  .language-select:focus {
    background-color: var(--no-hover-bg);
    box-shadow: 0 0 0 2px var(--no-focus-ring);
  }

  .language-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
