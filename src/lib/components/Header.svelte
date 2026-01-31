<script lang="ts">
  interface Props {
    onclear: () => void;
    onswap: () => void;
  }

  let { onclear, onswap }: Props = $props();
</script>

<header
  class="flex items-center justify-between pb-4 border-b"
  style="border-color: var(--no-border);"
>
  <h1 class="text-xl font-semibold tracking-tight" style="color: var(--no-fg-primary);">
    Diff-It
  </h1>
  <div class="flex gap-2">
    <button onclick={onclear} class="header-btn">Clear</button>
    <button onclick={onswap} class="header-btn">Swap</button>
  </div>
</header>

<style>
  .header-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--no-fg-primary);
    background-color: var(--no-bg-secondary);
    border: 1px solid var(--no-border);
    border-radius: 0.375rem;
    transition: all 150ms ease;
    cursor: pointer;
  }

  .header-btn:hover {
    background-color: var(--no-hover-bg);
    border-color: var(--no-accent-blue);
  }

  .header-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--no-bg-primary), 0 0 0 4px var(--no-focus-ring);
  }
</style>
