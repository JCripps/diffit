<script lang="ts">
  import type { LineDiff } from '$lib/types/diff';

  interface Props {
    line: LineDiff;
    side: 'left' | 'right';
  }

  let { line, side }: Props = $props();

  const bgClass = $derived(() => {
    if (line.changeType === 'added') {
      return side === 'right' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-800/50';
    }
    if (line.changeType === 'removed') {
      return side === 'left' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-800/50';
    }
    return '';
  });

  const textClass = $derived(() => {
    if (line.changeType === 'added' && side === 'right') {
      return 'text-green-800 dark:text-green-200';
    }
    if (line.changeType === 'removed' && side === 'left') {
      return 'text-red-800 dark:text-red-200';
    }
    return 'text-gray-700 dark:text-gray-300';
  });
</script>

<div class="flex font-mono text-sm min-h-[1.5rem] {bgClass()}">
  <div class="w-12 flex-shrink-0 px-2 text-right text-gray-400 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-700">
    {line.lineNumber ?? ''}
  </div>
  <div class="flex-1 px-2 whitespace-pre {textClass()}">
    {line.content || '\u00A0'}
  </div>
</div>
