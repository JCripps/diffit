<script lang="ts">
  interface Props {
    onclear: () => void;
    onswap: () => void;
  }

  let { onclear, onswap }: Props = $props();
</script>

<header class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
  <h1 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Diff-It</h1>
  <div class="flex gap-2">
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
</header>
