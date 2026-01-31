<script lang="ts">
  interface Props {
    additions: number;
    deletions: number;
    modified?: number;
    hitTimeout?: boolean;
  }

  let { additions, deletions, modified = 0, hitTimeout = false }: Props = $props();
</script>

<footer class="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
  <span class="text-green-600 dark:text-green-400">+{additions} addition{additions !== 1 ? 's' : ''}</span>
  <span class="text-red-600 dark:text-red-400">-{deletions} deletion{deletions !== 1 ? 's' : ''}</span>
  {#if modified > 0}
    <span class="text-yellow-600 dark:text-yellow-400">~{modified} modified</span>
  {/if}
  {#if hitTimeout}
    <span class="text-orange-500 dark:text-orange-400 ml-auto" title="Diff computation timed out. Results may be incomplete.">
      ⚠ Timeout
    </span>
  {/if}
</footer>
