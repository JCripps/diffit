<script lang="ts">
  import { computeDiff } from '$lib/utils/diff';
  import type { DiffResult } from '$lib/types/diff';
  import TextPanel from './TextPanel.svelte';
  import DiffPanel from './DiffPanel.svelte';
  import Toolbar from './Toolbar.svelte';
  import StatusBar from './StatusBar.svelte';

  let leftText = $state('');
  let rightText = $state('');
  let showDiff = $state(false);

  let diffResult: DiffResult = $derived(computeDiff(leftText, rightText));

  function handleClear() {
    leftText = '';
    rightText = '';
    showDiff = false;
  }

  function handleSwap() {
    const temp = leftText;
    leftText = rightText;
    rightText = temp;
  }

  function handleCompare() {
    showDiff = true;
  }

  function handleEdit() {
    showDiff = false;
  }
</script>

<div class="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 p-4">
  <Toolbar onclear={handleClear} onswap={handleSwap} />

  {#if showDiff}
    <button
      onclick={handleEdit}
      class="mb-4 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline self-start"
    >
      Edit Text
    </button>
    <div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
      <DiffPanel lines={diffResult.leftLines} side="left" label="Original" />
      <DiffPanel lines={diffResult.rightLines} side="right" label="Modified" />
    </div>
    <StatusBar additions={diffResult.stats.additions} deletions={diffResult.stats.deletions} />
  {:else}
    <div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
      <TextPanel bind:value={leftText} label="Original Text" />
      <TextPanel bind:value={rightText} label="Modified Text" />
    </div>
    <button
      onclick={handleCompare}
      disabled={!leftText && !rightText}
      class="mt-4 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors self-center"
    >
      Compare
    </button>
  {/if}
</div>
