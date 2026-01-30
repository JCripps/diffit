<script lang="ts">
  import { computeDiff } from '$lib/utils/diff';
  import type { DiffResult } from '$lib/types/diff';
  import Header from './Header.svelte';
  import Footer from './Footer.svelte';
  import EditorPanel from './EditorPanel.svelte';

  let leftText = $state('');
  let rightText = $state('');

  // Debounced values for diff calculation
  let debouncedLeft = $state('');
  let debouncedRight = $state('');

  // Debounce the text values
  $effect(() => {
    const left = leftText;
    const right = rightText;
    const timeout = setTimeout(() => {
      debouncedLeft = left;
      debouncedRight = right;
    }, 200);
    return () => clearTimeout(timeout);
  });

  // Compute diff from debounced values
  let diffResult: DiffResult = $derived(computeDiff(debouncedLeft, debouncedRight));

  function handleClear() {
    leftText = '';
    rightText = '';
    debouncedLeft = '';
    debouncedRight = '';
  }

  function handleSwap() {
    const temp = leftText;
    leftText = rightText;
    rightText = temp;
  }
</script>

<div class="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 p-4">
  <Header onclear={handleClear} onswap={handleSwap} />

  <main class="flex-1 grid grid-cols-2 gap-4 min-h-0 py-4">
    <EditorPanel
      bind:value={leftText}
      lines={diffResult.leftLines}
      side="left"
      label="Original"
    />
    <EditorPanel
      bind:value={rightText}
      lines={diffResult.rightLines}
      side="right"
      label="Modified"
    />
  </main>

  <Footer additions={diffResult.stats.additions} deletions={diffResult.stats.deletions} />
</div>
