<script lang="ts">
  import { lang, locale } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl } from '$lib/utils';
  import {
    getAllMetadataItems,
    getStringComparisonSegments,
    type DifferingMetadataFields,
  } from '$lib/utils/duplicate-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { getAllAlbums, type AssetResponseDto, type DuplicateAssetAssessmentDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiBookmarkOutline, mdiHeart, mdiImageMultipleOutline, mdiMagnifyPlus } from '@mdi/js';
  import { t, type Translations } from 'svelte-i18n';
  import InfoRow from './InfoRow.svelte';
  import StringComparison from './StringComparison.svelte';

  interface Props {
    asset: AssetResponseDto;
    assets: AssetResponseDto[];
    assessment?: DuplicateAssetAssessmentDto;
    isSelected: boolean;
    onSelectAsset: (asset: AssetResponseDto) => void;
    onViewAsset: (asset: AssetResponseDto) => void;
    differingMetadataFields: DifferingMetadataFields;
    showMore?: boolean;
    initialVisibleCount?: number;
  }

  let {
    asset,
    assets,
    assessment,
    isSelected,
    onSelectAsset,
    onViewAsset,
    differingMetadataFields,
    showMore = false,
    initialVisibleCount = 5,
  }: Props = $props();

  const listFormat = $derived(new Intl.ListFormat($lang));
  const isFromExternalLibrary = $derived(!!asset.libraryId);

  const provenanceLabelKeys: Record<DuplicateAssetAssessmentDto['provenance'], Translations> = {
    'camera-original': 'duplicate_provenance_camera_original',
    'scanner-original': 'duplicate_provenance_scanner_original',
    unknown: 'duplicate_provenance_unknown',
    'camera-derived': 'duplicate_provenance_camera_derived',
    screenshot: 'duplicate_provenance_screenshot',
    generated: 'duplicate_provenance_generated',
  };
  const actionLabelKeys: Record<DuplicateAssetAssessmentDto['recommendedAction'], Translations> = {
    keep: 'duplicate_recommended_keep',
    trash: 'duplicate_recommended_trash',
    review: 'duplicate_recommended_review',
  };
  const actionClasses: Record<DuplicateAssetAssessmentDto['recommendedAction'], string> = {
    keep: 'bg-success/15 text-success dark:bg-success/20',
    trash: 'bg-danger/15 text-danger dark:bg-danger/20',
    review: 'bg-warning/15 text-warning dark:bg-warning/20',
  };

  const visibleMetadataItems = $derived.by(() => {
    const assetIndex = assets.findIndex((comparisonAsset) => comparisonAsset.id === asset.id);
    const comparisonAssets = assetIndex === -1 ? [...assets, asset] : assets;
    const currentAssetIndex = assetIndex === -1 ? comparisonAssets.length - 1 : assetIndex;
    const metadataItemsByAsset = comparisonAssets.map((comparisonAsset) =>
      getAllMetadataItems(comparisonAsset, $t, $locale),
    );

    return getAllMetadataItems(asset, $t, $locale)
      .map((item, index) => {
        const comparedItems = metadataItemsByAsset.map((metadataItems) => metadataItems[index]);
        const renderedValues = comparedItems.map(({ render }) => render);
        const comparisonValues = comparedItems.map(({ comparisonValue }) => comparisonValue);
        const renderedSegments = getStringComparisonSegments(renderedValues);
        const comparisonSegments = getStringComparisonSegments(comparisonValues);
        const hiddenRawDifference =
          renderedSegments.every((segments) => segments.every(({ isDifferent }) => !isDifferent)) &&
          comparisonSegments.some((segments) => segments.some(({ isDifferent }) => isDifferent));

        return {
          ...item,
          comparisonSegments: hiddenRawDifference
            ? [{ text: item.render, isDifferent: true }]
            : renderedSegments[currentAssetIndex],
        };
      })
      .filter(({ keys }) => keys.some((k) => differingMetadataFields[k]))
      .slice(0, showMore ? undefined : initialVisibleCount);
  });
</script>

