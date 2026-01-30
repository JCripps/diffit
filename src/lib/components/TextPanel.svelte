<script lang="ts">
  interface Props {
    value: string;
    placeholder?: string;
    label: string;
    onchange?: (value: string) => void;
  }

  let { value = $bindable(), placeholder = 'Paste or type text here...', label }: Props = $props();
</script>

<div class="flex flex-col h-full">
  <label class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
    {label}
    <textarea
      bind:value
      {placeholder}
      class="mt-2 flex-1 w-full p-3 font-mono text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent block"
      spellcheck="false"
    ></textarea>
  </label>
</div>
