<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { confirm } from '@tauri-apps/plugin-dialog';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';
  import TabBar from './TabBar.svelte';
  import DiffViewer from './DiffViewer.svelte';
  import type { TabState } from '$lib/types/tab';
  import { createEmptyTab, hasUnsavedChanges } from '$lib/types/tab';
  import { settings } from '$lib/stores/settings.svelte';

  // Initialize with one empty tab
  const initialTab = createEmptyTab();
  let tabs = $state<TabState[]>([initialTab]);
  let activeTabId = $state(initialTab.id);

  // Get active tab
  let activeTab = $derived(tabs.find(t => t.id === activeTabId)!);
  let activeTabIndex = $derived(tabs.findIndex(t => t.id === activeTabId));

  let diffViewerComponent: DiffViewer | undefined = $state();

  function createTab() {
    const newTab = createEmptyTab();
    tabs = [...tabs, newTab];
    activeTabId = newTab.id;
  }

  async function closeTab(id: string) {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;

    // Prevent closing the last tab
    if (tabs.length === 1) {
      // Just clear the content instead
      diffViewerComponent?.clear();
      const idx = tabs.findIndex(t => t.id === id);
      tabs[idx] = createEmptyTab();
      tabs[idx].id = id;
      tabs = [...tabs];
      return;
    }

    // Check for unsaved changes
    if (hasUnsavedChanges(tab)) {
      const confirmed = await confirm('This tab has unsaved changes. Close anyway?', {
        title: 'Unsaved Changes',
        kind: 'warning',
      });
      if (!confirmed) return;
    }

    const idx = tabs.findIndex(t => t.id === id);
    tabs = tabs.filter(t => t.id !== id);

    // If we closed the active tab, switch to an adjacent one
    if (activeTabId === id) {
      const newIdx = Math.min(idx, tabs.length - 1);
      activeTabId = tabs[newIdx].id;
    }
  }

  function selectTab(id: string) {
    activeTabId = id;
  }

  function nextTab() {
    if (tabs.length <= 1) return;
    const newIdx = (activeTabIndex + 1) % tabs.length;
    activeTabId = tabs[newIdx].id;
  }

  function previousTab() {
    if (tabs.length <= 1) return;
    const newIdx = (activeTabIndex - 1 + tabs.length) % tabs.length;
    activeTabId = tabs[newIdx].id;
  }

  function switchToTab(n: number) {
    if (n >= 0 && n < tabs.length) {
      activeTabId = tabs[n].id;
    }
  }

  function handleClear() {
    diffViewerComponent?.clear();
  }

  function handleSwap() {
    diffViewerComponent?.swap();
  }

  function handleKeyDown(e: KeyboardEvent) {
    const isMod = e.metaKey || e.ctrlKey;

    // Cmd+T: New tab
    if (isMod && e.key === 't') {
      e.preventDefault();
      createTab();
      return;
    }

    // Cmd+W: Close current tab
    if (isMod && e.key === 'w') {
      e.preventDefault();
      closeTab(activeTabId);
      return;
    }

    // Cmd+Shift+]: Next tab
    if (isMod && e.shiftKey && e.key === ']') {
      e.preventDefault();
      nextTab();
      return;
    }

    // Cmd+Shift+[: Previous tab
    if (isMod && e.shiftKey && e.key === '[') {
      e.preventDefault();
      previousTab();
      return;
    }

    // Cmd+1-9: Switch to tab N
    if (isMod && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const n = parseInt(e.key) - 1;
      switchToTab(n);
      return;
    }

    // Cmd+S: Save focused pane
    if (isMod && e.key === 's') {
      e.preventDefault();
      diffViewerComponent?.saveFocusedPane();
      return;
    }
  }

  let unlistenZoom: UnlistenFn | undefined;

  onMount(async () => {
    window.addEventListener('keydown', handleKeyDown);

    // Listen for native menu zoom events
    unlistenZoom = await listen<string>('menu-zoom', (event) => {
      switch (event.payload) {
        case 'in':
          settings.increaseFontSize();
          break;
        case 'out':
          settings.decreaseFontSize();
          break;
        case 'reset':
          settings.resetFontSize();
          break;
      }
    });
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown);
    unlistenZoom?.();
  });
</script>

<div class="app-container">
  <TabBar
    {tabs}
    {activeTabId}
    onSelect={selectTab}
    onClose={closeTab}
    onNewTab={createTab}
    onClear={handleClear}
    onSwap={handleSwap}
  />

  {#key activeTabId}
    <div class="content-area">
      <DiffViewer
        bind:this={diffViewerComponent}
        bind:originalText={activeTab.originalText}
        bind:modifiedText={activeTab.modifiedText}
        bind:originalFilePath={activeTab.originalFilePath}
        bind:modifiedFilePath={activeTab.modifiedFilePath}
        bind:originalSavedContent={activeTab.originalSavedContent}
        bind:modifiedSavedContent={activeTab.modifiedSavedContent}
        bind:originalLanguage={activeTab.originalLanguage}
        bind:modifiedLanguage={activeTab.modifiedLanguage}
        bind:stats={activeTab.stats}
      />
    </div>
  {/key}
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: var(--no-bg-primary);
  }

  .content-area {
    flex: 1;
    min-height: 0;
    padding: 0.75rem;
  }
</style>