<div class="flex min-w-60 flex-1 flex-col overflow-hidden rounded-lg border transition-colors">
  <div
    class="grid min-h-48 flex-1 place-items-start gap-y-2 py-2 text-sm transition-colors {isSelected
      ? 'bg-success/15 dark:bg-[#001a06]'
      : 'bg-transparent'}"
  >
    {#if assessment}
      <div class="w-full border-b border-gray-200 px-3 pb-2 dark:border-gray-700" data-testid="provenance-assessment">
        <div class="flex flex-wrap items-center gap-1.5">
          <span
            class="rounded-full bg-immich-primary/10 px-2 py-0.5 font-medium text-immich-primary dark:bg-immich-primary/20"
          >
            {$t(provenanceLabelKeys[assessment.provenance])}
          </span>
          <span class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-700 dark:text-gray-200">
            {$t('duplicate_confidence', { values: { confidence: assessment.confidence } })}
          </span>
          <span class="rounded-full px-2 py-0.5 font-medium {actionClasses[assessment.recommendedAction]}">
            {$t(actionLabelKeys[assessment.recommendedAction])}
          </span>
        </div>
        {#if assessment.evidence.length > 0}
          <ul
            class="mt-1 list-inside list-disc text-xs text-gray-600 dark:text-gray-300"
            title={assessment.evidence.join('\n')}
          >
            {#each assessment.evidence.slice(0, 2) as evidence (evidence)}
              <li class="truncate">{evidence}</li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
    {#each visibleMetadataItems as { icon, title, comparisonValue, keys, comparisonSegments } (keys[0])}
      <InfoRow {icon} {title}>
        <StringComparison value={comparisonValue} segments={comparisonSegments} />
      </InfoRow>
    {/each}

    <!-- Albums always shown -->
    <InfoRow icon={mdiBookmarkOutline} borderBottom={false} title={$t('albums')}>
      {#await getAllAlbums({ assetId: asset.id })}
        {$t('scanning_for_album')}
      {:then albums}
        {#if albums.length === 1}
          {albums[0].albumName}
        {:else}
          <span title={listFormat.format(albums.map(({ albumName }) => albumName))}>
            {$t('in_albums', { values: { count: albums.length } })}
          </span>
        {/if}
      {/await}
    </InfoRow>
  </div>

  <div class="relative h-60 w-full bg-black/5 sm:h-72 xl:h-80 dark:bg-white/5">
    <button
      type="button"
      onclick={() => onSelectAsset(asset)}
      class="relative block size-full"
      aria-pressed={isSelected}
      aria-label={$t('keep')}
    >
      <!-- THUMBNAIL-->
      <img
        src={getAssetMediaUrl({ id: asset.id })}
        alt={$getAltText(toTimelineAsset(asset))}
        class="size-full object-contain"
        draggable="false"
      />

      <!-- FAVORITE ICON -->
      {#if asset.isFavorite}
        <div class="absolute inset-s-2 bottom-2">
          <Icon icon={mdiHeart} size="24" class="text-white" />
        </div>
      {/if}

      <!-- OVERLAY CHIP -->
      <div
        class="absolute inset-e-3 bottom-1 rounded-xl px-4 py-1 text-xs transition-colors {isSelected
          ? 'bg-green-400/90'
          : 'bg-red-300/90'} text-black"
      >
        {isSelected ? $t('keep') : $t('to_trash')}
      </div>

      <!-- EXTERNAL LIBRARY / STACK COUNT CHIP -->
      <div class="absolute inset-e-3 top-2">
        {#if isFromExternalLibrary}
          <div class="rounded-xl bg-immich-primary/90 px-2 py-1 text-xs text-white">
            {$t('external')}
          </div>
        {/if}
        {#if asset.stack?.assetCount}
          <div class="my-0.5 rounded-xl bg-immich-primary/90 px-2 py-1 text-xs text-white">
            <div class="flex items-center justify-center">
              <div class="me-1">{asset.stack.assetCount}</div>
              <Icon icon={mdiImageMultipleOutline} size="18" />
            </div>
          </div>
        {/if}
      </div>
    </button>

    <button
      type="button"
      onclick={() => onViewAsset(asset)}
      class="absolute inset-s-1 top-1 rounded-full bg-black/35 p-2 text-gray-200 hover:bg-black/50 hover:text-white"
      title={$t('view')}
    >
      <Icon aria-label={$t('view')} icon={mdiMagnifyPlus} flipped size="18" />
    </button>
  </div>
</div>
