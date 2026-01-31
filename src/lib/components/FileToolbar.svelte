<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import { readTextFile } from '@tauri-apps/plugin-fs';

  interface Props {
    filePath: string;
    language: string;
    hasUnsavedChanges: boolean;
    disabled?: boolean;
    onLoad: (content: string, path: string) => void;
    onSave: () => void;
    side: 'original' | 'modified';
  }

  let {
    filePath = $bindable(''),
    language = $bindable('plaintext'),
    hasUnsavedChanges,
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
  <input
    type="text"
    bind:value={inputPath}
    onkeydown={handleKeyDown}
    placeholder="Enter file path or browse..."
    class="path-input"
    {disabled}
  />
  <button
    onclick={handleBrowse}
    class="toolbar-btn"
    disabled={disabled || isLoading}
    title="Browse for file"
  >
    {isLoading ? '...' : 'Browse'}
  </button>
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
  <button
    onclick={onSave}
    class="toolbar-btn save-btn"
    disabled={disabled || !filePath || !hasUnsavedChanges}
    title={!filePath ? 'No file loaded' : !hasUnsavedChanges ? 'No changes to save' : 'Save file (Ctrl+S)'}
  >
    Save
  </button>
</div>

<style>
  .file-toolbar {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: var(--no-bg-secondary);
    border-bottom: 1px solid var(--no-border);
  }

  .path-input {
    flex: 1;
    min-width: 0;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace;
    color: var(--no-fg-primary);
    background-color: var(--no-bg-primary);
    border: 1px solid var(--no-border);
    border-radius: 0.375rem;
    outline: none;
  }

  .path-input::placeholder {
    color: var(--no-fg-muted);
  }

  .path-input:focus {
    border-color: var(--no-accent-blue);
    box-shadow: 0 0 0 2px var(--no-focus-ring);
  }

  .path-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toolbar-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--no-fg-primary);
    background-color: var(--no-bg-tertiary);
    border: 1px solid var(--no-border);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 150ms ease;
    white-space: nowrap;
  }

  .toolbar-btn:hover:not(:disabled) {
    background-color: var(--no-hover-bg);
    border-color: var(--no-accent-blue);
  }

  .toolbar-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--no-bg-primary), 0 0 0 4px var(--no-focus-ring);
  }

  .toolbar-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .save-btn:not(:disabled) {
    background-color: var(--no-accent-blue);
    color: white;
    border-color: var(--no-accent-blue);
  }

  .save-btn:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .language-select {
    padding: 0.375rem 0.5rem;
    font-size: 0.8125rem;
    color: var(--no-fg-primary);
    background-color: var(--no-bg-tertiary);
    border: 1px solid var(--no-border);
    border-radius: 0.375rem;
    cursor: pointer;
    outline: none;
  }

  .language-select:hover:not(:disabled) {
    border-color: var(--no-accent-blue);
  }

  .language-select:focus {
    border-color: var(--no-accent-blue);
    box-shadow: 0 0 0 2px var(--no-focus-ring);
  }

  .language-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
