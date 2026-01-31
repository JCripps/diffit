<script lang="ts">
  import type { CharChange } from '$lib/types/diff';

  interface Props {
    content: string;
    charChanges?: CharChange[];
    side: 'left' | 'right';
  }

  let { content, charChanges, side }: Props = $props();

  interface Segment {
    text: string;
    isChanged: boolean;
  }

  // Build segments from character changes
  let segments = $derived.by(() => {
    if (!charChanges || charChanges.length === 0) {
      return [{ text: content, isChanged: false }];
    }

    const result: Segment[] = [];
    let currentPos = 0;

    // Sort changes by start position
    const sortedChanges = [...charChanges].sort((a, b) => a.start - b.start);

    for (const change of sortedChanges) {
      // Add unchanged text before this change
      if (change.start > currentPos) {
        result.push({
          text: content.substring(currentPos, change.start),
          isChanged: false,
        });
      }

      // Add the changed text
      if (change.end > change.start) {
        result.push({
          text: content.substring(change.start, change.end),
          isChanged: true,
        });
      }

      currentPos = change.end;
    }

    // Add any remaining unchanged text
    if (currentPos < content.length) {
      result.push({
        text: content.substring(currentPos),
        isChanged: false,
      });
    }

    return result;
  });

  function getHighlightClass(isChanged: boolean): string {
    if (!isChanged) return '';
    return side === 'left'
      ? 'bg-red-300 dark:bg-red-700/60'
      : 'bg-green-300 dark:bg-green-700/60';
  }
</script>

<span class="whitespace-pre">{#each segments as segment}<span class={getHighlightClass(segment.isChanged)}>{segment.text}</span>{/each}</span>
