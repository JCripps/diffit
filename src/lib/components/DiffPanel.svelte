<script lang="ts">
  import type { LineDiff } from '$lib/types/diff';
  import DiffLine from './DiffLine.svelte';

  interface Props {
    lines: LineDiff[];
    side: 'left' | 'right';
    label: string;
  }

  let { lines, side, label }: Props = $props();
</script>

<div class="flex flex-col h-full overflow-hidden">
  <div class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{label}</div>
  <div class="flex-1 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
    {#each lines as line, i (i)}
      <DiffLine {line} {side} />
    {/each}
    {#if lines.length === 0}
      <div class="p-4 text-gray-400 dark:text-gray-500 text-center">No diff to display</div>
    {/if}
  </div>
</div>
