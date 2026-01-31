<script lang="ts">
  import Header from './Header.svelte';
  import Footer from './Footer.svelte';
  import MonacoDiffEditor from './MonacoDiffEditor.svelte';

  let originalText = $state('');
  let modifiedText = $state('');
  let stats = $state({ additions: 0, deletions: 0, modified: 0 });

  let diffEditorComponent: MonacoDiffEditor;

  function handleStatsChange(newStats: { additions: number; deletions: number; modified: number }) {
    stats = newStats;
  }

  function handleClear() {
    diffEditorComponent?.clear();
  }

  function handleSwap() {
    diffEditorComponent?.swap();
  }
</script>

<div
  class="flex flex-col h-screen p-4"
  style="background-color: var(--no-bg-primary);"
>
  <Header onclear={handleClear} onswap={handleSwap} />

  <main class="flex-1 min-h-0 py-4">
    <div class="editor-container">
      <MonacoDiffEditor
        bind:this={diffEditorComponent}
        bind:originalText
        bind:modifiedText
        onStatsChange={handleStatsChange}
      />
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
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid var(--no-border);
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  }
</style>
