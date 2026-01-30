<script lang="ts">
  interface Props {
    additions: number;
    deletions: number;
  }

  let { additions, deletions }: Props = $props();
</script>

<footer class="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
  <span class="text-green-600 dark:text-green-400">+{additions} addition{additions !== 1 ? 's' : ''}</span>
  <span class="text-red-600 dark:text-red-400">-{deletions} deletion{deletions !== 1 ? 's' : ''}</span>
</footer>
