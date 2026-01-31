<script lang="ts">
  import { Eraser, ArrowLeftRight, Plus } from 'lucide-svelte';

  interface Props {
    onclear: () => void;
    onswap: () => void;
    onNewTab?: () => void;
  }

  let { onclear, onswap, onNewTab }: Props = $props();
</script>

<header
  class="flex items-center justify-between pb-3 border-b"
  style="border-color: var(--no-border);"
>
  <div class="logo">
    <span class="logo-symbol">&lt;/&gt;</span>
    <span class="logo-divider"></span>
    <span class="logo-text"><span class="logo-diff">diff</span><span class="logo-it">-it</span></span>
  </div>
  <div class="flex gap-1.5">
    {#if onNewTab}
      <button onclick={onNewTab} class="header-btn" title="New tab (Cmd+T)">
        <Plus size={14} />
        <span>New Tab</span>
      </button>
    {/if}
    <button onclick={onclear} class="header-btn">
      <Eraser size={14} />
      <span>Clear</span>
    </button>
    <button onclick={onswap} class="header-btn">
      <ArrowLeftRight size={14} />
      <span>Swap</span>
    </button>
  </div>
</header>

<style>
  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-mono);
  }

  .logo-symbol {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--no-fg-muted);
  }

  .logo-divider {
    width: 1px;
    height: 1rem;
    background-color: var(--no-border);
  }

  .logo-text {
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .logo-diff {
    color: var(--no-accent-blue);
  }

  .logo-it {
    color: var(--no-fg-muted);
  }

  .header-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--no-fg-secondary);
    background-color: transparent;
    border: none;
    border-radius: 4px;
    transition: all 120ms ease;
    cursor: pointer;
  }

  .header-btn:hover {
    background-color: var(--no-hover-bg);
    color: var(--no-fg-primary);
  }

  .header-btn:active {
    background-color: var(--no-active-bg);
  }

  .header-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--no-focus-ring);
  }
</style>
