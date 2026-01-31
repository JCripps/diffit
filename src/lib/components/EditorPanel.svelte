<script lang="ts">
  import type { LineDiff, ChangeType } from '$lib/types/diff';
  import DiffLine from './DiffLine.svelte';

  interface Props {
    value: string;
    lines: LineDiff[];
    side: 'left' | 'right';
    label: string;
  }

  let { value = $bindable(), lines, side, label }: Props = $props();

  let textareaRef: HTMLTextAreaElement | null = $state(null);
  let gutterRef: HTMLDivElement | null = $state(null);
  let highlightRef: HTMLDivElement | null = $state(null);

  // Line count from actual value (for gutter)
  let valueLines = $derived(value ? value.split('\n') : ['']);

  // Build a map of line number to diff info
  let lineDiffMap = $derived.by(() => {
    const map = new Map<number, LineDiff>();
    for (const line of lines) {
      if (line.lineNumber !== null) {
        map.set(line.lineNumber, line);
      }
    }
    return map;
  });

  function getLineBackgroundClass(lineNum: number): string {
    const diffInfo = lineDiffMap.get(lineNum);
    if (!diffInfo) return '';

    if (diffInfo.changeType === 'added' && side === 'right') {
      return 'bg-green-100 dark:bg-green-900/30';
    }
    if (diffInfo.changeType === 'removed' && side === 'left') {
      return 'bg-red-100 dark:bg-red-900/30';
    }
    if (diffInfo.changeType === 'modified') {
      return side === 'left'
        ? 'bg-red-100 dark:bg-red-900/30'
        : 'bg-green-100 dark:bg-green-900/30';
    }
    return '';
  }

  function getLineDiff(lineNum: number): LineDiff | undefined {
    return lineDiffMap.get(lineNum);
  }

  function handleScroll() {
    if (textareaRef && gutterRef && highlightRef) {
      gutterRef.scrollTop = textareaRef.scrollTop;
      highlightRef.scrollTop = textareaRef.scrollTop;
    }
  }
</script>

<div class="flex flex-col h-full overflow-hidden">
  <div class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{label}</div>
  <div class="flex flex-1 overflow-hidden bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
    <!-- Line number gutter -->
    <div
      bind:this={gutterRef}
      class="flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 select-none overflow-hidden"
    >
      {#each valueLines as _, i (i)}
        <div class="w-12 h-6 px-2 text-right text-gray-400 dark:text-gray-500 font-mono text-sm leading-6">
          {i + 1}
        </div>
      {/each}
    </div>

    <!-- Editor area with highlight overlay -->
    <div class="relative flex-1 overflow-hidden">
      <!-- Background highlight layer -->
      <div
        bind:this={highlightRef}
        class="absolute inset-0 overflow-hidden pointer-events-none"
      >
        {#each valueLines as lineContent, i (i)}
          {@const lineNum = i + 1}
          {@const diffInfo = getLineDiff(lineNum)}
          <div class="h-6 px-2 font-mono text-sm leading-6 {getLineBackgroundClass(lineNum)}">
            {#if diffInfo?.charChanges && diffInfo.charChanges.length > 0}
              <DiffLine content={lineContent} charChanges={diffInfo.charChanges} {side} />
            {/if}
          </div>
        {/each}
      </div>

      <!-- Textarea for editing -->
      <textarea
        bind:this={textareaRef}
        bind:value
        onscroll={handleScroll}
        placeholder="Paste or type text here..."
        spellcheck="false"
        class="absolute inset-0 w-full h-full px-2 font-mono text-sm leading-6 text-gray-700 dark:text-gray-300 bg-transparent resize-none outline-none"
      ></textarea>
    </div>
  </div>
</div>
