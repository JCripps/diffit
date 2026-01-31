<script lang="ts">
  interface Props {
    additions: number;
    deletions: number;
    modified?: number;
  }

  let { additions, deletions, modified = 0 }: Props = $props();

  let totalChanges = $derived(additions + deletions + modified);
  let summaryText = $derived(
    totalChanges === 0
      ? 'No differences'
      : `${totalChanges} change${totalChanges !== 1 ? 's' : ''}`
  );
</script>

<footer class="status-bar">
  <div class="stats-group">
    <span class="stat stat-additions" title="{additions} addition{additions !== 1 ? 's' : ''}">
      +{additions}
    </span>
    <span class="stat stat-deletions" title="{deletions} deletion{deletions !== 1 ? 's' : ''}">
      -{deletions}
    </span>
    {#if modified > 0}
      <span class="stat stat-modified" title="{modified} modified">
        ~{modified}
      </span>
    {/if}
  </div>

  <span class="summary-text">{summaryText}</span>
</footer>

<style>
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-top: 1px solid var(--no-border-subtle);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
  }

  .stats-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .stat {
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  .stat-additions {
    color: var(--no-diff-add);
  }

  .stat-deletions {
    color: var(--no-diff-del);
  }

  .stat-modified {
    color: var(--no-diff-mod);
  }

  .summary-text {
    color: var(--no-fg-secondary);
    font-weight: 500;
    font-family: inherit;
  }
</style>
