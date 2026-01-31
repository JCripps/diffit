<script lang="ts">
  import { X, Plus, Eraser, ArrowLeftRight } from 'lucide-svelte';
  import type { TabState } from '$lib/types/tab';
  import { deriveTabLabel, hasUnsavedChanges } from '$lib/types/tab';

  interface Props {
    tabs: TabState[];
    activeTabId: string;
    onSelect: (id: string) => void;
    onClose: (id: string) => void;
    onNewTab: () => void;
    onClear: () => void;
    onSwap: () => void;
  }

  let { tabs, activeTabId, onSelect, onClose, onNewTab, onClear, onSwap }: Props = $props();

  function handleMiddleClick(e: MouseEvent, tabId: string) {
    if (e.button === 1) {
      e.preventDefault();
      onClose(tabId);
    }
  }

  function handleCloseClick(e: MouseEvent, tabId: string) {
    e.stopPropagation();
    onClose(tabId);
  }

  function handleKeyDown(e: KeyboardEvent, tabId: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(tabId);
    }
  }
</script>

<header class="unified-header" data-tauri-drag-region>
  <!-- Logo - compact -->
  <div class="logo">
    <span class="logo-mark">&lt;/&gt;</span>
    <span class="logo-text"><span class="logo-diff">diff</span><span class="logo-it">it</span></span>
  </div>

  <!-- Tabs strip -->
  <div class="tabs-strip" role="tablist">
    {#each tabs as tab (tab.id)}
      {@const isActive = tab.id === activeTabId}
      {@const unsaved = hasUnsavedChanges(tab)}
      {@const label = deriveTabLabel(tab)}
      <div
        class="tab"
        class:tab-active={isActive}
        onclick={() => onSelect(tab.id)}
        onkeydown={(e) => handleKeyDown(e, tab.id)}
        onauxclick={(e) => handleMiddleClick(e, tab.id)}
        role="tab"
        tabindex="0"
        aria-selected={isActive}
        title={label}
      >
        {#if unsaved}
          <span class="unsaved-dot"></span>
        {/if}
        <span class="tab-text">{label}</span>
        {#if tabs.length > 1}
          <button
            class="tab-close"
            onclick={(e) => handleCloseClick(e, tab.id)}
            title="Close tab"
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        {/if}
      </div>
    {/each}

    <button class="new-tab-btn" onclick={onNewTab} title="New tab (⌘T)">
      <Plus size={13} strokeWidth={2} />
    </button>
  </div>

  <!-- Actions -->
  <div class="header-actions">
    <button onclick={onClear} class="action-btn" title="Clear">
      <Eraser size={14} strokeWidth={1.75} />
    </button>
    <button onclick={onSwap} class="action-btn" title="Swap">
      <ArrowLeftRight size={14} strokeWidth={1.75} />
    </button>
  </div>
</header>

<style>
  .unified-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    height: 38px;
    padding: 0 0.625rem;
    background: var(--no-bg-secondary);
    border-bottom: 1px solid var(--no-border);
    user-select: none;
  }

  /* Logo */
  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-right: 0.5rem;
    border-right: 1px solid var(--no-border-subtle);
    flex-shrink: 0;
  }

  .logo-mark {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--no-fg-muted);
    opacity: 0.7;
  }

  .logo-text {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .logo-diff {
    color: var(--no-accent-blue);
  }

  .logo-it {
    color: var(--no-fg-muted);
  }

  /* Tabs strip */
  .tabs-strip {
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    padding: 3px 0;
    scrollbar-width: none;
  }

  .tabs-strip::-webkit-scrollbar {
    display: none;
  }

  .tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    color: var(--no-fg-muted);
    background: transparent;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 120ms ease;
    max-width: 160px;
    flex-shrink: 0;
  }

  .tab:hover {
    color: var(--no-fg-secondary);
    background: var(--no-hover-bg);
  }

  .tab-active {
    color: var(--no-fg-primary);
    background: var(--no-bg-elevated);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.08),
      0 0 0 1px var(--no-border-subtle);
  }

  .tab-active:hover {
    background: var(--no-bg-elevated);
  }

  .unsaved-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--no-accent-blue);
    flex-shrink: 0;
    box-shadow: 0 0 4px var(--no-accent-blue);
  }

  .tab-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-left: auto;
    margin-right: -4px;
    color: var(--no-fg-muted);
    background: transparent;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    opacity: 0;
    transition: all 100ms ease;
    flex-shrink: 0;
  }

  .tab:hover .tab-close {
    opacity: 0.5;
  }

  .tab-close:hover {
    opacity: 1 !important;
    background: var(--no-hover-bg);
    color: var(--no-fg-primary);
  }

  .new-tab-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: var(--no-fg-muted);
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 100ms ease;
    flex-shrink: 0;
    opacity: 0.6;
  }

  .new-tab-btn:hover {
    opacity: 1;
    color: var(--no-fg-primary);
    background: var(--no-hover-bg);
  }

  /* Actions */
  .header-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    padding-left: 0.5rem;
    border-left: 1px solid var(--no-border-subtle);
    flex-shrink: 0;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: var(--no-fg-muted);
    background: transparent;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 100ms ease;
  }

  .action-btn:hover {
    color: var(--no-fg-primary);
    background: var(--no-hover-bg);
  }

  .action-btn:active {
    background: var(--no-active-bg);
  }

  .action-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--no-focus-ring);
  }
</style>
