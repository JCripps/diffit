<script lang="ts">
  interface Props {
    onclear: () => void;
    onswap: () => void;
  }

  let { onclear, onswap }: Props = $props();
</script>

<div class="flex gap-2 mb-4">
  <button
    onclick={onclear}
    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
  >
    Clear
  </button>
  <button
    onclick={onswap}
    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
  >
    Swap
  </button>
</div>
