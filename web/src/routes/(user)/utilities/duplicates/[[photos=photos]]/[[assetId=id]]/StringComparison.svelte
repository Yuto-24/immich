<script lang="ts">
  import type { StringComparisonSegment } from '$lib/utils/duplicate-utils';

  interface Props {
    value: string;
    segments: readonly StringComparisonSegment[];
  }

  let { value, segments }: Props = $props();
</script>

<span title={value}>
  <span class="sr-only">{value}</span>
  <span aria-hidden="true">
    {#each segments as segment, index (index)}
      <span
        class={segment.isDifferent
          ? 'rounded-sm bg-immich-primary/15 px-0.5 font-semibold text-immich-fg dark:bg-immich-primary/25 dark:text-immich-dark-fg'
          : 'text-immich-fg/40 dark:text-immich-dark-fg/40'}>{segment.text}</span
      >
    {/each}
  </span>
</span>
