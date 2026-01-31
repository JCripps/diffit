<script lang="ts">
  interface Props {
    additions: number;
    deletions: number;
    modified?: number;
  }

  let { additions, deletions, modified = 0 }: Props = $props();
</script>

<footer
  class="flex items-center gap-4 pt-4 border-t text-sm font-medium"
  style="border-color: var(--no-border);"
>
  <div class="stat-item stat-additions">
    <span class="stat-indicator"></span>
    <span>+{additions} addition{additions !== 1 ? 's' : ''}</span>
  </div>

  <div class="stat-item stat-deletions">
    <span class="stat-indicator"></span>
    <span>-{deletions} deletion{deletions !== 1 ? 's' : ''}</span>
  </div>

  {#if modified > 0}
    <div class="stat-item stat-modified">
      <span class="stat-indicator"></span>
      <span>~{modified} modified</span>
    </div>
  {/if}
</footer>

<style>
  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    background-color: var(--no-bg-secondary);
  }

  .stat-indicator {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
  }

  .stat-additions { color: var(--no-diff-add); }
  .stat-additions .stat-indicator { background-color: var(--no-diff-add); }

  .stat-deletions { color: var(--no-diff-del); }
  .stat-deletions .stat-indicator { background-color: var(--no-diff-del); }

  .stat-modified { color: var(--no-diff-mod); }
  .stat-modified .stat-indicator { background-color: var(--no-diff-mod); }
</style>
